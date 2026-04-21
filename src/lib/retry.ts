export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  onRetry?: (err: unknown, attempt: number) => void;
}

export async function retry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const retries = opts.retries ?? 3;
  const base = opts.baseDelayMs ?? 250;
  const max = opts.maxDelayMs ?? 4000;
  const timeoutMs = opts.timeoutMs ?? 8000;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await withTimeout(fn(), timeoutMs);
    } catch (err) {
      lastErr = err;
      opts.onRetry?.(err, attempt);
      if (attempt === retries) break;
      const delay = Math.min(max, base * 2 ** attempt) + Math.random() * 100;
      await sleep(delay);
    }
  }
  throw lastErr;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Try each endpoint in order; return first success. */
export async function rotateEndpoints<T>(
  endpoints: string[],
  call: (url: string) => Promise<T>,
  opts: { perEndpointTimeoutMs?: number; retries?: number } = {},
): Promise<T> {
  const timeoutMs = opts.perEndpointTimeoutMs ?? 8000;
  const retries = opts.retries ?? 1;
  let lastErr: unknown;
  for (const url of endpoints) {
    try {
      return await retry(() => call(url), { retries, timeoutMs });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}
