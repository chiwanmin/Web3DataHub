import { rotateEndpoints } from "@/lib/retry";
import type { ChainMeta } from "@/lib/chains/registry";
import type { ChainAdapter, BlockHeader } from "./types";

/**
 * Bitcoin adapter — primary backend is mempool.space, with Blockchair as a
 * secondary / public-RPC fallback. Both are read-only HTTP APIs that expose
 * block-header level data without requiring a self-hosted node.
 */

interface MempoolBlockTip {
  id: string;
  height: number;
  timestamp: number;
  tx_count: number;
  size: number;
}

interface MempoolFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

interface MempoolPool {
  count: number;
  vsize: number;
  total_fee: number;
}

const MEMPOOL_BASE = "https://mempool.space/api";

interface BlockchairStats {
  data: {
    blocks: number;
    best_block_time: string;
    transactions_24h: number;
    mempool_transactions: number;
    suggested_transaction_fee_per_byte_sat: number;
  } | null;
}

export function createBitcoinAdapter(chain: ChainMeta): ChainAdapter {
  // The registry endpoint list is treated as Blockchair-style fallbacks.
  const fallbacks = chain.rpcEndpoints;

  async function mempool<T>(path: string): Promise<T> {
    const res = await fetch(`${MEMPOOL_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`mempool.space ${path} ${res.status}`);
    return (await res.json()) as T;
  }

  async function blockchair<T>(path: string): Promise<T> {
    return rotateEndpoints(fallbacks, async (base) => {
      const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`blockchair ${path} ${res.status}`);
      return (await res.json()) as T;
    });
  }

  return {
    async getLatestBlock(): Promise<BlockHeader> {
      try {
        const blocks = await mempool<MempoolBlockTip[]>("/v1/blocks");
        const tip = blocks[0];
        return {
          height: tip.height,
          timestamp: new Date(tip.timestamp * 1000),
          txCount: tip.tx_count,
          size: tip.size,
        };
      } catch {
        const stats = await blockchair<BlockchairStats>("/stats");
        if (!stats.data) throw new Error("btc data unavailable");
        const txEstimate = Math.round(stats.data.transactions_24h / 144);
        return {
          height: stats.data.blocks - 1,
          timestamp: new Date(stats.data.best_block_time + "Z"),
          txCount: txEstimate,
        };
      }
    },

    async getGas() {
      try {
        const fees = await mempool<MempoolFees>("/v1/fees/recommended");
        return {
          fast: fees.fastestFee,
          standard: fees.halfHourFee,
          slow: Math.max(1, fees.hourFee),
        };
      } catch {
        const stats = await blockchair<BlockchairStats>("/stats").catch(() => null);
        if (!stats?.data) return null;
        const fee = stats.data.suggested_transaction_fee_per_byte_sat;
        return { fast: fee * 1.25, standard: fee, slow: Math.max(1, fee * 0.7) };
      }
    },

    async getMempool() {
      try {
        const pool = await mempool<MempoolPool>("/mempool");
        const fees = await mempool<MempoolFees>("/v1/fees/recommended").catch(() => null);
        return {
          pending: pool.count,
          avgFee: fees?.halfHourFee,
        };
      } catch {
        const stats = await blockchair<BlockchairStats>("/stats").catch(() => null);
        if (!stats?.data) return null;
        return {
          pending: stats.data.mempool_transactions,
          avgFee: stats.data.suggested_transaction_fee_per_byte_sat,
        };
      }
    },
  };
}
