"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "motion/react";
import {
  FiAlertTriangle,
  FiCheck,
  FiExternalLink,
  FiLoader,
} from "react-icons/fi";
import { HiOutlineWallet } from "react-icons/hi2";

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-10">
      <FiLoader className="h-6 w-6 animate-spin text-muted" />
      <p className="text-sm text-muted">Loading wallet…</p>
    </div>
  );
}

export function ConnectPrompt() {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
        <HiOutlineWallet className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-main">Connect your wallet</p>
        <p className="mx-auto mt-1 max-w-xs text-xs text-muted">
          You&apos;ll need a connected wallet to sign the withdrawal transaction
          on-chain.
        </p>
      </div>
      <ConnectButton.Custom>
        {({ openConnectModal, mounted }) => (
          <button
            type="button"
            disabled={!mounted}
            onClick={openConnectModal}
            className="cursor-pointer rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover-brand disabled:opacity-60"
          >
            Connect wallet
          </button>
        )}
      </ConnectButton.Custom>
    </div>
  );
}

export function QuotingState({
  symbol,
  protocolName,
}: {
  symbol: string;
  protocolName: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <FiLoader className="h-6 w-6 animate-spin text-brand" />
      <p className="text-sm font-semibold text-main">
        Preparing withdrawal route…
      </p>
      <p className="text-xs text-muted">
        Routing {symbol} out of {protocolName}
      </p>
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  onClose,
}: {
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <FiAlertTriangle className="h-6 w-6 text-(--color-negative)" />
      <p className="text-sm font-semibold text-main">
        Couldn&apos;t prepare this withdrawal
      </p>
      <p className="mx-auto max-w-xs text-xs text-muted">
        {error ??
          "Nox Protocol doesn't support an automated exit for this vault yet. Try the protocol's native UI."}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="cursor-pointer rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover-brand"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-full border border-main px-4 py-2 text-xs font-semibold text-muted transition-colors hover:text-main"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function SuccessState({
  txHash,
  onClose,
}: {
  txHash: string | null;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 18 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft"
      >
        <FiCheck className="h-7 w-7 text-brand" />
      </motion.div>
      <div>
        <p className="text-base font-semibold text-main">
          Withdrawal submitted
        </p>
        <p className="mx-auto mt-1 max-w-xs text-xs text-muted">
          Funds will land back in your wallet as soon as the transaction is
          confirmed on chain.
        </p>
      </div>
      {txHash ? (
        <a
          href={`https://sepolia.arbiscan.io/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand underline"
        >
          View on Arbiscan
          <FiExternalLink className="h-3 w-3" />
        </a>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        className="mt-2 cursor-pointer rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover-brand"
      >
        Done
      </button>
    </div>
  );
}
