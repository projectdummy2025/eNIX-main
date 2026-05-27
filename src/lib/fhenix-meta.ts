"use client";

import type { FhenixChain, FhenixToken } from "./fhenix-types";
import { FHENIX_CHAINS, FHENIX_TOKENS } from "./fhenix-types";

export type FhenixMetaResponse = {
  chains: FhenixChain[];
  tokens: Record<number, FhenixToken[]>;
};

export async function fetchFhenixMeta(
  signal?: AbortSignal,
): Promise<FhenixMetaResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const response = await fetch(`${baseUrl}/api/fhenix/meta`, {
    signal,
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`fhenix_meta_failed_${response.status}`);
  }

  return (await response.json()) as FhenixMetaResponse;
}

export function getSupportedChains(): FhenixChain[] {
  return FHENIX_CHAINS;
}

export function getTokensForChain(chainId: number): FhenixToken[] {
  return FHENIX_TOKENS[chainId] ?? [];
}

export function findTokenByAddress(
  chainId: number,
  address: string,
): FhenixToken | undefined {
  const tokens = getTokensForChain(chainId);
  return tokens.find((t) => t.address.toLowerCase() === address.toLowerCase());
}

export function getChainById(chainId: number): FhenixChain | undefined {
  return FHENIX_CHAINS.find((c) => c.id === chainId);
}

export const CHAIN_EXPLORERS: Record<number, string> = {
  421614: "https://sepolia.arbiscan.io",
  42161: "https://arbiscan.io",
};

export function getExplorerUrl(chainId: number, address?: string): string {
  const base = CHAIN_EXPLORERS[chainId] ?? "https://arbiscan.io";
  if (address) {
    return `${base}/address/${address}`;
  }
  return base;
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const base = CHAIN_EXPLORERS[chainId] ?? "https://arbiscan.io";
  return `${base}/tx/${txHash}`;
}
