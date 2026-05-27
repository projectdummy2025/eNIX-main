"use client";

import { AnimatePresence } from "motion/react";
import Image from "next/image";
import { useMemo } from "react";
import { useExpertStore, useMetaStore } from "@/stores";
import { ActiveReview } from "./active-review";
import { EmptyReview } from "./strategy-review-states";
import { RISK_CLASS, RISK_LABEL } from "./strategy-review-utils";

export function StrategyReview() {
  const vaults = useExpertStore((state) => state.vaults);
  const selectedVaultId = useExpertStore((state) => state.selectedVaultId);
  const status = useExpertStore((state) => state.status);
  const amount = useExpertStore((state) => state.amount);
  const chainsById = useMetaStore((state) => state.chainsById);

  const token = useExpertStore((state) => state.token);
  const chain = useExpertStore((state) => state.chain);
  const tokensBySymbol = useMetaStore((state) => state.tokensBySymbol);

  const parsedAmount = Number.parseFloat(amount || "0");
  const hasValidAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const principalUsd = hasValidAmount ? parsedAmount * token.usdPrice : 0;
  const tokenLogo =
    tokensBySymbol[chain.id]?.[token.symbol.toUpperCase()]?.logoURI ?? null;

  const vault = useMemo(
    () => vaults.find((item) => item.id === selectedVaultId) ?? null,
    [vaults, selectedVaultId],
  );

  if (!hasValidAmount) {
    return null;
  }

  const isLoading = status === "loading" || status === "idle";

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-main bg-surface p-3 mb-10">
      <header className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
            Strategy review
          </span>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-main mt-2">
            {vault?.protocolLogoUri ? (
              <Image
                src={vault.protocolLogoUri}
                alt={vault.protocol}
                width={16}
                height={16}
                className="h-4 w-4 rounded-full object-contain"
                unoptimized
              />
            ) : null}
            {vault ? vault.protocol : "Select a vault to continue"}
          </h3>
        </div>
        {vault ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${RISK_CLASS[vault.risk]}`}
          >
            {RISK_LABEL[vault.risk]} risk
          </span>
        ) : null}
      </header>

      <AnimatePresence mode="wait">
        {vault ? (
          <ActiveReview
            key={vault.id}
            vault={vault}
            chainLogo={chainsById[vault.chainId]?.logoURI}
            principalUsd={principalUsd}
            tokenLogo={tokenLogo}
            tokenSymbol={token.symbol}
          />
        ) : (
          <EmptyReview key="empty" isLoading={isLoading} />
        )}
      </AnimatePresence>
    </section>
  );
}
