"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiChevronDown, FiSearch, FiX } from "react-icons/fi";
import {
  APY_PRESETS,
  MinThresholdDropdown,
  ProtocolFilterDropdown,
  type ProtocolOption,
  RiskFilterChips,
} from "@/components/pages/(app)/earn/vault-list";
import {
  formatApy,
  formatTvl,
  RISK_CLASS,
  RISK_LABEL,
} from "@/components/pages/(app)/earn/vault-list/vault-list-utils";
import {
  COMPARE_MAX_SLOTS,
  useCompareStore,
  useMetaStore,
  type VaultRiskFilter,
} from "@/stores";
import type { VaultRisk } from "@/types";

type ChainOption = {
  id: number;
  name: string;
  logo?: string;
};

export function VaultPickerSheet() {
  const open = useCompareStore((s) => s.pickerOpen);
  const close = useCompareStore((s) => s.closePicker);
  const searchChainId = useCompareStore((s) => s.searchChainId);
  const setSearchChain = useCompareStore((s) => s.setSearchChain);
  const searchQuery = useCompareStore((s) => s.searchQuery);
  const setSearchQuery = useCompareStore((s) => s.setSearchQuery);
  const searchResults = useCompareStore((s) => s.searchResults);
  const searchStatus = useCompareStore((s) => s.searchStatus);
  const searchVaults = useCompareStore((s) => s.searchVaults);
  const addVault = useCompareStore((s) => s.addVault);
  const selectedVaults = useCompareStore((s) => s.selectedVaults);

  const chainsById = useMetaStore((s) => s.chainsById);
  const [chainOpen, setChainOpen] = useState(false);

  const [apyMin, setApyMin] = useState<number | null>(null);
  const [riskFilter, setRiskFilter] = useState<VaultRiskFilter>("all");
  const [protocolFilter, setProtocolFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => searchVaults(), 350);
    return () => clearTimeout(t);
  }, [open, searchQuery, searchVaults]);

  useEffect(() => {
    if (!open) {
      setApyMin(null);
      setRiskFilter("all");
      setProtocolFilter(null);
    }
  }, [open]);

  const filteredResults = useMemo(() => {
    return searchResults.filter((vault) => {
      if (apyMin !== null && vault.apy < apyMin) return false;
      if (riskFilter !== "all" && vault.risk !== riskFilter) return false;
      if (protocolFilter && vault.protocolKey !== protocolFilter) return false;
      return true;
    });
  }, [searchResults, apyMin, riskFilter, protocolFilter]);

  const protocolOptions = useMemo<ProtocolOption[]>(() => {
    const map = new Map<string, ProtocolOption>();
    for (const vault of searchResults) {
      const existing = map.get(vault.protocolKey);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(vault.protocolKey, {
          key: vault.protocolKey,
          label: vault.protocol,
          logo: vault.protocolLogoUri,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [searchResults]);

  const activeProtocolOption = useMemo(
    () =>
      protocolFilter
        ? (protocolOptions.find((option) => option.key === protocolFilter) ??
          null)
        : null,
    [protocolFilter, protocolOptions],
  );

  const riskCounts = useMemo(
    () =>
      searchResults.reduce(
        (acc, vault) => {
          acc[vault.risk] = (acc[vault.risk] ?? 0) + 1;
          return acc;
        },
        { low: 0, medium: 0, high: 0 } as Record<VaultRisk, number>,
      ),
    [searchResults],
  );

  const chainOptions: ChainOption[] = useMemo(() => {
    const list = Object.values(chainsById).map((c) => ({
      id: c.id,
      name: c.name,
      logo: c.logoURI,
    }));
    list.sort((a, b) => {
      if (a.id === 143) return -1;
      if (b.id === 143) return 1;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [chainsById]);

  const activeChain = chainOptions.find((c) => c.id === searchChainId);
  const selectedIds = new Set(selectedVaults.map((v) => v.id));
  const slotsFull = selectedVaults.length >= COMPARE_MAX_SLOTS;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="picker-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={close}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
        >
          <motion.div
            key="picker-modal"
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl border border-main bg-surface sm:rounded-3xl"
          >
            <header className="flex items-center justify-between gap-3 border-b border-main px-5 py-4">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-[0.16em] text-faint">
                  Add to comparison
                </span>
                <h3 className="text-base font-semibold text-main">
                  Pick a vault
                </h3>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-muted transition-colors hover:text-main"
              >
                <FiX className="h-4 w-4" />
              </button>
            </header>

            <div className="flex flex-col gap-3 px-5 pt-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setChainOpen((p) => !p)}
                    className="flex items-center gap-2 rounded-full border border-main bg-surface-raised px-3 py-2 text-xs font-semibold text-main transition-colors hover:border-strong"
                  >
                    {activeChain?.logo ? (
                      <Image
                        src={activeChain.logo}
                        alt={activeChain.name}
                        width={14}
                        height={14}
                        className="h-3.5 w-3.5 rounded-full"
                        unoptimized
                      />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full bg-surface-muted" />
                    )}
                    {activeChain?.name ?? "All chains"}
                    <FiChevronDown className="h-3 w-3 text-muted" />
                  </button>
                  <AnimatePresence>
                    {chainOpen ? (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute left-0 top-full z-10 mt-1 max-h-64 w-56 overflow-y-auto rounded-2xl border border-main bg-surface-raised"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSearchChain(null);
                            setChainOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-main transition-colors hover:bg-surface-muted"
                        >
                          All chains
                        </button>
                        {chainOptions.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSearchChain(c.id);
                              setChainOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-main transition-colors hover:bg-surface-muted"
                          >
                            {c.logo ? (
                              <Image
                                src={c.logo}
                                alt={c.name}
                                width={16}
                                height={16}
                                className="h-4 w-4 rounded-full"
                                unoptimized
                              />
                            ) : (
                              <span className="h-4 w-4 rounded-full bg-surface-muted" />
                            )}
                            {c.name}
                            {c.id === searchChainId ? (
                              <FiCheck className="ml-auto h-3 w-3 text-brand" />
                            ) : null}
                          </button>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>

              <label className="flex items-center gap-2 rounded-full border border-main bg-surface-raised px-3 py-2 transition-colors focus-within:border-strong">
                <FiSearch className="h-3.5 w-3.5 text-faint" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by token symbol — e.g. cUSDC, cWETH, USDC"
                  className="min-w-0 flex-1 bg-transparent text-xs text-main outline-none placeholder:text-faint"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="text-faint transition-colors hover:text-main"
                  >
                    <FiX className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <MinThresholdDropdown
                  label="APY"
                  kind="apy"
                  presets={APY_PRESETS}
                  placeholder="e.g. 7.5"
                  active={apyMin}
                  onSelect={setApyMin}
                />
                <ProtocolFilterDropdown
                  active={activeProtocolOption}
                  options={protocolOptions}
                  onSelect={setProtocolFilter}
                />
                <div className="ml-auto">
                  <RiskFilterChips
                    active={riskFilter}
                    counts={riskCounts}
                    onSelect={setRiskFilter}
                  />
                </div>
              </div>

              {slotsFull ? (
                <p className="rounded-xl bg-brand-soft px-3 py-2 text-[11px] text-brand">
                  Comparison full ({COMPARE_MAX_SLOTS} max). Remove one to add
                  another.
                </p>
              ) : null}
            </div>

            <div className="mt-3 flex-1 overflow-y-auto px-5 pb-5">
              {searchStatus === "loading" ? (
                <SkeletonRows />
              ) : searchStatus === "error" ? (
                <p className="rounded-2xl bg-surface-raised px-4 py-6 text-center text-xs text-muted">
                  Couldn't reach Nox Protocol. Try again in a moment.
                </p>
              ) : filteredResults.length === 0 ? (
                <p className="rounded-2xl bg-surface-raised px-4 py-6 text-center text-xs text-muted">
                  No vaults found for this filter.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {filteredResults.map((vault) => {
                    const alreadyAdded = selectedIds.has(vault.id);
                    const disabled = alreadyAdded || slotsFull;
                    const chainLogo = chainsById[vault.chainId]?.logoURI;
                    return (
                      <li key={vault.id}>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => addVault(vault)}
                          className="group flex w-full items-center justify-between gap-3 rounded-2xl bg-surface-raised px-3 py-3 text-left transition-all hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="relative h-9 w-9 shrink-0">
                              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-xs font-semibold text-brand">
                                {vault.protocolLogoUri ? (
                                  <Image
                                    src={vault.protocolLogoUri}
                                    alt={vault.protocol}
                                    width={36}
                                    height={36}
                                    className="h-full w-full object-contain"
                                    unoptimized
                                  />
                                ) : (
                                  vault.protocol.charAt(0).toUpperCase()
                                )}
                              </span>
                              {chainLogo ? (
                                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center overflow-hidden rounded-full border-2 border-(--color-surface-2) bg-(--color-surface-2)">
                                  <Image
                                    src={chainLogo}
                                    alt={vault.chainShortName}
                                    width={12}
                                    height={12}
                                    className="h-full w-full object-contain"
                                    unoptimized
                                  />
                                </span>
                              ) : null}
                            </div>
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-sm font-semibold text-main">
                                {vault.protocol}
                              </span>
                              <span className="truncate text-[11px] text-muted">
                                {vault.tokenSymbol} · {vault.chainShortName} ·{" "}
                                {formatTvl(vault.tvlUsd)} TVL
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${RISK_CLASS[vault.risk]}`}
                            >
                              {RISK_LABEL[vault.risk]}
                            </span>
                            <span className="text-sm font-semibold text-brand">
                              {formatApy(vault.apy)}
                            </span>
                            {alreadyAdded ? (
                              <FiCheck className="h-4 w-4 text-(--color-positive)" />
                            ) : null}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SkeletonRows() {
  return (
    <ul className="flex flex-col gap-2">
      {[0, 1, 2, 3].map((i) => (
        <motion.li
          key={i}
          className="h-[60px] rounded-2xl bg-surface-raised"
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </ul>
  );
}
