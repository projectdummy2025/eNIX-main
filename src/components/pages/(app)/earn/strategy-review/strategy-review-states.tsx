"use client";

import { motion } from "motion/react";
import { FiInbox } from "react-icons/fi";

export function EmptyReview({ isLoading }: { isLoading: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl bg-surface-raised px-6 py-8 text-center"
    >
      <FiInbox className="h-5 w-5 text-muted" />
      <p className="text-xs font-semibold text-main">
        {isLoading
          ? "Fetching vault strategies\u2026"
          : "No vault selected yet"}
      </p>
      <p className="max-w-xs text-[11px] text-muted">
        Enter an amount and pick a route from the Vault Aggregator on the right
        to see full strategy details here.
      </p>
    </motion.div>
  );
}

export function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl bg-surface-raised px-3 py-2">
      <span className="text-[9px] uppercase tracking-wide text-faint">
        {label}
      </span>
      <span
        className={
          accent
            ? "text-sm font-semibold text-[#60a5fa]"
            : "text-[13px] font-semibold text-main"
        }
      >
        {value}
      </span>
    </div>
  );
}

export function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "warn";
}) {
  const base =
    tone === "warn"
      ? "bg-[rgba(250,43,57,0.12)] text-(--color-negative)"
      : "bg-surface-raised text-muted";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${base}`}
    >
      {children}
    </span>
  );
}
