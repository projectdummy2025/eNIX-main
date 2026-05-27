"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { FiCheck, FiClock, FiCopy, FiExternalLink } from "react-icons/fi";
import { HiOutlineShieldCheck } from "react-icons/hi2";
import type { VaultStrategy } from "@/types";
import { Chip, Stat } from "./strategy-review-states";
import {
  explorerUrl,
  formatApy,
  formatTimelock,
  formatTvl,
  formatUsd,
  PREVIEW_PERIODS,
  RISK_LABEL,
  shortenAddress,
} from "./strategy-review-utils";

export function ActiveReview({
  vault,
  chainLogo,
  principalUsd,
  tokenLogo,
  tokenSymbol,
}: {
  vault: VaultStrategy;
  chainLogo?: string;
  principalUsd: number;
  tokenLogo: string | null;
  tokenSymbol: string;
}) {
  const [copied, setCopied] = useState(false);
  const explorerLink = explorerUrl(vault);
  const vaultLink = vault.protocolUrl ?? null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(vault.vaultAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="mt-3 flex flex-1 flex-col gap-3"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-surface-raised p-3">
        <div className="relative h-11 w-11 shrink-0">
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-sm font-semibold text-brand">
            {tokenLogo ? (
              <Image
                src={tokenLogo}
                alt={vault.tokenSymbol}
                width={44}
                height={44}
                className="h-full w-full object-contain"
                unoptimized
              />
            ) : (
              vault.tokenSymbol.charAt(0).toUpperCase()
            )}
          </span>
          {chainLogo ? (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center overflow-hidden rounded-full border-2 border-(--color-surface-2) bg-(--color-surface-2)">
              <Image
                src={chainLogo}
                alt={vault.chainShortName}
                width={12}
                height={12}
                className="h-full w-full object-contain"
                unoptimized
              />
            </span>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-main">
            {vault.vaultName}
          </span>
          <span className="truncate text-[11px] text-muted">
            {vault.tokenSymbol} &middot; {vault.chainShortName}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-faint">
            You will receive
            {tokenLogo ? (
              <Image
                src={tokenLogo}
                alt={vault.tokenSymbol}
                width={12}
                height={12}
                className="h-3 w-3 rounded-full object-contain"
                unoptimized
              />
            ) : null}
            <span className="font-semibold text-muted">{vault.vaultName}</span>
            as shares token
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {vaultLink ? (
            <a
              href={vaultLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open vault page"
              title="Open vault page"
              className="flex h-8 items-center justify-center gap-1 rounded-lg border border-main bg-surface px-2 text-[10px] font-semibold text-muted transition-colors hover:border-strong hover:text-main"
            >
              Vault
              <FiExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          {explorerLink ? (
            <a
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open contract in block explorer"
              title="Open contract in block explorer"
              className="flex h-8 items-center justify-center gap-1 rounded-lg border border-main bg-surface px-2 text-[10px] font-semibold text-muted transition-colors hover:border-strong hover:text-main"
            >
              Contract
              <FiExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="APY" value={formatApy(vault.apy)} accent />
        <Stat label="TVL" value={formatTvl(vault.tvlUsd)} />
        <Stat
          label="30d avg APY"
          value={vault.apy30d !== null ? formatApy(vault.apy30d) : "\u2014"}
        />
        <Stat label="Risk tier" value={RISK_LABEL[vault.risk]} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {vault.isTransactional ? (
          <Chip>
            <FiCheck className="h-2.5 w-2.5" />
            One-click deposit
          </Chip>
        ) : (
          <Chip tone="warn">View only</Chip>
        )}
        {vault.timeLock > 0 ? (
          <Chip>
            <FiClock className="h-2.5 w-2.5" />
            {formatTimelock(vault.timeLock)}
          </Chip>
        ) : null}
        {vault.kyc ? (
          <Chip>
            <HiOutlineShieldCheck className="h-2.5 w-2.5" />
            KYC
          </Chip>
        ) : null}
        {vault.tags.slice(0, 2).map((tag) => (
          <Chip key={tag}>{tag}</Chip>
        ))}
      </div>

      <div className="rounded-2xl bg-surface-raised p-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] tracking-wide text-faint">
            {tokenLogo ? (
              <Image
                src={tokenLogo}
                alt={tokenSymbol}
                width={14}
                height={14}
                className="h-3.5 w-3.5 rounded-full object-contain"
                unoptimized
              />
            ) : null}
            Your Estimated Balance
          </span>
          <span className="text-[10px] font-semibold text-[#60a5fa]">
            {formatApy(vault.apy)} APY
          </span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {PREVIEW_PERIODS.map((period) => {
            const yieldForPeriod =
              (principalUsd * (vault.apy / 100)) / period.divisor;
            const projected = principalUsd + yieldForPeriod;
            return (
              <div
                key={period.key}
                className="flex flex-col items-start gap-0.5 rounded-xl bg-surface-muted px-2 py-1.5"
              >
                <span className="text-[9px] font-semibold uppercase tracking-wide text-faint">
                  {period.label}
                </span>
                <span className="truncate text-[11px] font-semibold text-main">
                  {formatUsd(projected)}
                </span>
                <span className="truncate text-[9px] text-(--color-positive)">
                  +{formatUsd(yieldForPeriod)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
