import { retry } from "@/lib/retry";

const API = "https://api.github.com";

function headers(): HeadersInit {
  const h: Record<string, string> = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
  };
  const tok = process.env.GITHUB_TOKEN;
  if (tok) h.authorization = `Bearer ${tok}`;
  return h;
}

interface ReleaseResp {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  prerelease: boolean;
  draft: boolean;
}

interface RepoResp {
  stargazers_count: number;
  open_issues_count: number;
  pushed_at: string;
  description?: string;
}

interface CommitResp {
  sha: string;
  commit: { author: { date: string } };
  author?: { login: string } | null;
}

export async function fetchLatestRelease(repo: string): Promise<ReleaseResp | null> {
  return retry(async () => {
    const res = await fetch(`${API}/repos/${repo}/releases?per_page=10`, {
      headers: headers(),
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`gh releases ${repo} ${res.status}`);
    }
    const list = (await res.json()) as ReleaseResp[];
    return list.find((r) => !r.draft && !r.prerelease) ?? list[0] ?? null;
  });
}

export async function fetchRepoMeta(repo: string): Promise<RepoResp | null> {
  return retry(async () => {
    const res = await fetch(`${API}/repos/${repo}`, {
      headers: headers(),
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`gh repo ${repo} ${res.status}`);
    }
    return (await res.json()) as RepoResp;
  });
}

export async function fetchWeeklyCommits(repo: string): Promise<{
  commits: number;
  activeDevs: number;
}> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  return retry(async () => {
    const res = await fetch(
      `${API}/repos/${repo}/commits?since=${since.toISOString()}&per_page=100`,
      { headers: headers(), cache: "no-store" },
    );
    if (!res.ok) return { commits: 0, activeDevs: 0 };
    const list = (await res.json()) as CommitResp[];
    const devs = new Set(list.map((c) => c.author?.login).filter(Boolean) as string[]);
    return { commits: list.length, activeDevs: devs.size };
  });
}

/**
 * Heuristic comparison; treats v1.2.10 > v1.2.9 correctly.
 * Returns positive if `a` > `b`, negative if `a` < `b`, 0 equal.
 */
export function compareVersions(a: string, b: string): number {
  const norm = (v: string) =>
    v
      .replace(/^v/i, "")
      .split(/[.\-+]/)
      .map((part) => {
        const n = Number(part);
        return Number.isFinite(n) ? n : part;
      });
  const aa = norm(a);
  const bb = norm(b);
  for (let i = 0; i < Math.max(aa.length, bb.length); i++) {
    const x = aa[i] ?? 0;
    const y = bb[i] ?? 0;
    if (typeof x === "number" && typeof y === "number") {
      if (x !== y) return x - y;
    } else if (String(x) !== String(y)) {
      return String(x) > String(y) ? 1 : -1;
    }
  }
  return 0;
}

export function detectHardFork(release: ReleaseResp | null): boolean {
  if (!release) return false;
  const text = `${release.name} ${release.body}`.toLowerCase();
  return /hard\s*fork|consensus|mandatory|required\s+upgrade/.test(text);
}
