export type ChainFamily = "evm" | "btc" | "svm" | "tvm" | "ton";

export interface ChainMeta {
  id: string;
  name: string;
  short: string;
  symbol: string;
  family: ChainFamily;
  consensus: string;
  client: string;
  githubRepo: string;
  rpcEndpoints: string[];
  /** seconds */
  normalBlockTime: number;
  warnMultiplier: number;
  critMultiplier: number;
  /** Suggested confirmations for wallet sweep */
  defaultConfirmations: number;
  /** Approximate finality description (used on UI) */
  finality: string;
  /** Tier for first-batch / second-batch */
  priority: "P0" | "P1";
  color: string;
}

const env = (k: string) => process.env[k]?.trim() || "";
const list = (k: string, fallback: string[]) => {
  const v = env(k);
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : fallback;
};

export const CHAINS: ChainMeta[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    short: "ETH",
    symbol: "ETH",
    family: "evm",
    consensus: "PoS",
    client: "Geth",
    githubRepo: "ethereum/go-ethereum",
    rpcEndpoints: list("RPC_ETHEREUM", [
      "https://eth.llamarpc.com",
      "https://rpc.ankr.com/eth",
      "https://ethereum-rpc.publicnode.com",
    ]),
    normalBlockTime: 12,
    warnMultiplier: 1.5,
    critMultiplier: 2.5,
    defaultConfirmations: 12,
    finality: "~15 min (32 slots)",
    priority: "P0",
    color: "#627eea",
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    short: "BTC",
    symbol: "BTC",
    family: "btc",
    consensus: "PoW",
    client: "Bitcoin Core",
    githubRepo: "bitcoin/bitcoin",
    rpcEndpoints: list("RPC_BITCOIN", [
      "https://api.blockchair.com/bitcoin",
    ]),
    normalBlockTime: 600,
    warnMultiplier: 1.5,
    critMultiplier: 2,
    defaultConfirmations: 3,
    finality: "~30 min (3 conf)",
    priority: "P0",
    color: "#f7931a",
  },
  {
    id: "bsc",
    name: "BNB Smart Chain",
    short: "BNB",
    symbol: "BNB",
    family: "evm",
    consensus: "PoSA",
    client: "BSC Geth",
    githubRepo: "bnb-chain/bsc",
    rpcEndpoints: list("RPC_BSC", [
      "https://bsc-dataseed.bnbchain.org",
      "https://bsc-rpc.publicnode.com",
    ]),
    normalBlockTime: 3,
    warnMultiplier: 1.7,
    critMultiplier: 3,
    defaultConfirmations: 15,
    finality: "~45 s",
    priority: "P0",
    color: "#f0b90b",
  },
  {
    id: "solana",
    name: "Solana",
    short: "SOL",
    symbol: "SOL",
    family: "svm",
    consensus: "PoH + PoS",
    client: "Agave",
    githubRepo: "anza-xyz/agave",
    rpcEndpoints: list("RPC_SOLANA", [
      "https://solana-rpc.publicnode.com",
      "https://api.mainnet-beta.solana.com",
      "https://solana.drpc.org",
    ]),
    normalBlockTime: 0.4,
    warnMultiplier: 2,
    critMultiplier: 4,
    defaultConfirmations: 32,
    finality: "~13 s (32 slots)",
    priority: "P0",
    color: "#9945ff",
  },
  {
    id: "tron",
    name: "TRON",
    short: "TRX",
    symbol: "TRX",
    family: "tvm",
    consensus: "DPoS",
    client: "java-tron",
    githubRepo: "tronprotocol/java-tron",
    rpcEndpoints: list("RPC_TRON", [
      "https://api.trongrid.io",
    ]),
    normalBlockTime: 3,
    warnMultiplier: 1.7,
    critMultiplier: 3,
    defaultConfirmations: 19,
    finality: "~57 s (19 SR)",
    priority: "P0",
    color: "#ff060a",
  },
  {
    id: "polygon",
    name: "Polygon",
    short: "POL",
    symbol: "POL",
    family: "evm",
    consensus: "PoS",
    client: "Bor",
    githubRepo: "maticnetwork/bor",
    rpcEndpoints: list("RPC_POLYGON", [
      "https://polygon-rpc.com",
      "https://polygon-bor-rpc.publicnode.com",
    ]),
    normalBlockTime: 2,
    warnMultiplier: 2,
    critMultiplier: 4,
    defaultConfirmations: 128,
    finality: "~256 blocks",
    priority: "P1",
    color: "#8247e5",
  },
  {
    id: "arbitrum",
    name: "Arbitrum One",
    short: "ARB",
    symbol: "ETH",
    family: "evm",
    consensus: "Rollup (Nitro)",
    client: "Nitro",
    githubRepo: "OffchainLabs/nitro",
    rpcEndpoints: list("RPC_ARBITRUM", [
      "https://arb1.arbitrum.io/rpc",
      "https://arbitrum-one-rpc.publicnode.com",
    ]),
    normalBlockTime: 0.25,
    warnMultiplier: 4,
    critMultiplier: 10,
    defaultConfirmations: 20,
    finality: "~7 days (L1 challenge)",
    priority: "P1",
    color: "#28a0f0",
  },
  {
    id: "ton",
    name: "TON",
    short: "TON",
    symbol: "TON",
    family: "ton",
    consensus: "BFT",
    client: "TON Node",
    githubRepo: "ton-blockchain/ton",
    rpcEndpoints: list("RPC_TON", [
      "https://toncenter.com/api/v2",
    ]),
    normalBlockTime: 5,
    warnMultiplier: 2,
    critMultiplier: 4,
    defaultConfirmations: 1,
    finality: "~5 s (BFT)",
    priority: "P1",
    color: "#0098ea",
  },
];

export const CHAIN_BY_ID = new Map(CHAINS.map((c) => [c.id, c]));

export function getChain(id: string): ChainMeta | undefined {
  return CHAIN_BY_ID.get(id);
}

export function chainsByFamily(family: ChainFamily): ChainMeta[] {
  return CHAINS.filter((c) => c.family === family);
}
