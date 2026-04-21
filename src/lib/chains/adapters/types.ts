export interface BlockHeader {
  height: number;
  timestamp: Date;
  txCount: number;
  /** decimal string */
  gasUsed?: string;
  /** decimal string */
  gasLimit?: string;
  size?: number;
  /** Gwei (or chain native unit) decimal string */
  baseFee?: string;
}

export interface GasReading {
  fast: number;
  standard: number;
  slow: number;
  baseFee?: number;
  priority?: number;
}

export interface MempoolReading {
  pending: number;
  avgFee?: number;
}

export interface ChainAdapter {
  /** Lightweight: latest block header (no tx body) */
  getLatestBlock(): Promise<BlockHeader>;
  /** Optional gas reading (returns null when not applicable, e.g. BTC) */
  getGas(): Promise<GasReading | null>;
  /** Optional mempool reading */
  getMempool(): Promise<MempoolReading | null>;
}
