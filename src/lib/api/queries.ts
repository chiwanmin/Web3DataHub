import { prisma } from "@/lib/db";
import { CHAINS, getChain, type ChainMeta } from "@/lib/chains/registry";
import { computeChainHealth, type HealthScore } from "@/lib/health";

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

export interface ChainOverviewRow {
  id: string;
  name: string;
  short: string;
  symbol: string;
  consensus: string;
  family: string;
  color: string;
  height: number | null;
  avgBlockTime: number | null;
  gasUsedRatio: number | null;
  status: "ok" | "warn" | "bad" | "stale";
  health: HealthScore;
}

export async function getOverview(): Promise<{
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  rows: ChainOverviewRow[];
}> {
  const rows: ChainOverviewRow[] = await Promise.all(
    CHAINS.map(async (chain) => {
      const [latest, recent] = await Promise.all([
        prisma.blockSample.findFirst({
          where: { chainId: chain.id },
          orderBy: { height: "desc" },
        }),
        prisma.blockSample.findMany({
          where: { chainId: chain.id },
          orderBy: { height: "desc" },
          take: 30,
        }),
      ]);

      const avgBlockTime = recent.length
        ? recent.reduce((a, b) => a + b.blockTime, 0) / recent.length
        : null;

      let gasUsedRatio: number | null = null;
      if (latest?.gasUsed && latest.gasLimit) {
        gasUsedRatio = Number(BigInt(latest.gasUsed)) / Number(BigInt(latest.gasLimit));
      }

      const health = await computeChainHealth(chain);

      const ageMs = latest ? Date.now() - latest.timestamp.getTime() : Infinity;
      const stale = ageMs > Math.max(60_000, chain.normalBlockTime * 5_000);

      return {
        id: chain.id,
        name: chain.name,
        short: chain.short,
        symbol: chain.symbol,
        consensus: chain.consensus,
        family: chain.family,
        color: chain.color,
        height: latest ? Number(latest.height) : null,
        avgBlockTime,
        gasUsedRatio,
        status: stale ? "stale" : health.level,
        health,
      };
    }),
  );

  return {
    total: rows.length,
    healthy: rows.filter((r) => r.health.level === "ok").length,
    warning: rows.filter((r) => r.health.level === "warn").length,
    critical: rows.filter((r) => r.health.level === "bad").length,
    rows,
  };
}

export async function getBlocksDetail(chain: ChainMeta) {
  const [latest, recent24h, recent10] = await Promise.all([
    prisma.blockSample.findFirst({
      where: { chainId: chain.id },
      orderBy: { height: "desc" },
    }),
    prisma.blockSample.findMany({
      where: { chainId: chain.id, timestamp: { gte: new Date(Date.now() - DAY) } },
      orderBy: { timestamp: "asc" },
      take: 720,
    }),
    prisma.blockSample.findMany({
      where: { chainId: chain.id },
      orderBy: { height: "desc" },
      take: 10,
    }),
  ]);

  const avg24 = recent24h.length
    ? recent24h.reduce((a, b) => a + b.blockTime, 0) / recent24h.length
    : null;

  const reorgs24h = recent24h.filter((r) => r.reorg);
  const maxReorgDepth = reorgs24h.reduce(
    (m, r) => Math.max(m, r.reorgDepth ?? 1),
    0,
  );

  const trend = downsample(
    recent24h.map((b) => ({
      t: b.timestamp.toISOString(),
      v: b.blockTime,
    })),
    60,
  );

  const recentBars = recent10
    .map((b) => ({
      label: `#${b.height.toString().slice(-7)}`,
      value: b.blockTime,
      height: b.height.toString(),
    }))
    .reverse();

  return {
    chain,
    latestHeight: latest ? latest.height.toString() : null,
    avgBlockTime: avg24,
    finality: chain.finality,
    reorgs24h: reorgs24h.length,
    maxReorgDepth,
    trend,
    recentBars,
    suggestedConfirmations: chain.defaultConfirmations,
  };
}

