import { readContract } from "@wagmi/core";
import { encodeFunctionData, parseUnits } from "viem";
import type { Config } from "wagmi";
import { create } from "zustand";
import { fetchQuoteViaProxy, type LifiQuoteResponse } from "@/lib/lifi-quote";
import type { Chain, Token, VaultStrategy } from "@/types";
import { useMetaStore } from "./meta-store";

export type DepositStep =
  | "idle"
  | "quoting"
  | "ready"
  | "approving"
  | "depositing"
  | "success"
  | "error";

export const ERC4626_DIRECT_DEPOSIT_TOOL = "erc4626-direct";
export const ERC4626_WRAP_AND_DEPOSIT_TOOL = "erc4626-wrap-deposit";

const ERC4626_DEPOSIT_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  {
    name: "previewDeposit",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "assets", type: "uint256" }],
    outputs: [{ name: "shares", type: "uint256" }],
  },
] as const;

const NATIVE_PLACEHOLDERS = new Set([
  "0x0000000000000000000000000000000000000000",
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
]);

type DepositState = {
  open: boolean;
  vault: VaultStrategy | null;
  token: Token | null;
  chain: Chain | null;
  amount: string;
  fromTokenAddress: string | null;
  fromTokenDecimals: number;
  quote: LifiQuoteResponse | null;
  step: DepositStep;
  error: string | null;
  txHash: string | null;
  openSheet: (args: {
    vault: VaultStrategy;
    token: Token;
    chain: Chain;
    amount: string;
  }) => void;
  closeSheet: () => void;
  reset: () => void;
  setAmount: (amount: string) => void;
  fetchQuote: (fromAddress: string, config: Config) => Promise<void>;
  setStep: (step: DepositStep) => void;
  setError: (error: string | null) => void;
  setTxHash: (txHash: string | null) => void;
};

let quoteController: AbortController | null = null;

function friendlyQuoteError(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes("no available quotes") ||
    lower.includes("no_possible_route") ||
    lower.includes("no_quote")
  ) {
    return "No route available for this vault right now. Try a different amount, token, or vault.";
  }
  if (lower.includes("insufficient")) {
    return "Insufficient balance or liquidity to complete this deposit.";
  }
  if (lower.includes("slippage")) {
    return "Route exceeds slippage tolerance. Try a smaller amount.";
  }
  if (lower.includes("upstream_error") || lower.startsWith("{")) {
    return "We couldn't fetch a route. Please try again in a moment.";
  }
  return raw.length > 160 ? `${raw.slice(0, 160)}…` : raw;
}

async function buildDirectDepositQuote({
  config,
  chain,
  vault,
  fromAmount,
  fromAddress,
  fromIsNative,
  fromTokenAddress,
  fromTokenDecimals,
  fromTokenSymbol,
}: {
  config: Config;
  chain: Chain;
  vault: VaultStrategy;
  fromAmount: string;
  fromAddress: string;
  fromIsNative: boolean;
  fromTokenAddress: string;
  fromTokenDecimals: number;
  fromTokenSymbol: string;
}): Promise<LifiQuoteResponse | null> {
  try {
    const vaultAddress = vault.vaultAddress as `0x${string}`;
    const owner = fromAddress as `0x${string}`;
    const assets = BigInt(fromAmount);

    const previewedSharesRaw = await readContract(config, {
      address: vaultAddress,
      abi: ERC4626_DEPOSIT_ABI,
      functionName: "previewDeposit",
      args: [assets],
      chainId: chain.id,
    });
    const previewedShares = previewedSharesRaw as bigint;

    const tool = fromIsNative
      ? ERC4626_WRAP_AND_DEPOSIT_TOOL
      : ERC4626_DIRECT_DEPOSIT_TOOL;

    const calldata = encodeFunctionData({
      abi: ERC4626_DEPOSIT_ABI,
      functionName: "deposit",
      args: [assets, owner],
    });

    const slippageBps = 50n;
    const minShares = (previewedShares * (10_000n - slippageBps)) / 10_000n;

    return {
      id: "local-deposit",
      type: "lifi",
      tool,
      action: {
        fromChainId: chain.id,
        toChainId: chain.id,
        fromToken: {
          address: fromTokenAddress,
          symbol: fromTokenSymbol,
          decimals: fromTokenDecimals,
          chainId: chain.id,
        },
        toToken: {
          address: vaultAddress,
          symbol: vault.vaultName,
          decimals: vault.tokenDecimals,
          chainId: chain.id,
        },
        fromAmount: assets.toString(),
        slippage: 0.005,
        fromAddress,
        toAddress: fromAddress,
      },
      estimate: {
        fromAmount: assets.toString(),
        toAmount: previewedShares.toString(),
        toAmountMin: minShares.toString(),
        approvalAddress: fromIsNative ? undefined : vaultAddress,
        executionDuration: 0,
      },
      transactionRequest: {
        to: vaultAddress,
        data: calldata,
        value: "0",
        chainId: chain.id,
      },
    };
  } catch {
    return null;
  }
}

