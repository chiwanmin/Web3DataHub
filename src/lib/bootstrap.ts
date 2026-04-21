import { prisma } from "@/lib/db";
import { CHAINS } from "@/lib/chains/registry";

let booted = false;

const seedUpgrades = [
  {
    chainId: "ton",
    title: "TON Workchain Expansion",
    description: "新增 Workchain 支持，修改消息路由机制，影响交易构建方式",
    severity: "critical",
    status: "upcoming",
    walletImpact: "需更新交易构建逻辑，测试所有转账类型",
    daysAhead: 30,
  },
  {
    chainId: "ethereum",
    title: "Fusaka",
    description: "PeerDAS (EIP-7594) 启用，Blob 容量扩展，EOF 引入",
    severity: "high",
    status: "upcoming",
    walletImpact: "Blob 费用结构变化可能影响 L2 提款成本评估",
    daysAhead: 75,
  },
  {
    chainId: "bsc",
    title: "Plato",
    description: "EVM 兼容性升级，新增 opcode",
    severity: "medium",
    status: "upcoming",
    walletImpact: "低影响，主要影响合约层",
    daysAhead: 50,
  },
  {
    chainId: "solana",
    title: "v2.3 Feature Gate",
    description: "启用新交易格式 V0 默认化，修改优先级费计算",
    severity: "medium",
    status: "upcoming",
    walletImpact: "需确认交易构建使用 V0 格式，更新费用估算",
    daysAhead: 20,
  },
];

export async function ensureBootstrap(): Promise<void> {
  if (booted) return;
  booted = true;

  for (const c of CHAINS) {
    await prisma.chainConfig.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        family: c.family,
        consensus: c.consensus,
        symbol: c.symbol,
        rpcEndpoints: JSON.stringify(c.rpcEndpoints),
        normalBlockTime: c.normalBlockTime,
        warnMultiplier: c.warnMultiplier,
        critMultiplier: c.critMultiplier,
        githubRepo: c.githubRepo,
        client: c.client,
      },
      create: {
        id: c.id,
        name: c.name,
        family: c.family,
        consensus: c.consensus,
        symbol: c.symbol,
        rpcEndpoints: JSON.stringify(c.rpcEndpoints),
        normalBlockTime: c.normalBlockTime,
        warnMultiplier: c.warnMultiplier,
        critMultiplier: c.critMultiplier,
        githubRepo: c.githubRepo,
        client: c.client,
      },
    });
  }

  const upgradeCount = await prisma.networkUpgrade.count();
  if (upgradeCount === 0) {
    for (const u of seedUpgrades) {
      await prisma.networkUpgrade.create({
        data: {
          chainId: u.chainId,
          title: u.title,
          description: u.description,
          severity: u.severity,
          status: u.status,
          walletImpact: u.walletImpact,
          scheduledAt: new Date(Date.now() + u.daysAhead * 24 * 3600 * 1000),
        },
      });
    }
  }
}
