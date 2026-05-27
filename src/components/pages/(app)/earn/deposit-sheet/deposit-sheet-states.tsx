"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FiCheck, FiLoader, FiZap } from "react-icons/fi";
import type { DepositStep } from "@/stores";

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-10">
      <FiLoader className="h-6 w-6 animate-spin text-muted" />
      <p className="text-sm text-muted">Loading wallet&hellip;</p>
    </div>
  );
}

export function ConnectPrompt() {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
        <FiZap className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-main">Connect your wallet</p>
        <p className="mx-auto mt-1 max-w-xs text-xs text-muted">
          You&apos;ll need a connected wallet to review and sign the deposit
          transaction on-chain.
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

export function StepIndicator({
  step,
  isCrossChain,
}: {
  step: DepositStep;
  isCrossChain: boolean;
}) {
  const steps: { key: string; label: string }[] = [
    { key: "review", label: "Review" },
    { key: "approve", label: "Approve" },
    { key: "deposit", label: isCrossChain ? "Bridge & deposit" : "Deposit" },
  ];

  let activeIdx = 0;
  if (step === "ready" || step === "idle" || step === "quoting") activeIdx = 0;
  else if (step === "approving") activeIdx = 1;
  else if (step === "depositing") activeIdx = 2;

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-surface-raised/60 px-3 py-2">
      {steps.map((item, index) => {
        const isActive = index === activeIdx;
        const isDone = index < activeIdx;
        return (
          <div key={item.key} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                isDone
                  ? "bg-brand text-white"
                  : isActive
                    ? "bg-brand-soft text-brand"
                    : "bg-surface-muted text-faint"
              }`}
            >
              {isDone ? <FiCheck className="h-3 w-3" /> : index + 1}
            </div>
            <span
              className={`truncate text-[11px] font-medium ${
                isActive || isDone ? "text-main" : "text-faint"
              }`}
            >
              {item.label}
            </span>
            {index < steps.length - 1 ? (
              <div
                className={`h-px flex-1 ${isDone ? "bg-brand/40" : "bg-surface-muted"}`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function Row({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-xs">
      <span className="text-muted">{label}</span>
      <span className="flex flex-col items-end">
        <span className="font-medium text-main">{value}</span>
        {sub ? <span className="text-[10px] text-faint">{sub}</span> : null}
      </span>
    </div>
  );
}
