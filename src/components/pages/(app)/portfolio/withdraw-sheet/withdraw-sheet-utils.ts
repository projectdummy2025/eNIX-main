import { formatUnits } from "viem";

export function formatUsd(raw: string | number | undefined): string {
  const value = typeof raw === "string" ? Number.parseFloat(raw) : (raw ?? 0);
  if (!Number.isFinite(value) || value <= 0) return "$0.00";
  if (value < 0.01) return "< $0.01";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatBalance(
  raw: string,
  decimals: number,
  symbol: string,
): string {
  try {
    const value = BigInt(raw || "0");
    if (value === 0n) return `0 ${symbol}`;
    const amount = Number(formatUnits(value, decimals));
    if (!Number.isFinite(amount) || amount === 0) return `0 ${symbol}`;
    if (amount < 0.0001) return `< 0.0001 ${symbol}`;
    if (amount >= 1_000)
      return `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${symbol}`;
    return `${amount.toFixed(4)} ${symbol}`;
  } catch {
    return `— ${symbol}`;
  }
}

export function formatDuration(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds)) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.round(minutes)} min`;
  return `${(minutes / 60).toFixed(1)} h`;
}

export const PERCENTAGE_OPTIONS = [25, 50, 75, 100];
