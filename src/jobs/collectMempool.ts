import { prisma } from "@/lib/db";
import { CHAINS } from "@/lib/chains/registry";
import { getAdapter } from "@/lib/chains/adapters";

export async function collectMempoolFor(chainId: string): Promise<void> {
  const chain = CHAINS.find((c) => c.id === chainId);
  if (!chain) return;
  const adapter = getAdapter(chain);
  let m;
  try {
    m = await adapter.getMempool();
  } catch (err) {
    console.warn(`[collectMempool] ${chainId} failed:`, (err as Error).message);
    return;
  }
  if (!m) return;
  await prisma.mempoolSample.create({
    data: {
      chainId,
      timestamp: new Date(),
      pending: m.pending,
      avgFee: m.avgFee,
    },
  });
}

export async function collectAllMempool(): Promise<void> {
  await Promise.all(CHAINS.map((c) => collectMempoolFor(c.id)));
}
