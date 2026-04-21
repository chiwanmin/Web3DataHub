import { prisma } from "@/lib/db";
import { CHAINS } from "@/lib/chains/registry";
import { getAdapter } from "@/lib/chains/adapters";

export async function collectBlocksFor(chainId: string): Promise<void> {
  const chain = CHAINS.find((c) => c.id === chainId);
  if (!chain) return;
  const adapter = getAdapter(chain);

  let header;
  try {
    header = await adapter.getLatestBlock();
  } catch (err) {
    console.warn(`[collectBlocks] ${chainId} failed:`, (err as Error).message);
    return;
  }

  const heightBig = BigInt(header.height);

  const exists = await prisma.blockSample.findFirst({
    where: { chainId, height: heightBig },
    select: { id: true },
  });
  if (exists) return;

  const prev = await prisma.blockSample.findFirst({
    where: { chainId },
    orderBy: { height: "desc" },
  });

  let blockTime = chain.normalBlockTime;
  let reorg = false;
  let reorgDepth: number | null = null;

  if (prev) {
    const heightDelta = heightBig - prev.height;
    /**
     * Public RPC endpoints often disagree by a handful of blocks because of
     * load-balancer staleness; we treat anything within the rotation jitter
     * as benign and only call it a "real" reorg when the canonical head
     * goes back by more than a chain-specific safety margin.
     */
    /**
     * Real mainnet reorgs deeper than these thresholds are virtually unheard
     * of; anything shallower is most likely an out-of-sync RPC endpoint.
     */
    const reorgThreshold =
      chain.family === "btc" ? 2 : chain.family === "evm" ? 15 : 25;
    if (heightDelta < BigInt(-reorgThreshold)) {
      reorg = true;
      reorgDepth = Number(prev.height - heightBig);
    } else if (heightDelta <= 0n) {
      // Stale read from another endpoint — skip to avoid corrupting metrics.
      return;
    } else {
      const dt = (header.timestamp.getTime() - prev.timestamp.getTime()) / 1000;
      if (dt > 0) blockTime = dt;
      if (heightDelta > 1n && heightDelta < 50n) {
        blockTime = blockTime / Number(heightDelta);
      }
    }
  }

  await prisma.blockSample.create({
    data: {
      chainId,
      height: heightBig,
      timestamp: header.timestamp,
      blockTime,
      gasUsed: header.gasUsed,
      gasLimit: header.gasLimit,
      txCount: header.txCount,
      size: header.size,
      baseFee: header.baseFee,
      reorg,
      reorgDepth,
    },
  });

  const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const stale = await prisma.blockSample.count({
    where: { chainId, timestamp: { lt: cutoff } },
  });
  if (stale > 100) {
    await prisma.blockSample.deleteMany({
      where: { chainId, timestamp: { lt: cutoff } },
    });
  }
}

export async function collectAllBlocks(): Promise<void> {
  await Promise.all(CHAINS.map((c) => collectBlocksFor(c.id)));
}
