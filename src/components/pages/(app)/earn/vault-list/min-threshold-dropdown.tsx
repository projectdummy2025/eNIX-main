"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

export type ThresholdPreset = { label: string; value: number };

function formatThreshold(
  value: number | null,
  kind: "apy" | "tvl",
): string | null {
  if (value === null) return null;
  if (kind === "apy") return `${value}%`;
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(0)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

function parseCustomThreshold(raw: string, kind: "apy" | "tvl"): number | null {
  const cleaned = raw.trim().replace(/[>$%,\s]/g, "");
  if (!cleaned) return null;
  const match = cleaned.match(/^([0-9]*\.?[0-9]+)([kmb])?$/i);
  if (!match) return null;
  let amount = Number.parseFloat(match[1]);
  const suffix = match[2]?.toLowerCase();
  if (kind === "tvl") {
    if (suffix === "k") amount *= 1_000;
    else if (suffix === "m") amount *= 1_000_000;
    else if (suffix === "b") amount *= 1_000_000_000;
  }
  if (!Number.isFinite(amount) || amount < 0) return null;
  return amount;
}

export const APY_PRESETS: ThresholdPreset[] = [
  { label: ">3%", value: 3 },
  { label: ">5%", value: 5 },
  { label: ">10%", value: 10 },
  { label: ">20%", value: 20 },
];

export const TVL_PRESETS: ThresholdPreset[] = [
  { label: ">$100K", value: 100_000 },
  { label: ">$1M", value: 1_000_000 },
  { label: ">$10M", value: 10_000_000 },
  { label: ">$100M", value: 100_000_000 },
];

export function MinThresholdDropdown({
  label,
  kind,
  presets,
  placeholder,
  active,
  onSelect,
}: {
  label: string;
  kind: "apy" | "tvl";
  presets: ThresholdPreset[];
  placeholder: string;
  active: number | null;
  onSelect: (value: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const activeLabel = formatThreshold(active, kind);

  function handleCustomSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseCustomThreshold(customValue, kind);
    if (parsed === null) return;
    onSelect(parsed);
    setCustomValue("");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 rounded-full bg-surface-raised px-3 py-1.5 text-xs font-semibold text-main cursor-pointer transition-colors hover:bg-surface-muted"
      >
        <span className="text-[10px] font-medium uppercase tracking-wide text-faint">
          {label}
        </span>
        <span>{activeLabel ? `>${activeLabel}` : "Any"}</span>
        <FiChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-[calc(100%+6px)] z-20 flex w-52 flex-col gap-1 overflow-hidden rounded-2xl border border-main bg-surface-raised p-2"
          >
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                setOpen(false);
              }}
              className={
                active === null
                  ? "flex items-center justify-between gap-2 rounded-xl bg-surface-muted px-3 py-2 text-left text-xs font-semibold text-main cursor-pointer"
                  : "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-muted cursor-pointer hover:bg-surface-muted hover:text-main"
              }
            >
              <span>Any {label.toLowerCase()}</span>
              {active === null ? <FiCheck className="h-3 w-3" /> : null}
            </button>
            {presets.map((preset) => {
              const isActive = active === preset.value;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onSelect(preset.value);
                    setOpen(false);
                  }}
                  className={
                    isActive
                      ? "flex items-center justify-between gap-2 rounded-xl bg-surface-muted px-3 py-2 text-left text-xs font-semibold text-main cursor-pointer"
                      : "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-muted cursor-pointer hover:bg-surface-muted hover:text-main"
                  }
                >
                  <span>{preset.label}</span>
                  {isActive ? <FiCheck className="h-3 w-3" /> : null}
                </button>
              );
            })}
            <form
              onSubmit={handleCustomSubmit}
              className="mt-1 flex items-center gap-1 rounded-xl border border-main bg-surface px-2 py-1.5"
            >
              <span className="text-[11px] font-semibold text-faint">&gt;</span>
              <input
                type="text"
                value={customValue}
                onChange={(event) => setCustomValue(event.target.value)}
                placeholder={placeholder}
                className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-main outline-none placeholder:text-faint"
              />
              <button
                type="submit"
                className="rounded-md bg-brand px-2 py-0.5 text-[10px] font-semibold text-white cursor-pointer hover-brand"
              >
                Apply
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
