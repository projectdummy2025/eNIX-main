"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { mockChains } from "@/data";
import { useExpertStore, useMetaStore } from "@/stores";

export function EarnQueryHydrator() {
  const searchParams = useSearchParams();
  const tokensBySymbol = useMetaStore((s) => s.tokensBySymbol);
  const metaStatus = useMetaStore((s) => s.status);
  const setChain = useExpertStore((s) => s.setChain);
  const setToken = useExpertStore((s) => s.setToken);
  const setPendingVaultId = useExpertStore((s) => s.setPendingVaultId);

  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current) return;
    if (metaStatus !== "ready") return;

    const chainParam = searchParams.get("chain");
    const tokenParam = searchParams.get("token");
    const vaultParam = searchParams.get("vault");

    if (!chainParam && !tokenParam && !vaultParam) {
      appliedRef.current = true;
      return;
    }

    const chainId = chainParam ? Number(chainParam) : null;
    if (chainId !== null && Number.isFinite(chainId)) {
      const chain = mockChains.find((c) => c.id === chainId);
      if (chain) setChain(chain);

      if (tokenParam) {
        const symbol = tokenParam.toUpperCase();
        const tokenMeta = tokensBySymbol[chainId]?.[symbol];
        if (tokenMeta) {
          setToken({
            symbol: tokenMeta.symbol,
            name: tokenMeta.name ?? tokenMeta.symbol,
            usdPrice: Number.parseFloat(tokenMeta.priceUSD ?? "0") || 0,
          });
        }
      }
    }

    if (vaultParam) {
      setPendingVaultId(vaultParam);
    }

    appliedRef.current = true;
  }, [
    metaStatus,
    searchParams,
    tokensBySymbol,
    setChain,
    setToken,
    setPendingVaultId,
  ]);

  return null;
}
