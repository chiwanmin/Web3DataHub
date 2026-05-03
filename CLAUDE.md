# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web3View is a multi-chain blockchain monitoring dashboard for exchange wallet operations teams. It collects lightweight block-header metrics only (no receipt parsing, no full transaction replay) via public RPC endpoints and aggregates them into health scores and alerts.

## Commands

```bash
# Install dependencies
npm install

# Development (default port 3041)
PORT=3041 npm run dev

# Production build
npm run build

# Lint
npm run lint

# Database (SQLite dev / MySQL prod)
npx prisma db push --skip-generate   # Push schema
npx prisma generate                   # Generate client
npm run db:seed                      # Seed initial data

# Reset database
rm dev.db && npx prisma db push --skip-generate && npx prisma generate

# Run a single job manually
npx tsx -e "import('./src/jobs/collectBlocks').then(m => m.collectBlocks('ethereum'))"
npx tsx -e "import('./src/jobs/evaluateAlerts').then(m => m.evaluateAlerts())"
```

## Architecture

### Startup Flow
`src/instrumentation.ts` (Next.js runtime hook) → imports `bootstrap.ts` (seeds ChainConfig/NetworkUpgrade) and `scheduler.ts` (starts croner jobs). Runs in the same Node.js process — no separate worker needed.

### Scheduler
`src/jobs/scheduler.ts` dynamically generates cron patterns per chain based on `normalBlockTime` (10s floor, 5min cap, snapped to 15/30/60s boundaries). Runs 5 job types:
- `collectBlocks` — per chain, dynamic interval based on block time
- `collectGas` — every 30s
- `collectMempool` — every 1h
- `collectNodeVersions` — every 1h
- `evaluateAlerts` — every 1min

### Chain Adapters
`src/lib/chains/adapters/` implements `ChainAdapter` interface per family:
- **EVM chains** reuse `evm.ts` (family check in `adapters/index.ts`)
- Non-EVM chains have dedicated adapters: `bitcoin.ts`, `solana.ts`, `tron.ts`, `ton.ts`

Chain registry at `src/lib/chains/registry.ts` defines all 8 chains (ethereum, bitcoin, bsc, solana, tron, polygon, arbitrum, ton) with RPC endpoints, block times, and multipliers.

### API Routes
- `/api/overview` — aggregated dashboard data
- `/api/chains/[id]/load` — chain config + latest block
- `/api/chains/[id]/blocks` — block history
- `/api/chains/[id]/gas` — gas history
- `/api/nodes` — node versions
- `/api/nodes/community` — GitHub community metrics
- `/api/nodes/upgrades` — network upgrades
- `/api/alerts` — alert feed

### Data Model (Prisma)
8 tables: `ChainConfig`, `BlockSample`, `GasSample`, `MempoolSample`, `NodeVersion`, `NetworkUpgrade`, `CommunityMetric`, `Alert`. SQLite in dev, MySQL in prod (swap provider + url in schema). BigInt fields serialized via `lib/json.ts::jsonable`.

### Health Scoring
`src/lib/health.ts::computeChainHealth()` — 6-dimension weighted score (0-100): block stability 30%, gas reasonability 15%, block capacity 15%, reorg penalty 20%, version freshness 10%, community health 10%. Thresholds: ≥85 ok, ≥60 warn, else bad.

### Alert Rules
`src/lib/alerts/rules.ts` — 6 rules with dedupe keys (`chainId:rule:bucket(ms)`) to prevent spam. Severity levels: `critical`, `warning`.

## Environment Variables

| Key | Description |
|---|---|
| `DATABASE_URL` | SQLite: `file:../dev.db` (relative to schema.prisma), MySQL: `mysql://...` |
| `GITHUB_TOKEN` | GitHub PAT to avoid 60/h anonymous rate limit |
| `RPC_<CHAIN>` | Override RPC endpoints (comma-separated) |
| `WEB3VIEW_DISABLE_SCHEDULER=true` | Disable background jobs (read-only demo mode) |

## Adding a New Chain

1. Add entry to `src/lib/chains/registry.ts::CHAINS`
2. EVM chains: no new adapter needed (reuse `evm.ts`)
3. Non-EVM chains: create `src/lib/chains/adapters/<name>.ts` implementing `ChainAdapter`, register in `adapters/index.ts`
4. Delete `dev.db`, run `npx prisma db push --skip-generate && npx prisma generate`
5. Optionally seed network upgrades in `src/lib/bootstrap.ts::seedUpgrades()`
