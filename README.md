# Web3View

> 多链区块链数据监控与智能分析模块

面向交易所钱包运维团队，帮助快速判断链路健康度、优化充提策略、降低运维风险。**仅采集区块头级别的轻量指标**——不解析 receipt、不全量回放交易、不连私有节点。

---

## 功能矩阵

| 模块 | 路径 | 数据源 | 优先级 |
|---|---|---|---|
| 概览仪表盘 | `/` | BlockSample / NodeVersion / Alert 聚合 | P0 |
| 出块监控 | `/blocks` | `eth_getBlockByNumber(latest, false)` 等区块头 | P0 |
| Gas / 费率 | `/gas` | `eth_gasPrice` + `eth_feeHistory` / mempool.space / TRON chainparams | P0 |
| 网络负载 | `/network` | 区块头中的 `txCount` / `gasUsed` / `gasLimit` + 派生 TPS | P1 |
| 节点 & 升级 | `/nodes` | GitHub Releases + 静态升级时间线 + GitHub 社区指标 | P1 |
| 安全告警中心 | `/alerts` | 6 条规则引擎实时评估 | P0 |

---

## 架构

```
┌──────────────────────── Next.js 14 App Router (单一进程) ────────────────────────┐
│                                                                                  │
│  src/instrumentation.ts ──► bootstrap.ts ──► 写入 ChainConfig / NetworkUpgrade   │
│                          └► scheduler.ts ──► croner 启动 5 类周期任务            │
│                                                                                  │
│   ┌─── jobs/collectBlocks  ─┐    ┌── lib/chains/adapters/ ───────────┐           │
│   │    jobs/collectGas      ├──► │  evm | bitcoin | solana | tron | ton          │
│   │    jobs/collectMempool  │    └────────────┬──────────────────────┘           │
│   │    jobs/collectNodeVer  │                 │ 仅区块头级 RPC + 公共 HTTP API   │
│   │    jobs/evaluateAlerts ─┘                 ▼                                  │
│   │                                ┌──── 公共 RPC / 公共 API ─────┐              │
│   │                                │ llamarpc / publicnode / ankr │              │
│   │                                │ mempool.space / blockchair    │              │
│   │                                │ toncenter / trongrid          │              │
│   │                                └──────────────────────────────┘              │
│   ▼                                                                              │
│   ┌────────────── Prisma + SQLite (开发) / MySQL (生产) ─────────────┐           │
│   │  ChainConfig · BlockSample · GasSample · MempoolSample           │           │
│   │  NodeVersion · NetworkUpgrade · CommunityMetric · Alert          │           │
│   └─────────────────┬──────────────────────────────────────────────┬─┘           │
│                     │                                              │             │
│   ┌── lib/api/queries.ts ──┐                       ┌── lib/health.ts ──┐         │
│   │  数据聚合 + jsonable    │                       │  6 维加权评分     │         │
│   └────────┬───────────────┘                       └────────┬─────────┘         │
│            │                                                │                    │
│            ▼                                                ▼                    │
│   ┌── app/api/**/route.ts ──┐                ┌── lib/alerts/rules.ts ──┐         │
│   │  /api/overview          │                │  6 条规则 + dedupe       │         │
│   │  /api/chains/[id]/{...} │                └──────────────────────────┘         │
│   │  /api/nodes/{...}       │                                                    │
│   │  /api/alerts            │                                                    │
│   └────────┬───────────────┘                                                    │
│            │                                                                     │
│            ▼  SWR @ 30s 轮询                                                     │
│   ┌── app/{,blocks,gas,network,nodes,alerts}/page.tsx ──┐                       │
│   │  Recharts (Area / Bar / HBar) · 自定义 shadcn 风格组件                       │
│   └─────────────────────────────────────────────────────┘                       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**关键设计原则**

1. **轻量数据采集** —— 只调 `eth_getBlockByNumber(latest, false)` / `getSlot+getBlockTime` / `/wallet/getnowblock` 等区块头接口，不读 receipt/不 trace。
2. **公共 RPC + 自动轮询** —— `lib/retry.ts::rotateEndpoints` 在 `registry.ts` 列出的多个端点间做指数退避重试。
3. **三档健康评分** —— `health.ts` 用 30/15/15/20/10/10 权重组合 6 个维度产出 0-100 分 + ok/warn/bad 三档。
4. **告警去重** —— `Alert.dedupeKey = chainId:rule:bucket(ms)`，避免同一窗口反复推送。
5. **同进程调度** —— `instrumentation.ts` 在 Node runtime 启动时拉起 croner，无需独立 worker。

---

## 快速启动

```bash
npm install
cp .env.example .env

