import { prisma } from "@/lib/db";
import { CHAINS } from "@/lib/chains/registry";
import { getAdapter } from "@/lib/chains/adapters";

export async function collectGasFor(chainId: string): Promise<void> {
  const chain = CHAINS.find((c) => c.id === chainId);
  if (!chain) return;
  const adapter = getAdapter(chain);
  let g;
  try {
    g = await adapter.getGas();
  } catch (err) {
    console.warn(`[collectGas] ${chainId} failed:`, (err as Error).message);
    return;
  }
  if (!g) return;
  await prisma.gasSample.create({
    data: {
      chainId,
      timestamp: new Date(),
      fast: g.fast,
      standard: g.standard,
      slow: g.slow,
      baseFee: g.baseFee,
      priority: g.priority,
    },
  });
}

export async function collectAllGas(): Promise<void> {
  await Promise.all(CHAINS.map((c) => collectGasFor(c.id)));
}
