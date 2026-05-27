<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project

- Root is the Next.js app. `package.json` lives at `/`.
- Path alias `@/*` maps to `./src/*`.
- `pnpm-workspace.yaml` only controls built dependencies — no workspace packages.
- Foundry contracts in `foundry/` (separate workspace, solc 0.8.28, EVM cancun).
  - Build: `cd foundry && ~/.foundry/bin/forge build --skip test`
  - Test: `cd foundry && ~/.foundry/bin/forge test -vv`
  - Deploy: `cd foundry && ~/.foundry/bin/forge script script/DeployFhenixVaults.s.sol --rpc-url arbitrum_sepolia --broadcast`

## Setup

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Required env vars: `PROJECT_ID` (WalletConnect), `NEXT_PUBLIC_APP_URL`.  
Optional: `CHAINGPT_API_KEY` (ChainGPT AI), `LIFI_API_KEY` (LI.FI earn).

## Build

Turbopack hangs on macOS. Use webpack:

```bash
pnpm next build --webpack
```

## Lint & Format

**Biome** (not ESLint/Prettier). No `pnpm typecheck` script.

```bash
pnpm lint   # check only
pnpm format # write changes
```

## Tech Stack

- Next.js 16 (App Router, use `--webpack` flag) + React 19 + React Compiler
- Tailwind CSS 4 + PostCSS, motion (Framer Motion)
- wagmi v2 + viem + RainbowKit + TanStack Query 5 (30s staleTime)
- Zustand for client state
- **Two protocols**: Fhenix CoFHE (confidential vaults) + LI.FI (general earn/portfolio)

## Key Architecture

### API Proxies (two parallel systems)

| Pattern | Purpose | Upstream |
|---|---|---|
| `src/app/api/fhenix/{vaults,quote,meta,portfolio}/` | Confidential vault aggregator | On-chain reads (viem public client) + hardcoded |
| `src/app/api/earn/{vaults,quote,portfolio}/` | General earn | LI.FI `earn.li.fi/v1` |
| `src/app/api/lifi/meta/` | Chain/token/protocol metadata | LI.FI `li.quest/v1` |

Fhenix vault data is computed from on-chain reads (2 deployed vaults: fUSDC, fRLC).  
LI.FI earn vaults are pass-through proxies with filters.

### Fhenix Protocol (confidential)

- Libs: `src/lib/fhenix-{client,vault,meta,quote,types}.ts`
- Stores: `src/stores/fhenix-{deposit,withdraw}-store.ts`
- Confidential tokens: USDC, RLC on Arbitrum Sepolia (421614), encrypted via CoFHE
- Contract addresses in `src/lib/fhenix-types.ts` → `FHENIX_CONTRACTS`, `FHENIX_VAULTS`
- CoFHE client (client-side only): `connectCofheClient()` from `@/lib/fhenix-client`
- Deposit flow (2 txns): approve(ERC-20, vault) → encrypt amount → deposit
- Withdraw flow (1 txn): encrypt shares → withdraw
- Balance decryption: `client.decryptForView(ctHash)` via CoFHE SDK

### LI.FI (general earn)

- Libs: `src/lib/lifi-{earn,meta,quote,portfolio}.ts`
- Stores: `src/stores/deposit-store.ts`, `src/stores/withdraw-store.ts`, `src/stores/portfolio-store.ts`
- Env var: `LIFI_API_KEY` (optional, passed as `x-lifi-api-key` header)

### Portfolio

- `src/lib/portfolio-fetcher.ts` merges LI.FI positions + tracked vault positions (from `src/lib/tracked-vaults.ts`, persisted in localStorage)

### Pages

- All app pages under `src/app/(app)/` (compare/, earn/, portfolio/)
- Default chain: **Arbitrum Sepolia (421614)**
- AI Chat button/sheet on every app page (`src/components/ui/ai-chat/`), proxied server-side via ChainGPT `general_assistant` model

### Wallet Config

- `GET /api/wallet-config` serves `PROJECT_ID` (force-dynamic). Wagmi config is created client-side after fetching it in `providers.tsx`.
- `WalletReadyContext` boolean — components check `useWalletReady()` before wallet-dependent operations.

### Theme

- Dark/light toggle persisted under `enix-app-theme` in localStorage (default: dark). Bootstrapped via inline `<script>` in `<head>` to prevent flash.

## Deployed Contracts (Arbitrum Sepolia 421614)

| Contract | Address |
|---|---|
| fUSDC Vault | `0x6d4d017dE8d0A36dce7856Ee989624C6A18cD9Ea` |
| fRLC Vault | `0xD04A92C83AFe71f4f69F9FAD0A33229BFBdE33E6` |
| USDC (testnet) | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |
| RLC (testnet) | `0x9923eD3cbd90CD78b910c475f9A731A6e0b8C963` |