# 初始化 SQLite（schema 与生产 MySQL 通用）
npx prisma db push --skip-generate
npx prisma generate

# 启动（默认 3041 端口）
PORT=3041 npx next dev
```

打开 <http://localhost:3041>。首次启动后约 30-60 秒，BlockSample / GasSample / NodeVersion 会被陆续填充，页面随 SWR 自动刷新。

> **注意**：`.env` 中的 `DATABASE_URL="file:../dev.db"` 故意写成 `../`，因为 Prisma 把 SQLite 路径解析为相对 `prisma/schema.prisma`，这样数据库文件最终落在工作区根目录 `dev.db`，与 runtime 一致。

### 可选环境变量

| Key | 说明 |
|---|---|
| `GITHUB_TOKEN` | GitHub PAT，避免拉 Releases 时被 60/h 匿名限速。建议 `read:public_repo`。|
| `RPC_ETHEREUM` / `RPC_BSC` / `RPC_SOLANA` / ... | 逗号分隔，覆盖默认 RPC 端点列表（注册表中各 `RPC_<CHAIN_ID>`）。|
| `DISABLE_SCHEDULER=1` | 仅起 Web 服务、不启用后台采集（用于只读演示或对接外部数据源时）。|

### 切到 MySQL（生产）

```prisma
// prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

```env
DATABASE_URL="mysql://user:pass@host:3306/web3view"
```

`BigInt` 字段（height / gasUsed / gasLimit）已在 Prisma 模型上声明为 `BigInt`，MySQL 会落 `BIGINT`，API 出口由 `lib/json.ts::jsonable` 转 string，前端无需特殊处理。

---

## 扩展新链

以新增 Avalanche C-Chain（EVM 系）为例：

1. **注册表**：在 `src/lib/chains/registry.ts` 的 `CHAINS` 数组追加：
   ```ts
   {
     id: "avalanche",
     name: "Avalanche C-Chain",
     short: "AVAX",
     symbol: "AVAX",
     family: "evm",
     consensus: "Snowman",
     client: "AvalancheGo",
     githubRepo: "ava-labs/avalanchego",
     rpcEndpoints: list("RPC_AVALANCHE", [
       "https://api.avax.network/ext/bc/C/rpc",
       "https://avalanche-c-chain-rpc.publicnode.com",
     ]),
     normalBlockTime: 2,
     warnMultiplier: 2,
     critMultiplier: 4,
     defaultConfirmations: 12,
     finality: "~3 s (Snowman)",
     priority: "P1",
     color: "#e84142",
   },
   ```
2. **适配器**：EVM 系不需要新建文件，`adapters/index.ts::getAdapter` 会按 `family === "evm"` 复用 `evm.ts`。
   - 非 EVM 链需要新增 `src/lib/chains/adapters/<name>.ts` 实现 `ChainAdapter` 接口（`getLatestBlock` 必填，`getGas` / `getMempool` 可选返 `null`），并在 `adapters/index.ts` 注册。
3. **DB 启动数据**：删除本地 `dev.db` 重新 `prisma db push`，或在 `lib/bootstrap.ts` 里 `upsert` 一条 `ChainConfig`。生产环境通过迁移脚本写入。
4. **网络升级时间线**（可选）：在 `lib/bootstrap.ts::seedUpgrades()` 里追加该链的硬分叉条目，将随启动写入 `NetworkUpgrade`。
5. **调度器** 无需改动，scheduler 自动遍历 `CHAINS` 注册所有 cron。

---

## 目录结构

