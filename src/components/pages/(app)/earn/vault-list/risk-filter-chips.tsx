"use client";

import type { VaultRiskFilter } from "@/stores";
import type { VaultRisk } from "@/types";

const RISK_FILTERS: { key: VaultRiskFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
];

export function RiskFilterChips({
  active,
  counts,
  onSelect,
}: {
  active: VaultRiskFilter;
  counts: Record<VaultRisk, number>;
  onSelect: (filter: VaultRiskFilter) => void;
}) {
  const total = counts.low + counts.medium + counts.high;
  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-raised p-1">
      {RISK_FILTERS.map((option) => {
        const isActive = option.key === active;
        const count =
          option.key === "all" ? total : (counts[option.key as VaultRisk] ?? 0);
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onSelect(option.key)}
            className={
              isActive
                ? "flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-[10px] font-semibold text-main cursor-pointer transition-colors"
                : "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium text-muted cursor-pointer transition-colors hover:text-main"
            }
          >
            {option.label}
            <span className="text-[9px] text-faint">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
