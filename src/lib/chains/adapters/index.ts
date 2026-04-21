import { CHAINS, type ChainMeta } from "@/lib/chains/registry";
import { createEvmAdapter } from "./evm";
import { createBitcoinAdapter } from "./bitcoin";
import { createSolanaAdapter } from "./solana";
import { createTronAdapter } from "./tron";
import { createTonAdapter } from "./ton";
import type { ChainAdapter } from "./types";

const cache = new Map<string, ChainAdapter>();

export function getAdapter(chain: ChainMeta): ChainAdapter {
  const cached = cache.get(chain.id);
  if (cached) return cached;
  let adapter: ChainAdapter;
  switch (chain.family) {
    case "evm":
      adapter = createEvmAdapter(chain);
      break;
    case "btc":
      adapter = createBitcoinAdapter(chain);
      break;
    case "svm":
      adapter = createSolanaAdapter(chain);
      break;
    case "tvm":
      adapter = createTronAdapter(chain);
      break;
    case "ton":
      adapter = createTonAdapter(chain);
      break;
  }
  cache.set(chain.id, adapter);
  return adapter;
}

export function allAdapters(): { chain: ChainMeta; adapter: ChainAdapter }[] {
  return CHAINS.map((c) => ({ chain: c, adapter: getAdapter(c) }));
}

export type { ChainAdapter } from "./types";
