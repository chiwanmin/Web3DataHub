import { rotateEndpoints } from "@/lib/retry";
import type { ChainMeta } from "@/lib/chains/registry";
import type { ChainAdapter, BlockHeader } from "./types";

interface MasterchainInfo {
  ok: boolean;
  result: {
    last: { workchain: number; shard: string; seqno: number };
    state_root_hash: string;
    init: { workchain: number; root_hash: string };
  };
}

interface ShardsResponse {
  ok: boolean;
  result: {
    shards: { workchain: number; shard: string; seqno: number }[];
  };
}

interface BlockTxs {
  ok: boolean;
  result: { transactions?: unknown[] };
}

export function createTonAdapter(chain: ChainMeta): ChainAdapter {
  const endpoints = chain.rpcEndpoints;

  async function get<T>(path: string): Promise<T> {
    return rotateEndpoints(endpoints, async (base) => {
      const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`ton ${path} ${res.status}`);
      return (await res.json()) as T;
    });
  }

  return {
    async getLatestBlock(): Promise<BlockHeader> {
      const info = await get<MasterchainInfo>("/getMasterchainInfo");
      const last = info.result.last;
      const txs = await get<BlockTxs>(
        `/getBlockTransactions?workchain=${last.workchain}&shard=${encodeURIComponent(
          last.shard,
        )}&seqno=${last.seqno}`,
      ).catch(() => ({ ok: true, result: { transactions: [] } } as BlockTxs));
      return {
        height: last.seqno,
        timestamp: new Date(),
        txCount: txs.result.transactions?.length ?? 0,
      };
    },

    async getGas() {
      return null;
    },

    async getMempool() {
      return null;
    },
  };
}
