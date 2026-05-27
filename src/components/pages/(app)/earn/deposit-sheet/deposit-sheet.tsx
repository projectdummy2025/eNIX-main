"use client";

import { AnimatePresence, motion } from "motion/react";
import { FiX } from "react-icons/fi";
import { useAccount } from "wagmi";
import { useWalletReady } from "@/lib/wallet-ready";
import { useDepositStore } from "@/stores";
import { ActiveFlow } from "./active-flow";
import { ConnectPrompt, LoadingState } from "./deposit-sheet-states";

export function DepositSheet() {
  const open = useDepositStore((state) => state.open);
  const closeSheet = useDepositStore((state) => state.closeSheet);
  const ready = useWalletReady();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeSheet}
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
            {ready ? <DepositBody /> : <LoadingState />}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function DepositBody() {
  const closeSheet = useDepositStore((state) => state.closeSheet);
  const vault = useDepositStore((state) => state.vault);
  const token = useDepositStore((state) => state.token);
  const chain = useDepositStore((state) => state.chain);

  if (!vault || !token || !chain) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <SheetHeader onClose={closeSheet} />
      <div className="px-5 pb-5 pt-4">
        <ConnectionGate />
      </div>
    </div>
  );
}

function SheetHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-main px-5 py-4">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
          Review
        </div>
        <h3 className="text-base font-semibold text-main">
          Confirm your deposit
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

function ConnectionGate() {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return <ConnectPrompt />;
  }

  return <ActiveFlow walletAddress={address} />;
}
