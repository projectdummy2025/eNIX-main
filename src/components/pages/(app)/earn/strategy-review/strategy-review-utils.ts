import type { VaultRisk, VaultStrategy } from "@/types";

export const BLOCK_EXPLORERS: Record<number, string> = {
  1: "https://etherscan.io/address",
  10: "https://optimistic.etherscan.io/address",
  137: "https://polygonscan.com/address",
  8453: "https://basescan.org/address",
  42161: "https://arbiscan.io/address",
};

export const RISK_LABEL: Record<VaultRisk, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const RISK_CLASS: Record<VaultRisk, string> = {
  low: "bg-[rgba(64,182,107,0.12)] text-(--color-positive)",
  medium: "bg-brand-soft text-brand",
  high: "bg-[rgba(250,43,57,0.12)] text-(--color-negative)",
};

export const PREVIEW_PERIODS: {
  key: string;
  label: string;
  divisor: number;
}[] = [
  { key: "year", label: "1Y", divisor: 1 },
  { key: "month", label: "1M", divisor: 12 },
  { key: "week", label: "1W", divisor: 52 },
  { key: "day", label: "1D", divisor: 365 },
];

export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address || "";
  return `${address.slice(0, 6)}\u2026${address.slice(-4)}`;
}

export function formatTvl(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "\u2014";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatApy(value: number): string {
  if (!Number.isFinite(value)) return "\u2014";
  return `${value.toFixed(2)}%`;
}

export function formatUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0.00";
  if (value >= 1_000_000)
    return `$${(value / 1_000_000).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}M`;
  if (value >= 10_000)
    return `$${value.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatTimelock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "None";
  const days = seconds / 86_400;
  if (days >= 1) return `${days.toFixed(0)}d lock`;
  const hours = seconds / 3_600;
  if (hours >= 1) return `${hours.toFixed(0)}h lock`;
  return `${Math.round(seconds / 60)}m lock`;
}

export function explorerUrl(vault: VaultStrategy): string | null {
  const base = BLOCK_EXPLORERS[vault.chainId];
  if (!base) return null;
  return `${base}/${vault.vaultAddress}`;
}
