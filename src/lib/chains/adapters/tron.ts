import { rotateEndpoints } from "@/lib/retry";
import type { ChainMeta } from "@/lib/chains/registry";
import type { ChainAdapter, BlockHeader } from "./types";

interface TronBlock {
  block_header: {
    raw_data: { number: number; timestamp: number };
  };
  transactions?: unknown[];
}

interface ChainParams {
  chainParameter: { key: string; value?: number }[];
}

export function createTronAdapter(chain: ChainMeta): ChainAdapter {
  const endpoints = chain.rpcEndpoints;

  async function post<T>(path: string, body: unknown = {}): Promise<T> {
    return rotateEndpoints(endpoints, async (base) => {
      const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`tron ${path} ${res.status}`);
      return (await res.json()) as T;
    });
  }

  return {
    async getLatestBlock(): Promise<BlockHeader> {
      const block = await post<TronBlock>("/wallet/getnowblock");
      const raw = block.block_header.raw_data;
      return {
        height: raw.number,
        timestamp: new Date(raw.timestamp),
        txCount: block.transactions?.length ?? 0,
      };
    },

    async getGas() {
      const params = await post<ChainParams>("/wallet/getchainparameters").catch(
        () => null,
      );
      if (!params) return null;
      const energyFee = params.chainParameter.find((p) => p.key === "getEnergyFee")?.value;
      const bandwidthFee = params.chainParameter.find((p) => p.key === "getTransactionFee")?.value;
      const std = (energyFee ?? 420) / 1000;
      return {
        fast: std * 1.2,
        standard: std,
        slow: std * 0.85,
        baseFee: bandwidthFee ? bandwidthFee / 1000 : undefined,
      };
    },

    async getMempool() {
      return null;
    },
  };
}
