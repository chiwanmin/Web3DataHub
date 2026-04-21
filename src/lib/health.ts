import { prisma } from "@/lib/db";
import { getChain, type ChainMeta } from "@/lib/chains/registry";
import { compareVersions } from "@/lib/github";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export interface HealthBreakdown {
  blockStability: number;
  gasReasonable: number;
  txCapacity: number;
  reorgPenalty: number;
  versionFresh: number;
  communityHealth: number;
}

export interface HealthScore {
  chainId: string;
  score: number;
  /** "ok" >=90, "warn" 70-89, "bad" <70 */
  level: "ok" | "warn" | "bad";
  breakdown: HealthBreakdown;
}

export async function computeChainHealth(chain: ChainMeta): Promise<HealthScore> {
  const since24h = new Date(Date.now() - 24 * 3600 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [recent, gas7d, currentGas, version, community] = await Promise.all([
    prisma.blockSample.findMany({
      where: { chainId: chain.id, timestamp: { gte: since24h } },
      orderBy: { timestamp: "desc" },
      take: 200,
    }),
    prisma.gasSample.findMany({
      where: { chainId: chain.id, timestamp: { gte: since7d } },
      orderBy: { timestamp: "desc" },
      take: 1000,
    }),
    prisma.gasSample.findFirst({
      where: { chainId: chain.id },
      orderBy: { timestamp: "desc" },
    }),
    prisma.nodeVersion.findUnique({ where: { chainId: chain.id } }),
    prisma.communityMetric.findUnique({ where: { chainId: chain.id } }),
  ]);

  const blockTimes = recent.map((r) => r.blockTime).filter((t) => t > 0);
  const blockStability = blockTimes.length >= 3
    ? clamp01(1 - stdDev(blockTimes) / chain.normalBlockTime)
    : 0.5;

  const p50 = median(gas7d.map((g) => g.standard));
  const gasReasonable = currentGas && p50
    ? clamp01(1 - Math.abs(currentGas.standard - p50) / Math.max(p50, 1))
    : 0.5;

  const recentTxAvg = avg(recent.slice(0, 30).map((r) => r.txCount));
  const histTxP90 = percentile(recent.slice(30).map((r) => r.txCount), 0.9) || recentTxAvg || 1;
  const txCapacity = clamp01(recentTxAvg / Math.max(histTxP90, 1));

  const reorgs = recent.filter((r) => r.reorg).length;
  const reorgPenalty = clamp01(reorgs / 10);

  let versionFresh = 0.7;
  if (version) {
    const cmp = compareVersions(version.currentVer, version.latestVer);
    if (cmp >= 0) versionFresh = 1;
    else {
      const norm = (v: string) => v.replace(/^v/i, "").split(".").map(Number);
      const minor = Math.abs((norm(version.latestVer)[1] ?? 0) - (norm(version.currentVer)[1] ?? 0));
      versionFresh = clamp01(1 - minor * 0.3);
    }
  }

  let communityHealth = 0.6;
  if (community) {
    const stars = clamp01(Math.log10(community.stars + 1) / 5);
    const commits = clamp01(community.weeklyCommits / 100);
    const devs = clamp01(community.activeDevs / 100);
    communityHealth = stars * 0.3 + commits * 0.4 + devs * 0.3;
  }

  const score =
    30 * blockStability +
    15 * gasReasonable +
    15 * txCapacity +
    20 * (1 - reorgPenalty) +
    10 * versionFresh +
    10 * communityHealth;

  const rounded = Math.round(score);
  const level: HealthScore["level"] =
    rounded >= 90 ? "ok" : rounded >= 70 ? "warn" : "bad";

  return {
    chainId: chain.id,
    score: rounded,
    level,
    breakdown: {
      blockStability,
      gasReasonable,
      txCapacity,
      reorgPenalty,
      versionFresh,
      communityHealth,
    },
  };
}

export async function computeAllHealth(): Promise<HealthScore[]> {
  const chains = (await prisma.chainConfig.findMany({ where: { enabled: true } })).map((c) =>
    getChain(c.id),
  );
  const enabled = chains.filter((c): c is ChainMeta => Boolean(c));
  return Promise.all(enabled.map((c) => computeChainHealth(c)));
}

function avg(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = avg(xs);
  const v = avg(xs.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function percentile(xs: number[], p: number): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.floor(s.length * p));
  return s[idx];
}