export async function getGasDetail(chain: ChainMeta) {
  const [latest, last24h, last7d] = await Promise.all([
    prisma.gasSample.findFirst({
      where: { chainId: chain.id },
      orderBy: { timestamp: "desc" },
    }),
    prisma.gasSample.findMany({
      where: { chainId: chain.id, timestamp: { gte: new Date(Date.now() - DAY) } },
      orderBy: { timestamp: "asc" },
      take: 720,
    }),
    prisma.gasSample.findMany({
      where: { chainId: chain.id, timestamp: { gte: new Date(Date.now() - 7 * DAY) } },
      orderBy: { timestamp: "asc" },
    }),
  ]);

  const trend24h = downsample(
    last24h.map((g) => ({ t: g.timestamp.toISOString(), v: g.standard })),
    96,
  );

  const dayBuckets = new Map<string, number[]>();
  for (const g of last7d) {
    const d = g.timestamp.toISOString().slice(0, 10);
    if (!dayBuckets.has(d)) dayBuckets.set(d, []);
    dayBuckets.get(d)!.push(g.standard);
  }
  const week = Array.from(dayBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([d, vs]) => ({
      label: d.slice(5),
      value: vs.reduce((a, b) => a + b, 0) / vs.length,
    }));

  const hourBuckets = new Array(24).fill(0).map(() => [] as number[]);
  for (const g of last7d) {
    hourBuckets[g.timestamp.getUTCHours()].push(g.standard);
  }
  const hourly = hourBuckets.map((vs, h) => ({
    hour: h,
    avg: vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : 0,
  }));
  const lowest = hourly
    .filter((h) => h.avg > 0)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 4)
    .map((h) => h.hour)
    .sort((a, b) => a - b);

  let recommendedWindow = "周日 02:00 - 06:00 UTC";
  if (lowest.length >= 2) {
    recommendedWindow = `${lowest[0].toString().padStart(2, "0")}:00 - ${(
      lowest[lowest.length - 1] + 1
    )
      .toString()
      .padStart(2, "0")}:00 UTC`;
  }

  return {
    chain,
    latest: latest
      ? {
          fast: latest.fast,
          standard: latest.standard,
          slow: latest.slow,
          baseFee: latest.baseFee,
          priority: latest.priority,
        }
      : null,
    trend24h,
    week,
    recommendedWindow,
    hourly,
  };
}

export async function getLoadDetail(chain: ChainMeta) {
  const last24h = await prisma.blockSample.findMany({
    where: { chainId: chain.id, timestamp: { gte: new Date(Date.now() - DAY) } },
    orderBy: { timestamp: "asc" },
    take: 720,
  });
  const last10 = await prisma.blockSample.findMany({
    where: { chainId: chain.id },
    orderBy: { height: "desc" },
    take: 10,
  });
  const mempool = await prisma.mempoolSample.findFirst({
    where: { chainId: chain.id },
    orderBy: { timestamp: "desc" },
  });

  const avgTx = last24h.length ? avg(last24h.map((b) => b.txCount)) : 0;

  const lastWithGas = [...last24h].reverse().find((b) => b.gasUsed && b.gasLimit);
  const gasUsedRatio = lastWithGas
    ? Number(BigInt(lastWithGas.gasUsed!)) / Number(BigInt(lastWithGas.gasLimit!))
    : null;

  const avgSize = avg(last24h.map((b) => b.size ?? 0).filter((n) => n > 0));

  const tps = avgTx && chain.normalBlockTime > 0 ? avgTx / chain.normalBlockTime : 0;

  const txTrend = downsample(
    last24h.map((b) => ({ t: b.timestamp.toISOString(), v: b.txCount })),
    96,
  );
  const gasTrend = downsample(
    last24h
      .filter((b) => b.gasUsed && b.gasLimit)
      .map((b) => ({
        t: b.timestamp.toISOString(),
        v: Number(BigInt(b.gasUsed!)) / Number(BigInt(b.gasLimit!)),
      })),
    96,
  );

  const recentBars = last10
    .map((b) => ({
      label: `#${b.height.toString().slice(-7)}`,
      value: b.txCount,
    }))
    .reverse();

  const allChains = await Promise.all(
    CHAINS.map(async (c) => {
      const last = await prisma.blockSample.findMany({
        where: { chainId: c.id },
        orderBy: { height: "desc" },
        take: 30,
      });
      return {
        chainId: c.id,
        name: c.name,
        color: c.color,
        avgTx: last.length ? Math.round(avg(last.map((b) => b.txCount))) : 0,
      };
    }),
  );

  return {
    chain,
    avgTx: Math.round(avgTx),
    gasUsedRatio,
    avgSize: avgSize ? Math.round(avgSize / 1024 * 10) / 10 : null,
    pendingPool: mempool?.pending ?? null,
    tps: Math.round(tps * 10) / 10,
    txTrend,
    gasTrend,
    recentBars,
    compare: allChains.sort((a, b) => b.avgTx - a.avgTx),
  };
}