function resolveFromToken(
  chainId: number,
  symbol: string,
  fallbackAddress: string,
  fallbackDecimals: number,
) {
  const meta = useMetaStore.getState();
  const token = meta.tokensBySymbol[chainId]?.[symbol.toUpperCase()];
  return {
    address: token?.address ?? fallbackAddress,
    decimals: token?.decimals ?? fallbackDecimals,
  };
}

export const useDepositStore = create<DepositState>((set, get) => ({
  open: false,
  vault: null,
  token: null,
  chain: null,
  amount: "",
  fromTokenAddress: null,
  fromTokenDecimals: 18,
  quote: null,
  step: "idle",
  error: null,
  txHash: null,
  openSheet: ({ vault, token, chain, amount }) => {
    const resolved = resolveFromToken(
      chain.id,
      token.symbol,
      vault.tokenAddress,
      vault.tokenDecimals,
    );
    set({
      open: true,
      vault,
      token,
      chain,
      amount,
      fromTokenAddress: resolved.address,
      fromTokenDecimals: resolved.decimals,
      quote: null,
      step: "idle",
      error: null,
      txHash: null,
    });
  },
  closeSheet: () => {
    if (quoteController) {
      quoteController.abort();
      quoteController = null;
    }
    set({ open: false });
  },
  reset: () =>
    set({
      open: false,
      vault: null,
      token: null,
      chain: null,
      amount: "",
      fromTokenAddress: null,
      fromTokenDecimals: 18,
      quote: null,
      step: "idle",
      error: null,
      txHash: null,
    }),
  setAmount: (amount) =>
    set({ amount, quote: null, step: "idle", error: null }),
  fetchQuote: async (fromAddress, config) => {
    const { vault, token, chain, amount, fromTokenAddress, fromTokenDecimals } =
      get();
    if (!vault || !token || !chain || !fromTokenAddress) {
      set({ step: "error", error: "Missing deposit context" });
      return;
    }
    const trimmed = amount.trim();
    if (!trimmed || Number.parseFloat(trimmed) <= 0) {
      set({ step: "error", error: "Enter an amount to continue" });
      return;
    }

    if (quoteController) {
      quoteController.abort();
    }
    const controller = new AbortController();
    quoteController = controller;

    set({ step: "quoting", error: null });

    const fromAmount = parseUnits(trimmed, fromTokenDecimals).toString();
    const sameChain = chain.id === vault.chainId;
    const fromIsNative = NATIVE_PLACEHOLDERS.has(
      fromTokenAddress.toLowerCase(),
    );
    const fromIsUnderlying =
      vault.tokenAddress.toLowerCase() === fromTokenAddress.toLowerCase();

    const trySynthetic = sameChain && (fromIsUnderlying || fromIsNative);

    try {
      if (trySynthetic) {
        const synthetic = await buildDirectDepositQuote({
          config,
          chain,
          vault,
          fromAmount,
          fromAddress,
          fromIsNative,
          fromTokenAddress,
          fromTokenDecimals,
          fromTokenSymbol: token.symbol,
        });
        if (controller.signal.aborted) return;
        if (synthetic) {
          set({ quote: synthetic, step: "ready", error: null });
          return;
        }
      }

      const quote = await fetchQuoteViaProxy(
        {
          fromChain: chain.id,
          toChain: vault.chainId,
          fromToken: fromTokenAddress,
          toToken: vault.vaultAddress,
          fromAddress,
          fromAmount,
          slippage: 0.005,
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      set({ quote, step: "ready", error: null });
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      const message = (error as Error).message || "Failed to fetch quote";
      set({
        step: "error",
        error: friendlyQuoteError(message),
      });
    }
  },
  setStep: (step) => set({ step }),
  setError: (error) => set({ error }),
  setTxHash: (txHash) => set({ txHash }),
}));
