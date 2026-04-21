import { prisma } from "@/lib/db";
import { CHAINS } from "@/lib/chains/registry";
import {
  detectHardFork,
  fetchLatestRelease,
  fetchRepoMeta,
  fetchWeeklyCommits,
} from "@/lib/github";

/**
 * For demo/dev parity, "current version" is taken from any seed in DB; if absent
 * we fall back to "one minor behind latest" so the UI stays meaningful even
 * before any operator has registered the actual node binaries.
 */
function deriveCurrentFallback(latest: string): string {
  const parts = latest.replace(/^v/i, "").split(".");
  if (parts.length < 3) return latest;
  const minor = Math.max(0, Number(parts[1]) - 1);
  return `v${parts[0]}.${minor}.${parts[2]}`;
}

export async function collectNodeVersionFor(chainId: string): Promise<void> {
  const chain = CHAINS.find((c) => c.id === chainId);
  if (!chain) return;

  let release;
  try {
    release = await fetchLatestRelease(chain.githubRepo);
  } catch (err) {
    console.warn(`[nodeVersions] ${chainId} releases failed:`, (err as Error).message);
    return;
  }
  if (!release) return;

  const existing = await prisma.nodeVersion.findUnique({ where: { chainId } });
  const current = existing?.currentVer ?? deriveCurrentFallback(release.tag_name);

  await prisma.nodeVersion.upsert({
    where: { chainId },
    update: {
      latestVer: release.tag_name,
      releaseDate: new Date(release.published_at),
      isHardFork: detectHardFork(release),
    },
    create: {
      chainId,
      client: chain.client,
      currentVer: current,
      latestVer: release.tag_name,
      releaseDate: new Date(release.published_at),
      isHardFork: detectHardFork(release),
    },
  });

  try {
    const [meta, weekly] = await Promise.all([
      fetchRepoMeta(chain.githubRepo),
      fetchWeeklyCommits(chain.githubRepo),
    ]);
    if (meta) {
      await prisma.communityMetric.upsert({
        where: { chainId },
        update: {
          stars: meta.stargazers_count,
          openIssues: meta.open_issues_count,
          weeklyCommits: weekly.commits,
          activeDevs: weekly.activeDevs,
        },
        create: {
          chainId,
          stars: meta.stargazers_count,
          openIssues: meta.open_issues_count,
          weeklyCommits: weekly.commits,
          activeDevs: weekly.activeDevs,
        },
      });
    }
  } catch (err) {
    console.warn(`[community] ${chainId} failed:`, (err as Error).message);
  }
}

export async function collectAllNodeVersions(): Promise<void> {
  for (const c of CHAINS) {
    await collectNodeVersionFor(c.id);
    await new Promise((r) => setTimeout(r, 300));
  }
}
