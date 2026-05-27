<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project

- Root is the Next.js app. `package.json` lives at `/`.
- Path alias `@/*` maps to `./src/*`.
- `pnpm-workspace.yaml` only controls built dependencies — no workspace packages.
- Foundry contracts in `foundry/` (separate workspace, solc 0.8.24, EVM cancun).
  - Build: `cd foundry && forge build`
  - Test: `cd foundry && forge test -vv`
  - Deploy: `forge script script/DeployNoxVaults.s.sol --rpc-url arbitrum_sepolia --broadcast`

## Setup

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Required env vars: `PROJECT_ID` (WalletConnect), `NEXT_PUBLIC_APP_URL`.  
Optional: `CHAINGPT_API_KEY` (ChainGPT AI), `LIFI_API_KEY` (LI.FI earn).

## Lint & Format

**Biome** (not ESLint/Prettier). No `pnpm typecheck` script.

```bash
pnpm lint   # check only
pnpm format # write changes
```

## Tech Stack

- Next.js 16 (App Router, Turbopack) + React 19 + React Compiler
- Tailwind CSS 4 + PostCSS, motion (Framer Motion)
- wagmi v2 + viem + RainbowKit + TanStack Query 5 (30s staleTime)
- Zustand for client state
- **Two protocols**: Nox Protocol (confidential vaults) + LI.FI (general earn/portfolio)

## Key Architecture

### API Proxies (two parallel systems)

| Pattern | Purpose | Upstream |
|---|---|---|
| `src/app/api/nox/{vaults,quote,meta,portfolio}/` | Confidential vault aggregator | On-chain reads (viem public client) + hardcoded |
| `src/app/api/earn/{vaults,quote,portfolio}/` | General earn | LI.FI `earn.li.fi/v1` |
| `src/app/api/lifi/meta/` | Chain/token/protocol metadata | LI.FI `li.quest/v1` |

Nox vault data is computed from on-chain reads (2 hardcoded vaults: cUSDC, cRLC).  
LI.FI earn vaults are pass-through proxies with filters.

### Nox Protocol (confidential)

- Libs: `src/lib/nox-{vault,meta,quote,handle}.ts`
- Stores: `src/stores/nox-{deposit,withdraw}-store.ts`
- Confidential tokens: cUSDC, cRLC (ERC-7984) on Arbitrum Sepolia (421614)
- Contract addresses in `src/lib/nox-types.ts` → `NOX_CONTRACTS`, `NOX_VAULTS`
- Handle client (client-side only, EIP-712 based): `createNoxHandleClientFromWagmi()` / `createNoxHandleClientFromWindow()` from `@/lib/nox-handle`
- Deposit flow (4 sequential txns): approve(underlying, cToken) → wrap → approve(cToken, vault) → deposit
- Withdraw flow (2 txns): redeem(shares) → unwrap(amount, handle, handleProof)
- Balance decryption: `client.decrypt(handle)` or `client.publicDecrypt(handle)`

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