export async function getNodes() {
  const versions = await prisma.nodeVersion.findMany();
  const map = new Map(versions.map((v) => [v.chainId, v]));
  const rows = CHAINS.map((c) => {
    const v = map.get(c.id);
    return {
      chainId: c.id,
      name: c.name,
      color: c.color,
      client: c.client,
      currentVer: v?.currentVer ?? "—",
      latestVer: v?.latestVer ?? "—",
      releaseDate: v?.releaseDate ?? null,
      isHardFork: v?.isHardFork ?? false,
      status: v
        ? v.currentVer === v.latestVer
          ? "current"
          : "outdated"
        : "unknown",
    };
  });
  return {
    total: rows.length,
    needUpdate: rows.filter((r) => r.status === "outdated").length,
    upToDate: rows.filter((r) => r.status === "current").length,
    hardForkPending: rows.filter((r) => r.isHardFork && r.status === "outdated").length,
    rows,
  };
}

export async function getUpgrades() {
  return prisma.networkUpgrade.findMany({
    orderBy: [{ severity: "asc" }, { scheduledAt: "asc" }],
  });
}

export async function getCommunity() {
  const list = await prisma.communityMetric.findMany();
  const map = new Map(list.map((c) => [c.chainId, c]));
  return CHAINS.map((c) => {
    const m = map.get(c.id);
    return {
      chainId: c.id,
      name: c.name,
      color: c.color,
      stars: m?.stars ?? 0,
      weeklyCommits: m?.weeklyCommits ?? 0,
      openIssues: m?.openIssues ?? 0,
      activeDevs: m?.activeDevs ?? 0,
    };
  });
}

export async function getAlerts() {
  const items = await prisma.alert.findMany({
    where: { resolvedAt: null },
    orderBy: { triggeredAt: "desc" },
    take: 100,
  });
  const counts = {
    total: items.length,
    critical: items.filter((a) => a.severity === "critical").length,
    warning: items.filter((a) => a.severity === "warning").length,
    info: items.filter((a) => a.severity === "info").length,
  };
  return {
    counts,
    items: items.map((a) => ({
      id: a.id,
      chainId: a.chainId,
      chainName: getChain(a.chainId)?.name ?? a.chainId,
      rule: a.rule,
      severity: a.severity as "critical" | "warning" | "info",
      title: a.title,
      body: a.body,
      triggeredAt: a.triggeredAt,
      meta: a.meta ? safeJson(a.meta) : null,
    })),
  };
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function avg(xs: number[]) {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function downsample<T extends { t: string; v: number }>(rows: T[], buckets: number): T[] {
  if (rows.length <= buckets) return rows;
  const step = rows.length / buckets;
  const out: T[] = [];
  for (let i = 0; i < buckets; i++) {
    const slice = rows.slice(Math.floor(i * step), Math.floor((i + 1) * step));
    if (!slice.length) continue;
    const v = slice.reduce((a, b) => a + b.v, 0) / slice.length;
    out.push({ ...slice[Math.floor(slice.length / 2)], v });
  }
  return out;
}
