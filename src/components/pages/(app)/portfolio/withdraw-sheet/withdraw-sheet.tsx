"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  FiArrowDown,
  FiCheck,
  FiExternalLink,
  FiLoader,
  FiX,
} from "react-icons/fi";
import { formatUnits } from "viem";
import { useAccount, useChainId, useConfig, useSwitchChain } from "wagmi";
import type { FhenixPortfolio } from "@/lib/fhenix-types";
import type { LifiPortfolioPosition } from "@/lib/lifi-portfolio";
import { useWalletReady } from "@/lib/wallet-ready";
import {
  useFhenixWithdrawStore,
  useMetaStore,
  useWithdrawStore,
} from "@/stores";
import { ConnectPrompt, LoadingState } from "./withdraw-sheet-states";

function isFhenixProtocol(
  pos: LifiPortfolioPosition | FhenixPortfolio | null | undefined,
): boolean {
  if (!pos) return false;
  const protocol =
    "protocolName" in pos
      ? (
          pos as unknown as { protocolName?: string }
        ).protocolName?.toLowerCase()
      : "";
  return protocol?.includes("fhenix") || false;
}

export function WithdrawSheet() {
  const lifiOpen = useWithdrawStore((state) => state.open);
  const lifiCloseSheet = useWithdrawStore((state) => state.closeSheet);
  const lifiPosition = useWithdrawStore((state) => state.position) as unknown as
    | LifiPortfolioPosition
    | FhenixPortfolio
    | null
    | undefined;

  const fhenixOpen = useFhenixWithdrawStore((state) => state.open);
  const fhenixCloseSheet = useFhenixWithdrawStore((state) => state.closeSheet);
  const fhenixPosition = useFhenixWithdrawStore((state) => state.position);

  const ready = useWalletReady();

  const { address, isConnected } = useAccount();

  const isFhenixLiFi = isFhenixProtocol(lifiPosition);
  const isFhenixPos = fhenixPosition && isFhenixProtocol(fhenixPosition);

  const currentOpen = isFhenixLiFi || isFhenixPos ? fhenixOpen : lifiOpen;
  const currentClose =
    isFhenixLiFi || isFhenixPos ? fhenixCloseSheet : lifiCloseSheet;

  return (
    <AnimatePresence>
      {currentOpen ? (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={currentClose}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center sm:p-6"
        >
          <motion.div
            key="sheet"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[520px] overflow-hidden rounded-t-3xl border border-main bg-surface sm:rounded-3xl"
          >
            {ready ? <WithdrawBody /> : <LoadingState />}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function WithdrawBody() {
  const lifiCloseSheet = useWithdrawStore((state) => state.closeSheet);
  const lifiPosition = useWithdrawStore((state) => state.position);

  const fhenixCloseSheet = useFhenixWithdrawStore((state) => state.closeSheet);
  const fhenixPosition = useFhenixWithdrawStore((state) => state.position);

  const { address, isConnected } = useAccount();

  const isFhenixLiFi = isFhenixProtocol(lifiPosition);
  const isFhenixPos = fhenixPosition && isFhenixProtocol(fhenixPosition);

  if (!isConnected || !address) {
    return <ConnectPrompt />;
  }

  if (isFhenixLiFi || isFhenixPos) {
    return (
      <div className="flex flex-col">
        <SheetHeader onClose={fhenixCloseSheet} isFhenix />
        <div className="px-5 pb-5 pt-4">
          <FhenixWithdrawFlow />
        </div>
      </div>
    );
  }

  if (!lifiPosition) return null;

  return (
    <div className="flex flex-col">
      <SheetHeader onClose={lifiCloseSheet} isFhenix={false} />
      <div className="px-5 pb-5 pt-4">
        <p className="text-sm text-muted">LI.FI withdraw flow</p>
      </div>
    </div>
  );
}

function SheetHeader({
  onClose,
  isFhenix,
}: {
  onClose: () => void;
  isFhenix: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-main px-5 py-4">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
          Withdraw
        </div>
        <h3 className="text-base font-semibold text-main">
          {isFhenix
            ? "Confidential withdrawal"
            : "Pull funds out of your vault"}
        </h3>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-surface-raised text-muted transition-colors hover:bg-surface-muted hover:text-main"
      >
        <FiX className="h-4 w-4" />
      </button>
    </div>
  );
}

function FhenixWithdrawFlow() {
  const fhenixPosition = useFhenixWithdrawStore((state) => state.position)!;
  const percentage = useFhenixWithdrawStore((state) => state.percentage);
  const step = useFhenixWithdrawStore((state) => state.step);
  const error = useFhenixWithdrawStore((state) => state.error);
  const txHash = useFhenixWithdrawStore((state) => state.txHash);
  const setPercentage = useFhenixWithdrawStore((state) => state.setPercentage);
  const executeWithdraw = useFhenixWithdrawStore(
    (state) => state.executeWithdraw,
  );
  const setStep = useFhenixWithdrawStore((state) => state.setStep);

  const config = useConfig();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { address } = useAccount();
  const chainsById = useMetaStore((state) => state.chainsById);

  if (!fhenixPosition) {
    return <LoadingState />;
  }

  const balance = fhenixPosition.balance;
  const decimals = fhenixPosition.token.decimals;
  const symbol = fhenixPosition.token.symbol;
  const vaultName =
    fhenixPosition.vaultName || fhenixPosition.protocol || "Vault";

  const formattedBalance = (() => {
    try {
      return formatUnits(BigInt(balance || "0"), decimals);
    } catch {
      return "0";
    }
  })();

  const withdrawAmount = (() => {
    try {
      const bal = BigInt(balance || "0");
      const pct = BigInt(percentage);
      return formatUnits((bal * pct) / 100n, decimals);
    } catch {
      return "0";
    }
  })();

  if (step === "idle" || step === "ready") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Vault</span>
            <span className="text-xs font-semibold text-main">{vaultName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Balance</span>
            <span className="text-xs font-semibold text-main">
              {formattedBalance} {symbol}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted">Withdraw</span>
            <input
              type="range"
              min={1}
              max={100}
              value={percentage}
              onChange={(e) => setPercentage(Number.parseInt(e.target.value))}
              className="h-1 flex-1 cursor-pointer accent-brand"
            />
            <span className="text-xs font-semibold text-main">
              {percentage}%
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-surface-raised px-3 py-2">
            <span className="text-xs text-muted">Amount to withdraw</span>
            <span className="text-xs font-semibold text-main">
              {withdrawAmount} {symbol}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            if (!address) return;
            if (chainId !== fhenixPosition.chainId) {
              await switchChainAsync({ chainId: fhenixPosition.chainId });
            }
            await executeWithdraw(config, address);
          }}
          disabled={!balance || balance === "0"}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiArrowDown className="h-4 w-4" />
          Withdraw
        </button>

        <p className="text-center text-[10px] text-faint">
          Non-custodial. Withdraws vault shares and decrypts via CoFHE.
        </p>
      </div>
    );
  }

  if (step === "withdrawing") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <FiLoader className="h-6 w-6 animate-spin text-brand" />
        <p className="text-sm font-semibold text-main">
          Withdrawing from vault...
        </p>
        <p className="text-xs text-muted">Please confirm in your wallet</p>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)]">
          <FiCheck className="h-6 w-6 text-[#10B981]" />
        </div>
        <p className="text-sm font-semibold text-main">
          Withdrawal successful!
        </p>
        <p className="text-xs text-muted">
          {withdrawAmount} {symbol} has been sent to your wallet
        </p>
        {txHash && (
          <p className="text-xs text-brand">Tx: {txHash.slice(0, 10)}...</p>
        )}
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-sm font-semibold text-main">Withdrawal failed</p>
        <p className="text-xs text-negative">{error}</p>
        <button
          type="button"
          onClick={() => setStep("idle")}
          className="cursor-pointer rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return <LoadingState />;
}
