import { create } from "zustand";
import { mockChains } from "@/data";
import type { FhenixVault } from "@/lib/fhenix-vault";
import { fetchVaultsViaProxy } from "@/lib/fhenix-vault";
import type { VaultStrategy } from "@/types";

function mapFhenixVault(vault: FhenixVault): VaultStrategy {
  const tvlUsd = parseFloat(vault.tvl?.usd ?? "0");
  const apyPercent = vault.apy?.total ?? 0;
  const chain = mockChains.find((c) => c.id === vault.chainId);
  return {
    id: `${vault.chainId}:${vault.address}`,
    protocol: vault.protocol,
    protocolKey: vault.protocol.toLowerCase().replace(/\s+/g, "-"),
    protocolLogoUri: vault.protocolLogo,
    vaultName: vault.name,
    vaultAddress: vault.address,
    tokenSymbol: vault.underlyingToken?.symbol ?? "-",
    tokenAddress: vault.underlyingToken?.address ?? "",
    tokenDecimals: vault.underlyingToken?.decimals ?? 18,
    chainId: vault.chainId,
    chainShortName: chain?.shortName ?? `Chain ${vault.chainId}`,
    apy: apyPercent,
    apy30d: vault.apy30d ?? null,
    tvlUsd,
    risk: inferRisk(apyPercent, tvlUsd),
    isTransactional: true,
    isRedeemable: true,
    kyc: false,
    timeLock: vault.timeLock ?? 0,
    tags: [],
  };
}

function inferRisk(
  apyPercent: number,
  tvlUsd: number,
): "low" | "medium" | "high" {
  if (apyPercent >= 40) return "high";
  if (apyPercent >= 12) return "medium";
  if (tvlUsd >= 5_000_000) return "low";
  return "medium";
}

export const COMPARE_MAX_SLOTS = 4;
const SEARCH_LIMIT = 30;

type SearchStatus = "idle" | "loading" | "ready" | "error";

type CompareState = {
  selectedVaults: VaultStrategy[];
  pickerOpen: boolean;
  searchChainId: number | null;
  searchQuery: string;
  searchResults: VaultStrategy[];
  searchStatus: SearchStatus;
  openPicker: () => void;
  closePicker: () => void;
  setSearchChain: (chainId: number | null) => void;
  setSearchQuery: (query: string) => void;
  searchVaults: () => Promise<void>;
  addVault: (vault: VaultStrategy) => void;
  removeVault: (id: string) => void;
  clearAll: () => void;
};

let searchController: AbortController | null = null;

export const useCompareStore = create<CompareState>((set, get) => ({
  selectedVaults: [],
  pickerOpen: false,
  searchChainId: 421614,
  searchQuery: "",
  searchResults: [],
  searchStatus: "idle",
  openPicker: () => {
    set({ pickerOpen: true });
    if (get().searchResults.length === 0) {
      get().searchVaults();
    }
  },
  closePicker: () => set({ pickerOpen: false }),
  setSearchChain: (searchChainId) => {
    set({ searchChainId, searchResults: [] });
    get().searchVaults();
  },
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  searchVaults: async () => {
    const { searchChainId, searchQuery } = get();

    if (searchController) searchController.abort();
    const controller = new AbortController();
    searchController = controller;

    set({ searchStatus: "loading" });

    try {
      const params: Parameters<typeof fetchVaultsViaProxy>[0] = {
        sortBy: "apy",
        limit: SEARCH_LIMIT,
        minTvlUsd: searchChainId === 421614 ? 0 : 50_000,
      };
      if (searchChainId) params.chainId = searchChainId;
      const trimmed = searchQuery.trim();
      if (trimmed) params.tokenAddress = trimmed;

      const response = await fetchVaultsViaProxy(params, controller.signal);
      if (controller.signal.aborted) return;

      const vaults = response.data.map(mapFhenixVault);
      set({ searchResults: vaults, searchStatus: "ready" });
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      set({ searchStatus: "error", searchResults: [] });
    }
  },
  addVault: (vault) => {
    set((state) => {
      if (state.selectedVaults.length >= COMPARE_MAX_SLOTS) return state;
      if (state.selectedVaults.some((v) => v.id === vault.id)) return state;
      return {
        selectedVaults: [...state.selectedVaults, vault],
        pickerOpen: false,
      };
    });
  },
  removeVault: (id) =>
    set((state) => ({
      selectedVaults: state.selectedVaults.filter((v) => v.id !== id),
    })),
  clearAll: () => set({ selectedVaults: [] }),
}));
