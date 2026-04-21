import { prisma } from "@/lib/db";
import { CHAINS } from "@/lib/chains/registry";
import { compareVersions } from "@/lib/github";

export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertCandidate {
  chainId: string;
  rule: string;
  severity: AlertSeverity;
  title: string;
  body: string;
  meta?: Record<string, unknown>;
  /** Bucket for dedupe (1h / 1d) */
  dedupeBucketMs?: number;
}

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

function bucket(ms: number): string {
  return String(Math.floor(Date.now() / ms));
}

export async function evaluateAllAlerts(): Promise<AlertCandidate[]> {
  const out: AlertCandidate[] = [];

  for (const chain of CHAINS) {
    const since24h = new Date(Date.now() - DAY);
    const since7d = new Date(Date.now() - 7 * DAY);

    const recent = await prisma.blockSample.findMany({
      where: { chainId: chain.id, timestamp: { gte: since24h } },
      orderBy: { timestamp: "desc" },
      take: 500,
    });

    if (recent[0]) {
      const stallMs = Date.now() - recent[0].timestamp.getTime();
      // Threshold: max(15x block time, 5 min). Bitcoin blocks naturally vary
      // 1-60 min, so we need a generous multiplier to avoid false positives.
      const stallThreshold = Math.max(
        5 * 60 * 1000,
        chain.normalBlockTime * 15 * 1000,
      );
      if (stallMs > stallThreshold) {
        out.push({
          chainId: chain.id,
          rule: "block_stall",
          severity: "critical",
          title: `${chain.name} 出块停滞`,
          body: `已超过 ${Math.round(stallMs / 60000)} 分钟未观察到新区块（基线 ${chain.normalBlockTime}s）。`,
          dedupeBucketMs: HOUR,
          meta: { stallMs, lastHeight: recent[0].height.toString() },
        });
      }
    }

    const reorgs = recent.filter((r) => r.reorg);
    if (reorgs.length > 0) {
      const maxDepth = Math.max(...reorgs.map((r) => r.reorgDepth ?? 1));
      const baseline = chain.family === "btc" ? 1 : 2;
      if (maxDepth > baseline * 2) {
        out.push({
          chainId: chain.id,
          rule: "reorg_depth",
          severity: "critical",
          title: `${chain.name} reorg 深度异常`,
          body: `检测到深度 ${maxDepth} blocks 的 reorg，超出 ${chain.name} 基线 (${baseline}) 2x。`,
          dedupeBucketMs: HOUR,
          meta: { depth: maxDepth, baseline },
        });
      }
      if (reorgs.length > 3) {
        out.push({
          chainId: chain.id,
          rule: "reorg_frequency",
          severity: "warning",
          title: `${chain.name} 链 reorg 频率上升`,
          body: `24h 内发生 ${reorgs.length} 次 reorg，最大深度 ${maxDepth} blocks。`,
          dedupeBucketMs: 6 * HOUR,
          meta: { count: reorgs.length, maxDepth },
        });
      }
    }

    const node = await prisma.nodeVersion.findUnique({ where: { chainId: chain.id } });
    if (node) {
      const cmp = compareVersions(node.currentVer, node.latestVer);
      if (cmp < 0) {
        const norm = (v: string) => v.replace(/^v/i, "").split(".").map(Number);
        const minorBehind = (norm(node.latestVer)[1] ?? 0) - (norm(node.currentVer)[1] ?? 0);
        if (minorBehind >= 2) {
          out.push({
            chainId: chain.id,
            rule: "version_outdated",
            severity: "warning",
            title: `${chain.name} 节点版本过旧`,
            body: `当前 ${node.currentVer}，最新 ${node.latestVer}（落后 ${minorBehind} 个版本）。`,
            dedupeBucketMs: DAY,
          });
        }
      }
      if (node.isHardFork) {
        out.push({
          chainId: chain.id,
          rule: "hardfork_due",
          severity: "critical",
          title: `${chain.name} 强制硬分叉升级`,
          body: `节点 ${node.currentVer} → ${node.latestVer} 包含硬分叉变更，未升级将导致脱离共识。`,
          dedupeBucketMs: 6 * HOUR,
        });
      }
    }

    const upgrades = await prisma.networkUpgrade.findMany({
      where: { chainId: chain.id, status: "upcoming", scheduledAt: { not: null } },
    });
    for (const u of upgrades) {
      if (!u.scheduledAt) continue;
      const daysUntil = (u.scheduledAt.getTime() - Date.now()) / DAY;
      if (daysUntil > 0 && daysUntil < 7 && u.severity === "critical") {
        out.push({
          chainId: chain.id,
          rule: "hardfork_due",
          severity: "critical",
          title: `${chain.name} ${u.title}`,
          body: `${u.description} · 距离生效仅剩 ${Math.ceil(daysUntil)} 天。`,
          dedupeBucketMs: 6 * HOUR,
          meta: { upgradeId: u.id },
        });
      }
    }

    const gas7d = await prisma.gasSample.findMany({
      where: { chainId: chain.id, timestamp: { gte: since7d } },
      orderBy: { timestamp: "desc" },
      take: 2000,
    });
    const latest = gas7d[0];
    if (latest && gas7d.length > 50) {
      const mean = gas7d.reduce((a, b) => a + b.standard, 0) / gas7d.length;
      if (latest.standard > mean * 5) {
        out.push({
          chainId: chain.id,
          rule: "gas_spike",
          severity: "warning",
          title: `${chain.name} Gas 费异常飙升`,
          body: `当前 ${latest.standard} Gwei，超过 7d 均值 (${mean.toFixed(1)}) 5x。`,
          dedupeBucketMs: 2 * HOUR,
        });
      }
    }
  }

  return out;
}

export async function persistAlerts(candidates: AlertCandidate[]): Promise<number> {
  let inserted = 0;
  for (const c of candidates) {
    const dedupe = `${c.chainId}:${c.rule}:${bucket(c.dedupeBucketMs ?? HOUR)}`;
    // Pre-check + create (instead of catch on unique violation) so Prisma
    // doesn't spam its stderr "prisma:error" log on every dedupe hit.
    const existing = await prisma.alert.findUnique({ where: { dedupeKey: dedupe } });
    if (existing) continue;
    try {
      await prisma.alert.create({
        data: {
          chainId: c.chainId,
          rule: c.rule,
          severity: c.severity,
          title: c.title,
          body: c.body,
          dedupeKey: dedupe,
          meta: c.meta ? JSON.stringify(c.meta) : null,
        },
      });
      inserted++;
    } catch {
      // race — another concurrent evaluator beat us; safe to ignore.
    }
  }
  return inserted;
}
