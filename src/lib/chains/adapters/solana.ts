import { rotateEndpoints } from "@/lib/retry";
import type { ChainMeta } from "@/lib/chains/registry";
import type { ChainAdapter, BlockHeader } from "./types";

let id = 1;
async function rpc<T>(url: string, method: string, params: unknown[]): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: id++, method, params }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${method} ${res.status}`);
  const j = (await res.json()) as { result?: T; error?: { message: string } };
  if (j.error) throw new Error(`${method}: ${j.error.message}`);
  return j.result as T;
}

interface PerfSample {
  numTransactions: number;
  numSlots: number;
  samplePeriodSecs: number;
  slot: number;
}

export function createSolanaAdapter(chain: ChainMeta): ChainAdapter {
  const endpoints = chain.rpcEndpoints;

  return {
    async getLatestBlock(): Promise<BlockHeader> {
      const slot = await rotateEndpoints(endpoints, (u) =>
        rpc<number>(u, "getSlot", [{ commitment: "confirmed" }]),
      );

      // Avoid getBlock for every poll (heavy on public RPC); rely on
      // performance samples for tx counts and only fetch blockTime cheaply.
      const [time, sample] = await Promise.all([
        rotateEndpoints(endpoints, (u) => rpc<number | null>(u, "getBlockTime", [slot])).catch(
          () => null,
        ),
        rotateEndpoints(endpoints, (u) =>
          rpc<PerfSample[]>(u, "getRecentPerformanceSamples", [1]),
        ).catch(() => [] as PerfSample[]),
      ]);

      const s = sample[0];
      const txPerSlot = s && s.numSlots > 0 ? Math.round(s.numTransactions / s.numSlots) : 0;

      return {
        height: slot,
        timestamp: time ? new Date(time * 1000) : new Date(),
        txCount: txPerSlot,
      };
    },

    async getGas() {
      const fees = await rotateEndpoints(endpoints, (u) =>
        rpc<{ slot: number; prioritizationFee: number }[]>(u, "getRecentPrioritizationFees", []),
      ).catch(() => null);
      if (!fees || !fees.length) return null;
      const sorted = [...fees].map((f) => f.prioritizationFee).sort((a, b) => a - b);
      const p25 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
      const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
      const p75 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
      return {
        fast: p75 || 5000,
        standard: p50 || 1000,
        slow: p25 || 100,
        priority: p50,
      };
    },

    async getMempool() {
      return null;
    },
  };
}