```
src/
├─ app/                       # Next.js App Router
│  ├─ layout.tsx              # 全局 shell（侧边栏 + 内容区）
│  ├─ page.tsx                # 概览
│  ├─ blocks|gas|network|nodes|alerts/page.tsx
│  └─ api/                    # 7 个 JSON 端点
│
├─ components/
│  ├─ layout/  Sidebar · LiveBadge · PageHeader
│  ├─ ui/      MetricCard · Panel · ChainIcon · ChainSelect · EmptyHint
│  ├─ charts/  LineTrend · BarBlocks · HBarCompare · Gauge
│  └─ cards/   ChainRow
│
├─ jobs/                      # croner 任务实现
│  ├─ scheduler.ts            # cron 装配（按链动态步进）
│  ├─ collectBlocks.ts        # 区块头采样 + reorg 检测
│  ├─ collectGas.ts
│  ├─ collectMempool.ts
│  ├─ collectNodeVersions.ts  # GitHub Releases + Community
│  └─ evaluateAlerts.ts       # 规则评估 + 持久化
│
├─ lib/
│  ├─ chains/
│  │  ├─ registry.ts          # 8 链元数据
│  │  └─ adapters/            # evm / bitcoin / solana / tron / ton + types
│  ├─ alerts/rules.ts         # 6 条规则 + dedupeKey
│  ├─ api/queries.ts          # 服务端聚合查询
│  ├─ db.ts                   # Prisma 单例
│  ├─ retry.ts                # withTimeout · rotateEndpoints
│  ├─ github.ts               # Releases · Stats · 硬分叉关键词检测
│  ├─ health.ts               # 6 维加权评分
│  ├─ bootstrap.ts            # 启动 seed
│  ├─ json.ts                 # BigInt 安全序列化
│  ├─ swr.ts                  # 客户端轮询封装
│  └─ cn.ts                   # tailwind-merge
│
├─ instrumentation.ts         # Next runtime hook → bootstrap + 调度
└─ ...

prisma/schema.prisma          # 8 张表，SQLite/MySQL 通用
```

---

## 健康评分算法

`lib/health.ts::computeChainHealth(chainId)` 输出 `{ score: 0-100, level: "ok"|"warn"|"bad", parts }`：

| 维度 | 权重 | 说明 |
|---|---|---|
| 出块稳定度 | 30 | 24h 平均 blockTime 与 `normalBlockTime` 偏差 |
| Gas 合理性 | 15 | 当前 standard 与 7d 均值比 |
| 出块容量 | 15 | 平均 `gasUsed/gasLimit` 比例（EVM）/ txCount 趋势（其他） |
| Reorg 罚分 | 20 | 24h reorg 次数与最大深度 |
| 节点版本新鲜度 | 10 | semver 落后 minor 数 |
| 社区健康度 | 10 | weeklyCommits + activeDevs + openIssues |

阈值：`>= 85 → ok`，`>= 60 → warn`，否则 `bad`。

---

## 告警规则

| 规则 | severity | 触发条件 | dedupe 窗口 |
|---|---|---|---|
| `block_stall` | critical | 距离最新 block > `max(5min, 15×normalBlockTime)` | 1h |
| `reorg_depth` | critical | 24h 内最大 reorg 深度 > 基线（btc=1, 其他=2）×2 | 1h |
| `reorg_frequency` | warning | 24h 内 reorg 次数 > 3 | 6h |
| `version_outdated` | warning | currentVer 落后 latestVer ≥ 2 个 minor | 1d |
| `hardfork_due` | critical | release notes 命中 hardfork 关键词，或 `NetworkUpgrade.scheduledAt < 7d` | 6h |
| `gas_spike` | warning | 当前 standard > 7d 均值 ×5（样本数 > 50） | 2h |

---

## 与主工程集成

本工程 `src/lib/chains/`、`src/lib/alerts/`、`src/jobs/` 与 `prisma/schema.prisma` 设计为可直接 portable：

- 数据库切到主工程 MySQL，沿用相同表名（无前缀冲突）；
- `instrumentation.ts` 中的 `startScheduler()` 可在主工程的服务启动入口直接调用；
- API 路径前缀 `/api/web3view/...` 即可挂入主工程的 Next App Router 而不冲突。

---

## 开发提示

```bash
# 重置数据库
rm dev.db && npx prisma db push --skip-generate

# 仅看一次某条链的采集结果
npx tsx -e "import('./src/jobs/collectBlocks').then(m => m.collectBlocks('ethereum'))"

# 触发一轮告警评估
npx tsx -e "import('./src/jobs/evaluateAlerts').then(m => m.evaluateAlerts())"

# 检查 lint
npx next lint
```
