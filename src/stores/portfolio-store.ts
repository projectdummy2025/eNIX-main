import type { Config } from "wagmi";
import { create } from "zustand";
import type { LifiChainMeta, LifiTokenMeta } from "@/lib/lifi-meta";
import type { LifiPortfolioPosition } from "@/lib/lifi-portfolio";
import {
  loadPortfolioSnapshot,
  type PortfolioHolding,
} from "@/lib/portfolio-fetcher";

type PortfolioStatus = "idle" | "loading" | "ready" | "error";

type PortfolioState = {
  holdings: PortfolioHolding[];
  positions: LifiPortfolioPosition[];
  totalValueUsd: number;
  totalHoldingsUsd: number;
  totalPositionsUsd: number;
  status: PortfolioStatus;
  error: string | null;
  lastFetchedAddress: string | null;
  networkFilter: number | "all";
  pendingRefetch: boolean;
  setNetworkFilter: (filter: number | "all") => void;
  markForRefetch: () => void;
  loadPortfolio: (args: {
    config: Config;
    address: `0x${string}`;
    meta: {
      chainsById: Record<number, LifiChainMeta>;
      tokensByChain: Record<number, LifiTokenMeta[]>;
    };
  }) => Promise<void>;
  reset: () => void;
};

let currentController: AbortController | null = null;

export const usePortfolioStore = create<PortfolioState>((set) => ({
  holdings: [],
  positions: [],
  totalValueUsd: 0,
  totalHoldingsUsd: 0,
  totalPositionsUsd: 0,
  status: "idle",
  error: null,
  lastFetchedAddress: null,
  networkFilter: "all",
  pendingRefetch: false,
  setNetworkFilter: (networkFilter) => set({ networkFilter }),
  markForRefetch: () => set({ pendingRefetch: true, lastFetchedAddress: null }),
  loadPortfolio: async ({ config, address, meta }) => {
    if (!Object.keys(meta.chainsById).length) return;

    if (currentController) currentController.abort();
    const controller = new AbortController();
    currentController = controller;

    set({ status: "loading", error: null });

    try {
      const snapshot = await loadPortfolioSnapshot({ config, address, meta });
      if (controller.signal.aborted) return;
      set({
        holdings: snapshot.holdings,
        positions: snapshot.positions,
        totalValueUsd: snapshot.totalValueUsd,
        totalHoldingsUsd: snapshot.totalHoldingsUsd,
        totalPositionsUsd: snapshot.totalPositionsUsd,
        status: "ready",
        error: null,
        lastFetchedAddress: address,
        pendingRefetch: false,
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      set({
        status: "error",
        error: "We couldn't load your portfolio right now.",
      });
    }
  },
  reset: () =>
    set({
      holdings: [],
      positions: [],
      totalValueUsd: 0,
      totalHoldingsUsd: 0,
      totalPositionsUsd: 0,
      status: "idle",
      error: null,
      lastFetchedAddress: null,
      networkFilter: "all",
      pendingRefetch: false,
    }),
}));
