"use client";

import type {
  FetchVaultsParams,
  FhenixVault,
  FhenixVaultsResponse,
} from "./fhenix-types";

export type { FhenixVault, FhenixVaultsResponse, FetchVaultsParams };

export async function fetchVaultsViaProxy(
  params: FetchVaultsParams,
  signal?: AbortSignal,
): Promise<FhenixVaultsResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const url = new URL("/api/fhenix/vaults", baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    signal,
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`vaults_fetch_failed_${response.status}`);
  }

  return (await response.json()) as FhenixVaultsResponse;
}

export function filterVaults(
  vaults: FhenixVault[],
  params: FetchVaultsParams,
): FhenixVault[] {
  let filtered = [...vaults];

  if (params.chainId) {
    filtered = filtered.filter((v) => v.chainId === params.chainId);
  }

  if (params.tokenAddress) {
    filtered = filtered.filter(
      (v) =>
        v.underlyingToken.address.toLowerCase() ===
        params.tokenAddress!.toLowerCase(),
    );
  }

  if (params.protocol) {
    filtered = filtered.filter(
      (v) => v.protocol.toLowerCase() === params.protocol!.toLowerCase(),
    );
  }

  if (params.minTvlUsd) {
    filtered = filtered.filter(
      (v) => parseFloat(v.tvl.usd) >= params.minTvlUsd!,
    );
  }

  return filtered;
}

export function sortVaults(
  vaults: FhenixVault[],
  sortBy: "apy" | "tvl" = "apy",
): FhenixVault[] {
  return [...vaults].sort((a, b) => {
    if (sortBy === "apy") {
      return b.apy.total - a.apy.total;
    }
    return parseFloat(b.tvl.usd) - parseFloat(a.tvl.usd);
  });
}

export function getRiskColor(riskTier?: "low" | "medium" | "high"): string {
  switch (riskTier) {
    case "low":
      return "text-green-500";
    case "medium":
      return "text-yellow-500";
    case "high":
      return "text-red-500";
    default:
      return "text-muted";
  }
}

export function formatAPY(apy: number | null): string {
  if (apy === null) return "N/A";
  return `${apy.toFixed(2)}%`;
}

export function formatTVL(tvlUsd: string): string {
  const tvl = parseFloat(tvlUsd);
  if (tvl >= 1000000000) {
    return `$${(tvl / 1000000000).toFixed(1)}B`;
  }
  if (tvl >= 1000000) {
    return `$${(tvl / 1000000).toFixed(1)}M`;
  }
  if (tvl >= 1000) {
    return `$${(tvl / 1000).toFixed(1)}K`;
  }
  return `$${tvl.toFixed(0)}`;
}
