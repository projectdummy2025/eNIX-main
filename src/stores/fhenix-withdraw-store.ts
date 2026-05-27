import {
  getPublicClient,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import type { Config } from "wagmi";
import { create } from "zustand";
import {
  connectCofheClient,
  encryptUint64,
  ensurePermit,
} from "@/lib/fhenix-client";
import type { FhenixPortfolio } from "@/lib/fhenix-types";
import { FHENIX_YIELD_VAULT_ABI } from "@/lib/fhenix-types";

export type WithdrawStep =
  | "idle"
  | "ready"
  | "withdrawing"
  | "success"
  | "error";

type WithdrawState = {
  open: boolean;
  position: FhenixPortfolio | null;
  percentage: number;
  step: WithdrawStep;
  error: string | null;
  txHash: string | null;
  openSheet: (position: FhenixPortfolio) => void;
  closeSheet: () => void;
  setPercentage: (percentage: number) => void;
  executeWithdraw: (config: Config, account: `0x${string}`) => Promise<void>;
  setStep: (step: WithdrawStep) => void;
  setError: (error: string | null) => void;
  setTxHash: (txHash: string | null) => void;
};

function applyPercentage(balance: string, percentage: number): string {
  try {
    const balanceBigInt = BigInt(balance || "0");
    if (balanceBigInt === 0n) return "0";
    const pct = BigInt(Math.max(1, Math.min(100, percentage)));
    return ((balanceBigInt * pct) / 100n).toString();
  } catch {
    return "0";
  }
}

export const useFhenixWithdrawStore = create<WithdrawState>((set, get) => ({
  open: false,
  position: null,
  percentage: 100,
  step: "idle",
  error: null,
  txHash: null,

  openSheet: (position) => {
    set({
      open: true,
      position,
      percentage: 100,
      step: "idle",
      error: null,
      txHash: null,
    });
  },

  closeSheet: () => set({ open: false }),

  setPercentage: (percentage) => set({ percentage, step: "idle", error: null }),

  executeWithdraw: async (config, _account) => {
    const { position, percentage } = get();
    if (!position) {
      set({ step: "error", error: "No position selected" });
      return;
    }

    const vaultAddress = position.vaultAddress as `0x${string}`;
    const isZeroVault =
      vaultAddress === "0x0000000000000000000000000000000000000000";

    if (isZeroVault) {
      set({ step: "error", error: "Vault contract not deployed yet." });
      return;
    }

    try {
      const shares = applyPercentage(position.balance, percentage);
      if (shares === "0") throw new Error("Nothing to withdraw.");

      set({ step: "withdrawing", error: null });

      const sharesBigInt = BigInt(shares);

      const publicClient = getPublicClient(config, {
        chainId: position.chainId,
      });
      const walletClient = await import("@wagmi/core").then((m) =>
        m.getWalletClient(config, { chainId: position.chainId }),
      );
      if (!publicClient || !walletClient) {
        throw new Error("Failed to get viem clients");
      }

      // biome-ignore lint/suspicious/noExplicitAny: CoFHE SDK accepts raw viem clients
      await connectCofheClient(publicClient as any, walletClient as any);
      await ensurePermit();

      const encrypted = await encryptUint64(sharesBigInt);

      const inEuint64 = encrypted as unknown as {
        ctHash: bigint;
        securityZone: number;
        utype: number;
        signature: `0x${string}`;
      };

      const withdrawHash = await writeContract(config, {
        address: vaultAddress,
        abi: FHENIX_YIELD_VAULT_ABI,
        functionName: "withdraw",
        args: [inEuint64, sharesBigInt],
        chainId: position.chainId,
      });
      await waitForTransactionReceipt(config, {
        hash: withdrawHash,
        chainId: position.chainId,
      });

      set({ txHash: withdrawHash, step: "success" });
    } catch (error) {
      const raw = (error as Error).message || "Withdrawal failed";
      const lower = raw.toLowerCase();
      let msg = raw;
      if (lower.includes("user rejected"))
        msg = "Transaction rejected in wallet.";
      else if (lower.includes("insufficient")) msg = "Insufficient balance.";
      set({
        step: "error",
        error: msg.length > 160 ? `${msg.slice(0, 160)}…` : msg,
      });
    }
  },

  setStep: (step) => set({ step }),
  setError: (error) => set({ error }),
  setTxHash: (txHash) => set({ txHash }),
}));
