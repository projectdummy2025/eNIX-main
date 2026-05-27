"use client";

import { useEffect, useMemo, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";

const NATIVE_TOKEN_ADDRESSES = new Set([
  "0x0000000000000000000000000000000000000000",
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
]);

import { mockChains } from "@/data";
import { useWalletReady } from "@/lib/wallet-ready";
import { useExpertStore, useMetaStore } from "@/stores";
import { Selector } from "../selector";
import { YIELD_PERIODS, type YieldPeriod } from "./constants";
import { formatUsd } from "./utils";

export function SupplyCard() {
  const token = useExpertStore((state) => state.token);
  const chain = useExpertStore((state) => state.chain);
  const amount = useExpertStore((state) => state.amount);
  const vaults = useExpertStore((state) => state.vaults);
  const selectedVaultId = useExpertStore((state) => state.selectedVaultId);
  const setToken = useExpertStore((state) => state.setToken);
  const setChain = useExpertStore((state) => state.setChain);
  const setAmount = useExpertStore((state) => state.setAmount);

  const chainsById = useMetaStore((state) => state.chainsById);
  const tokensByChain = useMetaStore((state) => state.tokensByChain);
  const metaStatus = useMetaStore((state) => state.status);
  const loadMeta = useMetaStore((state) => state.loadMeta);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const [yieldPeriod, setYieldPeriod] = useState<YieldPeriod>("year");
  const activePeriod =
    YIELD_PERIODS.find((period) => period.key === yieldPeriod) ??
    YIELD_PERIODS[0];

  const selectedVault = useMemo(
    () => vaults.find((vault) => vault.id === selectedVaultId) ?? null,
    [vaults, selectedVaultId],
  );
  const apyPercent = selectedVault?.apy ?? 0;
  const apyDecimal = apyPercent / 100;

  const amountNumber = Number.parseFloat(amount || "0");
  const usdValue = Number.isFinite(amountNumber)
    ? amountNumber * token.usdPrice
    : 0;
  const estimatedYearly = usdValue * apyDecimal;
  const estimatedForPeriod = estimatedYearly / activePeriod.divisor;
  const hintValue = estimatedYearly / activePeriod.hintDivisor;

  const chainTokens = useMemo(() => {
    const list = tokensByChain[chain.id];
    if (!list || list.length === 0) return [];
    const seen = new Set<string>();
    return list.filter((t) => {
      const key = t.symbol.toUpperCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [chain.id, tokensByChain]);

  const tokenOptions = useMemo(
    () =>
      chainTokens.map((item) => ({
        key: item.symbol,
        label: item.symbol,
        hint: item.name,
        iconUrl: item.logoURI,
      })),
    [chainTokens],
  );

  useEffect(() => {
    if (chainTokens.length === 0) return;
    const exists = chainTokens.some((t) => t.symbol === token.symbol);
    if (!exists) {
      const first = chainTokens[0];
      setToken({
        symbol: first.symbol,
        name: first.name,
        usdPrice: Number.parseFloat(first.priceUSD ?? "0") || 0,
      });
    }
  }, [chainTokens, token.symbol, setToken]);

  const chainOptions = useMemo(
    () =>
      mockChains.map((item) => ({
        key: String(item.id),
        label: item.shortName,
        hint: item.name,
        iconUrl: chainsById[item.id]?.logoURI,
      })),
    [chainsById],
  );

  function handleAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    if (next === "" || /^\d*\.?\d*$/.test(next)) {
      setAmount(next);
    }
  }

  function handleTokenSelect(symbol: string) {
    const meta = chainTokens.find((t) => t.symbol === symbol);
    if (meta) {
      setToken({
        symbol: meta.symbol,
        name: meta.name,
        usdPrice: Number.parseFloat(meta.priceUSD ?? "0") || 0,
      });
    }
  }

  function handleChainSelect(id: string) {
    const next = mockChains.find((item) => String(item.id) === id);
    if (next) setChain(next);
  }

  return (
    <section className="rounded-3xl border border-main bg-surface p-2.5 ">
      <div className="flex items-center justify-between px-2 pt-1">
        <div className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-main">
          Supply
        </div>
        <Selector
          label="Select network"
          value={String(chain.id)}
          options={chainOptions}
          onSelect={handleChainSelect}
          variant="pill"
          locked
        />
      </div>

      <div className="relative mt-2">
        <div className="rounded-2xl bg-surface-raised p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">You supply</span>
            <span className="text-[11px] text-muted">on {chain.shortName}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={handleAmountChange}
              className="w-full bg-transparent text-[28px] font-medium leading-none tracking-tight text-main outline-none placeholder:text-faint"
            />
            <Selector
              label="Select token"
              value={token.symbol}
              options={tokenOptions}
              onSelect={handleTokenSelect}
              variant="pill"
              emptyLabel="No tokens"
              loading={metaStatus !== "ready"}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted">${formatUsd(usdValue)}</span>
            <TokenBalance
              chainId={chain.id}
              tokenSymbol={token.symbol}
              onMax={setAmount}
            />
          </div>
        </div>

        <div className="relative mt-1 rounded-2xl bg-surface-raised p-3">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-4 border-(--color-surface-1) bg-brand">
              <FiChevronDown className="h-4 w-4 text-white" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted">
              {activePeriod.title}
            </span>
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand whitespace-nowrap">
              {apyPercent.toFixed(2)}% APY
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 rounded-full bg-surface-muted p-1">
            {YIELD_PERIODS.map((period) => {
              const isActive = period.key === yieldPeriod;
              return (
                <button
                  key={period.key}
                  type="button"
                  onClick={() => setYieldPeriod(period.key)}
                  className={
                    isActive
                      ? "flex-1 rounded-full bg-surface-raised px-2.5 py-1 text-[11px] font-semibold text-main cursor-pointer transition-colors"
                      : "flex-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-muted cursor-pointer transition-colors hover:text-main"
                  }
                >
                  {period.label}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="flex-1 truncate text-[28px] font-medium leading-none tracking-tight text-main">
              ${formatUsd(estimatedForPeriod)}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-faint whitespace-nowrap">
              {activePeriod.suffix}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-muted">
              ~${formatUsd(hintValue)} / {activePeriod.hintLabel}
            </span>
            <span className="truncate text-muted">
              {selectedVault
                ? `via ${selectedVault.protocol}`
                : `Best route on ${chain.shortName}`}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function TokenBalance({
  chainId,
  tokenSymbol,
  onMax,
}: {
  chainId: number;
  tokenSymbol: string;
  onMax: (value: string) => void;
}) {
  const walletReady = useWalletReady();
  if (!walletReady) {
    return <span className="text-muted">Balance 0.00 {tokenSymbol}</span>;
  }
  return (
    <TokenBalanceInner
      chainId={chainId}
      tokenSymbol={tokenSymbol}
      onMax={onMax}
    />
  );
}

function TokenBalanceInner({
  chainId,
  tokenSymbol,
  onMax,
}: {
  chainId: number;
  tokenSymbol: string;
  onMax: (value: string) => void;
}) {
  const { address, isConnected } = useAccount();
  const tokensBySymbol = useMetaStore((state) => state.tokensBySymbol);
  const tokenMeta = tokensBySymbol[chainId]?.[tokenSymbol.toUpperCase()];
  const isNative = tokenMeta
    ? NATIVE_TOKEN_ADDRESSES.has(tokenMeta.address.toLowerCase())
    : false;

  const { data: erc20Balance } = useReadContract({
    address: tokenMeta?.address as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId,
    query: {
      enabled: isConnected && !!address && !!tokenMeta?.address && !isNative,
      refetchInterval: 15_000,
    },
  });

  const { data: nativeBalance } = useBalance({
    address,
    chainId,
    query: {
      enabled: isConnected && !!address && isNative,
      refetchInterval: 15_000,
    },
  });

  if (!isConnected || !tokenMeta) {
    return <span className="text-muted">Balance 0.00 {tokenSymbol}</span>;
  }

  const raw = isNative
    ? nativeBalance?.value
    : (erc20Balance as bigint | undefined);
  if (raw === undefined) {
    return <span className="text-muted">Balance — {tokenSymbol}</span>;
  }

  const decimals = isNative
    ? (nativeBalance?.decimals ?? tokenMeta.decimals)
    : tokenMeta.decimals;
  const amount = Number(formatUnits(raw, decimals));
  const fullAmount = formatUnits(raw, decimals);
  const display =
    amount < 0.0001 && amount > 0
      ? "< 0.0001"
      : amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        });

  return (
    <span className="flex items-center gap-1.5 text-muted">
      Balance {display} {tokenSymbol}
      {amount > 0 ? (
        <button
          type="button"
          onClick={() => onMax(fullAmount)}
          className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white/90 bg-brand cursor-pointer transition-colors hover:bg-brand hover:text-white"
        >
          MAX
        </button>
      ) : null}
    </span>
  );
}
