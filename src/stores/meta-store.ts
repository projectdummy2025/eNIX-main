import { create } from "zustand";
import {
  fetchLifiMeta,
  type LifiChainMeta,
  type LifiProtocolMeta,
  type LifiTokenMeta,
} from "@/lib/lifi-meta";

type MetaStatus = "idle" | "loading" | "ready" | "error";

type MetaState = {
  chainsById: Record<number, LifiChainMeta>;
  tokensByChain: Record<number, LifiTokenMeta[]>;
  tokensBySymbol: Record<number, Record<string, LifiTokenMeta>>;
  protocolsByName: Record<string, LifiProtocolMeta>;
  status: MetaStatus;
  loadMeta: () => Promise<void>;
};

let hasRequested = false;

function normalizeProtocolName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export const useMetaStore = create<MetaState>((set) => ({
  chainsById: {},
  tokensByChain: {},
  tokensBySymbol: {},
  protocolsByName: {},
  status: "idle",
  loadMeta: async () => {
    if (hasRequested) return;
    hasRequested = true;
    set({ status: "loading" });

    try {
      const payload = await fetchLifiMeta();
      const chains = Array.isArray(payload.chains) ? payload.chains : [];
      const tokens =
        payload.tokens && typeof payload.tokens === "object"
          ? payload.tokens
          : {};
      const protocols = Array.isArray(payload.protocols)
        ? payload.protocols
        : [];

      const chainsById: Record<number, LifiChainMeta> = {};
      for (const chain of chains) {
        if (typeof chain?.id === "number") {
          chainsById[chain.id] = chain;
        }
      }

      const tokensByChain: Record<number, LifiTokenMeta[]> = {};
      const tokensBySymbol: Record<number, Record<string, LifiTokenMeta>> = {};

      for (const [chainIdKey, list] of Object.entries(tokens)) {
        const chainId = Number(chainIdKey);
        if (!Number.isFinite(chainId) || !Array.isArray(list)) continue;
        tokensByChain[chainId] = list;
        const bySymbol: Record<string, LifiTokenMeta> = {};
        for (const token of list) {
          if (!token?.symbol) continue;
          const symbol = token.symbol.toUpperCase();
          if (!bySymbol[symbol]) {
            bySymbol[symbol] = token;
          }
        }
        tokensBySymbol[chainId] = bySymbol;
      }

      const protocolsByName: Record<string, LifiProtocolMeta> = {};
      for (const protocol of protocols) {
        if (!protocol?.name) continue;
        protocolsByName[normalizeProtocolName(protocol.name)] = protocol;
      }

      set({
        chainsById,
        tokensByChain,
        tokensBySymbol,
        protocolsByName,
        status: "ready",
      });
    } catch {
      hasRequested = false;
      set({ status: "error" });
    }
  },
}));
