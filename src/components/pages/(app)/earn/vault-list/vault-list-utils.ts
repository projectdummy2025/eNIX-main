import type { VaultRisk, VaultSortKey, VaultStrategy } from "@/types";

export const RISK_LABEL: Record<VaultRisk, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const RISK_CLASS: Record<VaultRisk, string> = {
  low: "bg-[rgba(64,182,107,0.12)] text-(--color-positive)",
  medium: "bg-[rgba(96,165,250,0.14)] text-[#60a5fa]",
  high: "bg-[rgba(250,43,57,0.12)] text-(--color-negative)",
};

export const BLOCK_EXPLORERS: Record<number, string> = {
  1: "https://etherscan.io/address",
  10: "https://optimistic.etherscan.io/address",
  137: "https://polygonscan.com/address",
  8453: "https://basescan.org/address",
  42161: "https://arbiscan.io/address",
};

export function formatTvl(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatApy(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
}

export function resolveVaultLink(vault: VaultStrategy): string | null {
  if (vault.protocolUrl) return vault.protocolUrl;
  const explorer = BLOCK_EXPLORERS[vault.chainId];
  if (!explorer) return null;
  return `${explorer}/${vault.vaultAddress}`;
}

export function formatTimelock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const days = seconds / 86_400;
  if (days >= 1) return `${days.toFixed(0)}d lock`;
  const hours = seconds / 3_600;
  if (hours >= 1) return `${hours.toFixed(0)}h lock`;
  return `${Math.round(seconds / 60)}m lock`;
}

export function sortVaults(
  vaults: VaultStrategy[],
  sortBy: VaultSortKey,
): VaultStrategy[] {
  const next = [...vaults];
  if (sortBy === "apy") next.sort((a, b) => b.apy - a.apy);
  if (sortBy === "tvl") next.sort((a, b) => b.tvlUsd - a.tvlUsd);
  return next;
}
