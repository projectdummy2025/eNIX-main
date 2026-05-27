export function formatUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0.00";
  if (value < 0.01) return "< $0.01";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatAmount(value: number, symbol: string): string {
  if (!Number.isFinite(value)) return `0 ${symbol}`;
  if (value === 0) return `0 ${symbol}`;
  if (value < 0.0001) return `< 0.0001 ${symbol}`;
  if (value >= 1_000)
    return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${symbol}`;
  if (value >= 1) return `${value.toFixed(3)} ${symbol}`;
  return `${value.toFixed(4)} ${symbol}`;
}

export function formatPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value >= 1_000)
    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `$${value.toFixed(2)}`;
}

export const SKELETON_ROWS = [0, 1, 2, 3];
