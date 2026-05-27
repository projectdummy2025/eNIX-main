"use client";

import { erc20Abi } from "viem";
import { encryptUint64, ensurePermit } from "./fhenix-client";
import type { FhenixQuote, FhenixQuoteStep, FhenixToken } from "./fhenix-types";
import { FHENIX_YIELD_VAULT_ABI } from "./fhenix-types";

export type QuoteParams = {
  vaultAddress: string;
  tokenIn: FhenixToken;
  amountIn: string;
};

export async function fetchQuote(
  params: QuoteParams,
  signal?: AbortSignal,
): Promise<FhenixQuote> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const url = new URL("/api/fhenix/quote", baseUrl);
  url.searchParams.set("vaultAddress", params.vaultAddress);
  url.searchParams.set("tokenIn", params.tokenIn.address);
  url.searchParams.set("amountIn", params.amountIn);

  const response = await fetch(url.toString(), {
    signal,
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`quote_failed_${response.status}`);
  }

  return (await response.json()) as FhenixQuote;
}

export async function executeDeposit(
  vaultAddress: `0x${string}`,
  tokenAddress: `0x${string}`,
  amount: bigint,
  account: `0x${string}`,
  publicClient: any,
  walletClient: any,
): Promise<{ hash: `0x${string}` }> {
  const encrypted = await encryptUint64(amount);

  const approveHash = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [vaultAddress, amount],
    account,
  });

  const depositHash = await walletClient.writeContract({
    address: vaultAddress,
    abi: FHENIX_YIELD_VAULT_ABI,
    functionName: "deposit",
    args: [encrypted, amount],
    account,
  });

  return { hash: depositHash };
}

export async function executeWithdraw(
  vaultAddress: `0x${string}`,
  shares: bigint,
  account: `0x${string}`,
  walletClient: any,
): Promise<{ hash: `0x${string}` }> {
  await ensurePermit();
  const encrypted = await encryptUint64(shares);

  const withdrawHash = await walletClient.writeContract({
    address: vaultAddress,
    abi: FHENIX_YIELD_VAULT_ABI,
    functionName: "withdraw",
    args: [encrypted, shares],
    account,
  });

  return { hash: withdrawHash };
}

export function buildQuoteSteps(
  tokenIn: FhenixToken,
  amountIn: string,
): FhenixQuoteStep[] {
  return [
    {
      type: "approve",
      token: tokenIn,
      amount: amountIn,
    },
    {
      type: "deposit",
      token: tokenIn,
      amount: amountIn,
    },
  ];
}

export function getQuoteSummary(quote: FhenixQuote): string {
  const steps = quote.steps.map((s) => s.type);
  if (steps.includes("approve") && steps.includes("deposit")) {
    return "Approve → Deposit encrypted tokens";
  }
  return "Deposit encrypted tokens";
}
