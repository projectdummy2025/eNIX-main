import { create } from "zustand";
import { mockChains, mockTokens } from "@/data";
import { FHENIX_CONTRACTS, FHENIX_VAULTS } from "@/lib/fhenix-types";
import { type FhenixVault, fetchVaultsViaProxy } from "@/lib/fhenix-vault";
import type {
  Chain,
  Token,
  VaultRisk,
  VaultSortKey,
  VaultStrategy,
} from "@/types";

type FetchStatus = "idle" | "loading" | "success" | "error";

export type VaultRiskFilter = VaultRisk | "all";

type ExpertState = {
  token: Token;
  chain: Chain;
  amount: string;
  vaults: VaultStrategy[];
  selectedVaultId: string | null;
  pendingVaultId: string | null;
  sortBy: VaultSortKey;
  status: FetchStatus;
  error: string | null;
  showOnlyTransactional: boolean;
  riskFilter: VaultRiskFilter;
  protocolFilter: string | null;
  apyMinFilter: number | null;
  tvlMinFilter: number | null;
  setToken: (token: Token) => void;
  setChain: (chain: Chain) => void;
  setAmount: (value: string) => void;
  setSortBy: (sortBy: VaultSortKey) => void;
  setShowOnlyTransactional: (value: boolean) => void;
  setRiskFilter: (filter: VaultRiskFilter) => void;
  setProtocolFilter: (protocolKey: string | null) => void;
  setApyMinFilter: (value: number | null) => void;
  setTvlMinFilter: (value: number | null) => void;
  selectVault: (id: string) => void;
  setPendingVaultId: (id: string | null) => void;
  fetchVaults: () => Promise<void>;
};

let currentController: AbortController | null = null;

const NATIVE_TO_WRAPPED: Record<string, string> = {
  ETH: "WETH",
  BNB: "WBNB",
  AVAX: "WAVAX",
  MATIC: "WMATIC",
  POL: "WPOL",
  CELO: "WCELO",
  S: "WS",
  BTC: "WBTC",
};

function resolveQueryAsset(symbol: string): string {
  const upper = symbol.toUpperCase();
  return NATIVE_TO_WRAPPED[upper] ?? upper;
}

const MIN_TVL_BY_CHAIN: Record<number, number> = {
  421614: 0,
  42161: 0,
};
const DEFAULT_MIN_TVL_USD = 100_000;

function resolveMinTvl(chainId: number): number {
  return MIN_TVL_BY_CHAIN[chainId] ?? DEFAULT_MIN_TVL_USD;
}

function inferRisk(apyPercent: number, tvlUsd: number): VaultRisk {
  if (!Number.isFinite(apyPercent) || apyPercent <= 0) return "medium";

  const whaleTvl = tvlUsd >= 50_000_000;
  const largeTvl = tvlUsd >= 5_000_000;
  const smallTvl = tvlUsd < 1_000_000;

  if (apyPercent >= 40) return "high";
  if (apyPercent >= 20 && !whaleTvl) return "high";
  if (smallTvl && apyPercent >= 10) return "high";

  if (apyPercent >= 12) return "medium";
  if (apyPercent >= 6 && !whaleTvl) return "medium";
  if (smallTvl) return "medium";

  if (largeTvl && apyPercent <= 10) return "low";
  return "low";
}

