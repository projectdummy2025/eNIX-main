"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FiAlertTriangle } from "react-icons/fi";
import { HiOutlineWallet } from "react-icons/hi2";
import { useWalletReady } from "@/lib/wallet-ready";

type WalletButtonProps = {
  variant?: "desktop" | "mobile";
};

const DESKTOP_CLASS =
  "relative z-10 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors cursor-pointer hover-brand";

const MOBILE_CLASS =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-base font-semibold text-white transition-colors cursor-pointer hover-brand";

export function WalletButton({ variant = "desktop" }: WalletButtonProps) {
  const ready = useWalletReady();
  const base = variant === "mobile" ? MOBILE_CLASS : DESKTOP_CLASS;
  const iconSize = variant === "mobile" ? "h-5 w-5" : "h-4 w-4";

  if (!ready) {
    return (
      <button
        type="button"
        disabled
        aria-busy="true"
        className={`${base} cursor-wait opacity-70`}
      >
        <HiOutlineWallet className={iconSize} />
        Connect wallet
      </button>
    );
  }

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const connectReady = mounted && authenticationStatus !== "loading";
        const connected =
          connectReady &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        if (!connectReady) {
          return (
            <button
              type="button"
              disabled
              aria-busy="true"
              className={`${base} cursor-wait opacity-70`}
            >
              <HiOutlineWallet className={iconSize} />
              Connect wallet
            </button>
          );
        }

        if (!connected) {
          return (
            <button type="button" onClick={openConnectModal} className={base}>
              <HiOutlineWallet className={iconSize} />
              Connect wallet
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button type="button" onClick={openChainModal} className={base}>
              <FiAlertTriangle className={iconSize} />
              Wrong network
            </button>
          );
        }

        return (
          <button type="button" onClick={openAccountModal} className={base}>
            <HiOutlineWallet className={iconSize} />
            {account.displayName}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
