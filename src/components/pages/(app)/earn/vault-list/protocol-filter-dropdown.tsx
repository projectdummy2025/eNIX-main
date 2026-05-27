"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";

export type ProtocolOption = {
  key: string;
  label: string;
  logo?: string;
  count: number;
};

export function ProtocolFilterDropdown({
  active,
  options,
  onSelect,
}: {
  active: ProtocolOption | null;
  options: ProtocolOption[];
  onSelect: (key: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
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

  const total = options.reduce((sum, option) => sum + option.count, 0);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 rounded-full bg-surface-raised px-3 py-1.5 text-xs font-semibold text-main cursor-pointer transition-colors hover:bg-surface-muted"
      >
        {active?.logo ? (
          <Image
            src={active.logo}
            alt={active.label}
            width={14}
            height={14}
            className="h-3.5 w-3.5 rounded-full object-contain"
            unoptimized
          />
        ) : null}
        <span className="max-w-28 truncate">
          {active ? active.label : "Protocol"}
        </span>
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
            className="absolute right-0 top-[calc(100%+6px)] z-20 flex max-h-64 w-56 flex-col overflow-y-auto rounded-2xl border border-main bg-surface-raised p-1"
          >
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                setOpen(false);
              }}
              className={
                !active
                  ? "flex items-center justify-between gap-2 rounded-xl bg-surface-muted px-3 py-2 text-left text-xs font-semibold text-main cursor-pointer"
                  : "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-muted cursor-pointer hover:bg-surface-muted hover:text-main"
              }
            >
              <span>All protocols</span>
              <span className="text-[10px] text-faint">{total}</span>
            </button>
            {options.map((option) => {
              const isActive = active?.key === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    onSelect(option.key);
                    setOpen(false);
                  }}
                  className={
                    isActive
                      ? "flex items-center justify-between gap-2 rounded-xl bg-surface-muted px-3 py-2 text-left text-xs font-semibold text-main cursor-pointer"
                      : "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-muted cursor-pointer hover:bg-surface-muted hover:text-main"
                  }
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {option.logo ? (
                      <Image
                        src={option.logo}
                        alt={option.label}
                        width={16}
                        height={16}
                        className="h-4 w-4 shrink-0 rounded-full object-contain"
                        unoptimized
                      />
                    ) : null}
                    <span className="truncate">{option.label}</span>
                  </span>
                  <span className="text-[10px] text-faint">{option.count}</span>
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