function resolveChainShortName(chainId: number): string {
  const chain = mockChains.find((item) => item.id === chainId);
  if (chain) return chain.shortName;
  return `Chain ${chainId}`;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

const YIELD_VAULT_TO_UNDERLYING: Record<string, `0x${string}`> = {
  [FHENIX_VAULTS.USDC_VAULT.toLowerCase()]: FHENIX_CONTRACTS.USDC,
  [FHENIX_VAULTS.RLC_VAULT.toLowerCase()]: FHENIX_CONTRACTS.RLC,
};

function mapVault(vault: FhenixVault): VaultStrategy {
  const tvlUsd = toNumber(vault.tvl?.usd, 0);
  const apyPercent = toNumber(vault.apy?.total, 0);
  const apy30dPercent =
    vault.apy30d === null || vault.apy30d === undefined
      ? null
      : toNumber(vault.apy30d, 0);
  const underlying = vault.underlyingToken;
  const rawProtocolName = vault.protocol ?? "Unknown";
  const cTokenAddress =
    YIELD_VAULT_TO_UNDERLYING[vault.address.toLowerCase()] ??
    (underlying?.address as `0x${string}` | undefined) ??
    "";

  return {
    id: `${vault.chainId}:${vault.address}`,
    protocol: rawProtocolName,
    protocolKey: rawProtocolName.toLowerCase().replace(/\s+/g, "-"),
    protocolLogoUri: vault.protocolLogo,
    protocolUrl: undefined,
    vaultName: vault.name,
    vaultAddress: vault.address,
    tokenSymbol: underlying?.symbol ?? "-",
    tokenAddress: cTokenAddress,
    tokenDecimals: underlying?.decimals ?? 18,
    chainId: vault.chainId,
    chainShortName: resolveChainShortName(vault.chainId),
    apy: apyPercent,
    apy30d: apy30dPercent,
    tvlUsd,
    risk: inferRisk(apyPercent, tvlUsd),
    isTransactional: true,
    isRedeemable: true,
    kyc: false,
    timeLock: toNumber(vault.timeLock, 0),
    tags: [],
  };
}

export const useExpertStore = create<ExpertState>((set, get) => ({
  token: mockTokens[0],
  chain: mockChains[0],
  amount: "",
  vaults: [],
  selectedVaultId: null,
  pendingVaultId: null,
  sortBy: "apy",
  status: "idle",
  error: null,
  showOnlyTransactional: true,
  riskFilter: "all",
  protocolFilter: null,
  apyMinFilter: null,
  tvlMinFilter: null,
  setToken: (token) => set({ token }),
  setChain: (chain) => set({ chain }),
  setAmount: (amount) => {
    const parsed = Number.parseFloat(amount || "0");
    const valid = Number.isFinite(parsed) && parsed > 0;
    set(valid ? { amount } : { amount, selectedVaultId: null, vaults: [] });
  },
  setSortBy: (sortBy) => set({ sortBy }),
  setShowOnlyTransactional: (showOnlyTransactional) =>
    set({ showOnlyTransactional }),
  setRiskFilter: (riskFilter) => set({ riskFilter }),
  setProtocolFilter: (protocolFilter) => set({ protocolFilter }),
  setApyMinFilter: (apyMinFilter) => set({ apyMinFilter }),
  setTvlMinFilter: (tvlMinFilter) => set({ tvlMinFilter }),
  selectVault: (selectedVaultId) => set({ selectedVaultId }),
  setPendingVaultId: (pendingVaultId) => set({ pendingVaultId }),
  fetchVaults: async () => {
    const { token, chain } = get();

    if (currentController) {
      currentController.abort();
    }
    const controller = new AbortController();
    currentController = controller;

    set({ status: "loading", error: null });

    try {
      const response = await fetchVaultsViaProxy(
        {
          chainId: chain.id,
          sortBy: "apy",
          limit: 100,
          minTvlUsd: resolveMinTvl(chain.id),
        },
        controller.signal,
      );

      if (controller.signal.aborted) return;

      const vaults = response.data.map(mapVault);
      const { pendingVaultId } = get();
      const fromPending = pendingVaultId
        ? vaults.find((vault) => vault.id === pendingVaultId)
        : null;
      const firstTransactional = vaults.find((vault) => vault.isTransactional);

      set({
        vaults,
        selectedVaultId:
          fromPending?.id ?? firstTransactional?.id ?? vaults[0]?.id ?? null,
        pendingVaultId: null,
        status: "success",
        error: null,
        protocolFilter: null,
        apyMinFilter: null,
        tvlMinFilter: null,
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      set({
        status: "error",
        error: "We couldn't load vaults right now. Please try again.",
      });
    }
  },
}));
