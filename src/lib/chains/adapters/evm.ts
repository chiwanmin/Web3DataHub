import { rotateEndpoints } from "@/lib/retry";
import type { ChainMeta } from "@/lib/chains/registry";
import type {
  BlockHeader,
  ChainAdapter,
  GasReading,
  MempoolReading,
} from "./types";

let rpcId = 1;

async function jsonRpc<T>(url: string, method: string, params: unknown[]): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: rpcId++, method, params }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${method} ${res.status}`);
  const json = (await res.json()) as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(`${method}: ${json.error.message}`);
  return json.result as T;
}

const hexToNum = (h: string | undefined | null) =>
  h == null ? 0 : Number.parseInt(h, 16);

const hexToBigStr = (h: string | undefined | null) =>
  h == null ? undefined : BigInt(h).toString();

interface RpcBlock {
  number: string;
  timestamp: string;
  transactions: string[];
  gasUsed: string;
  gasLimit: string;
  size: string;
  baseFeePerGas?: string;
}

interface FeeHistory {
  baseFeePerGas: string[];
  gasUsedRatio: number[];
  reward?: string[][];
}

const WEI_PER_GWEI = 1e9;

export function createEvmAdapter(chain: ChainMeta): ChainAdapter {
  const { rpcEndpoints } = chain;

  return {
    async getLatestBlock(): Promise<BlockHeader> {
      const block = await rotateEndpoints(rpcEndpoints, (url) =>
        jsonRpc<RpcBlock>(url, "eth_getBlockByNumber", ["latest", false]),
      );
      return {
        height: hexToNum(block.number),
        timestamp: new Date(hexToNum(block.timestamp) * 1000),
        txCount: block.transactions?.length ?? 0,
        gasUsed: hexToBigStr(block.gasUsed),
        gasLimit: hexToBigStr(block.gasLimit),
        size: hexToNum(block.size),
        baseFee: block.baseFeePerGas
          ? (hexToNum(block.baseFeePerGas) / WEI_PER_GWEI).toFixed(2)
          : undefined,
      };
    },

    async getGas(): Promise<GasReading | null> {
      const fee = await rotateEndpoints(rpcEndpoints, (url) =>
        jsonRpc<FeeHistory>(url, "eth_feeHistory", [
          "0x14",
          "latest",
          [25, 50, 75],
        ]),
      ).catch(() => null);

      if (fee && fee.baseFeePerGas?.length) {
        const lastBase =
          hexToNum(fee.baseFeePerGas[fee.baseFeePerGas.length - 1]) /
          WEI_PER_GWEI;
        const rewards = (fee.reward ?? []).map((r) =>
          r.map((x) => hexToNum(x) / WEI_PER_GWEI),
        );
        const tipMedian = avg(rewards.map((r) => r[1] ?? 0));
        const tipP25 = avg(rewards.map((r) => r[0] ?? 0));
        const tipP75 = avg(rewards.map((r) => r[2] ?? 0));
        return {
          fast: round2(lastBase + tipP75),
          standard: round2(lastBase + tipMedian),
          slow: round2(lastBase + Math.max(tipP25 * 0.7, 0.1)),
          baseFee: round2(lastBase),
          priority: round2(tipMedian),
        };
      }

      const price = await rotateEndpoints(rpcEndpoints, (url) =>
        jsonRpc<string>(url, "eth_gasPrice", []),
      );
      const gwei = hexToNum(price) / WEI_PER_GWEI;
      return {
        fast: round2(gwei * 1.25),
        standard: round2(gwei),
        slow: round2(gwei * 0.85),
      };
    },

    async getMempool(): Promise<MempoolReading | null> {
      const status = await rotateEndpoints(rpcEndpoints, (url) =>
        jsonRpc<{ pending: string; queued: string }>(url, "txpool_status", []),
      ).catch(() => null);
      if (!status) return null;
      const pending = hexToNum(status.pending) + hexToNum(status.queued);
      return { pending };
    },
  };
}

function avg(xs: number[]) {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
