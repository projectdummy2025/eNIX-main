import {
  getPublicClient,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { erc20Abi, parseGwei, parseUnits } from "viem";
import type { Config } from "wagmi";
import { create } from "zustand";
import {
  connectCofheClient,
  encryptUint64,
  ensurePermit,
} from "@/lib/fhenix-client";
import {
  FHENIX_CONTRACTS,
  FHENIX_VAULTS,
  FHENIX_YIELD_VAULT_ABI,
} from "@/lib/fhenix-types";
import type { Chain, Token, VaultStrategy } from "@/types";

export type DepositStep =
  | "idle"
  | "quoting"
  | "ready"
  | "approving"
  | "depositing"
  | "success"
  | "error";

type DepositState = {
  open: boolean;
  vault: VaultStrategy | null;
  token: Token | null;
  chain: Chain | null;
  amount: string;
  fromTokenAddress: string | null;
  fromTokenDecimals: number;
  quote: Record<string, unknown> | null;
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
  executeDeposit: (config: Config, account: `0x${string}`) => Promise<void>;
};

async function getGasParams(config: Config, chainId: number) {
  let maxFeePerGas = parseGwei("0.5");
  let maxPriorityFeePerGas = parseGwei("0.001");
  try {
    const client = getPublicClient(config, { chainId });
    const fees = await client?.estimateFeesPerGas();
    if (fees?.maxFeePerGas) {
      maxFeePerGas = fees.maxFeePerGas * 2n;
      maxPriorityFeePerGas = fees.maxPriorityFeePerGas ?? parseGwei("0.001");
    }
  } catch {}
  return { maxFeePerGas, maxPriorityFeePerGas };
}

function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("user rejected")) return "Transaction rejected in wallet.";
  if (lower.includes("insufficient")) return "Insufficient balance.";
  if (lower.includes("allowance")) return "Increase token allowance first.";
  return raw.length > 160 ? `${raw.slice(0, 160)}…` : raw;
}

function getUnderlyingForToken(tokenAddress: string): `0x${string}` {
  const lower = tokenAddress.toLowerCase();
  if (lower === FHENIX_CONTRACTS.USDC.toLowerCase())
    return FHENIX_CONTRACTS.USDC;
  if (lower === FHENIX_CONTRACTS.RLC.toLowerCase()) return FHENIX_CONTRACTS.RLC;
  return "0x0000000000000000000000000000000000000000";
}

function getVaultForToken(tokenAddress: string): `0x${string}` {
  const lower = tokenAddress.toLowerCase();
  if (lower === FHENIX_CONTRACTS.USDC.toLowerCase())
    return FHENIX_VAULTS.USDC_VAULT;
  if (lower === FHENIX_CONTRACTS.RLC.toLowerCase())
    return FHENIX_VAULTS.RLC_VAULT;
  return "0x0000000000000000000000000000000000000000";
}

export const useFhenixDepositStore = create<DepositState>((set, get) => ({
  open: false,
  vault: null,
  token: null,
  chain: null,
  amount: "",
  fromTokenAddress: null,
  fromTokenDecimals: 6,
  quote: null,
  step: "idle",
  error: null,
  txHash: null,

  openSheet: ({ vault, token, chain, amount }) => {
    set({
      open: true,
      vault,
      token,
      chain,
      amount,
      fromTokenAddress: vault.tokenAddress,
      fromTokenDecimals: vault.tokenDecimals,
      quote: null,
      step: "idle",
      error: null,
      txHash: null,
    });
  },

  closeSheet: () => set({ open: false }),

  reset: () =>
    set({
      open: false,
      vault: null,
      token: null,
      chain: null,
      amount: "",
      fromTokenAddress: null,
      fromTokenDecimals: 6,
      quote: null,
      step: "idle",
      error: null,
      txHash: null,
    }),

  setAmount: (amount) =>
    set({ amount, quote: null, step: "idle", error: null }),

  fetchQuote: async (_fromAddress, _config) => {
    const { vault, chain } = get();
    if (!vault || !chain) {
      set({ step: "error", error: "Missing deposit context" });
      return;
    }

    const trimmed = get().amount.trim();
    if (!trimmed || Number.parseFloat(trimmed) <= 0) {
      set({ step: "error", error: "Enter an amount to continue" });
      return;
    }

    if (chain.id !== vault.chainId) {
      set({
        step: "error",
        error: `Please switch to Arbitrum Sepolia (421614) to deposit. These vaults are only on testnet.`,
      });
      return;
    }
    set({ step: "ready", error: null });
  },

  executeDeposit: async (config, _account) => {
    const { vault, chain, amount } = get();
    if (!vault || !chain) {
      set({ step: "error", error: "Missing deposit context" });
      return;
    }

    set({ step: "approving", error: null });

    try {
      const amountBigInt = parseUnits(amount, vault.tokenDecimals);

      const _tokenAddress = vault.tokenAddress as `0x${string}`;
      const underlyingAddress = getUnderlyingForToken(vault.tokenAddress);
      const yieldVaultAddress = getVaultForToken(vault.tokenAddress);

      const isZeroVault =
        yieldVaultAddress === "0x0000000000000000000000000000000000000000";

      if (isZeroVault) {
        set({
          step: "error",
          error:
            "Vault contract not deployed yet. Please deploy FhenixYieldVault first.",
        });
        return;
      }

      const targetChainId = vault.chainId;
      const gasParams = await getGasParams(config, targetChainId);

      const approveHash = await writeContract(config, {
        address: underlyingAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [yieldVaultAddress, amountBigInt],
        chainId: targetChainId,
        gas: 100_000n,
        ...gasParams,
      });
      await waitForTransactionReceipt(config, {
        hash: approveHash,
        chainId: targetChainId,
      });

      set({ step: "depositing" });

      const publicClient = getPublicClient(config, { chainId: targetChainId });
      const walletClient = await import("@wagmi/core").then((m) =>
        m.getWalletClient(config, { chainId: targetChainId }),
      );
      if (!publicClient || !walletClient) {
        throw new Error("Failed to get viem clients");
      }

      // biome-ignore lint/suspicious/noExplicitAny: CoFHE SDK accepts raw viem clients
      await connectCofheClient(publicClient as any, walletClient as any);
      await ensurePermit();

      const encrypted = await encryptUint64(amountBigInt);

      const inEuint64 = encrypted as unknown as {
        ctHash: bigint;
        securityZone: number;
        utype: number;
        signature: `0x${string}`;
      };

      const depositHash = await writeContract(config, {
        address: yieldVaultAddress,
        abi: FHENIX_YIELD_VAULT_ABI,
        functionName: "deposit",
        args: [inEuint64, amountBigInt],
        chainId: targetChainId,
        gas: 500_000n,
        ...gasParams,
      });
      await waitForTransactionReceipt(config, {
        hash: depositHash,
        chainId: targetChainId,
      });

      set({ txHash: depositHash, step: "success" });
    } catch (error) {
      const message = (error as Error).message || "Deposit failed";
      set({ step: "error", error: friendlyError(message) });
    }
  },

  setStep: (step) => set({ step }),
  setError: (error) => set({ error }),
  setTxHash: (txHash) => set({ txHash }),
}));
