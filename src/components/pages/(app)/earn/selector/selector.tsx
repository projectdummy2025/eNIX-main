"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiSearch } from "react-icons/fi";
import type { SelectorProps } from "./option-icon";
import { OptionIcon } from "./option-icon";

const MAX_VISIBLE = 50;

export function Selector({
  label,
  value,
  options,
  onSelect,
  variant = "pill",
  emptyLabel,
  loading = false,
  locked = false,
}: SelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const showSearch = options.length > 6;

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }
    function handleClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  const active =
    options.find((item) => item.key === value) ?? options[0] ?? null;

  const filtered = useMemo(() => {
    const base = search.trim()
      ? options.filter((o) => {
          const q = search.toLowerCase();
          return (
            o.label.toLowerCase().includes(q) ||
            o.hint?.toLowerCase().includes(q)
          );
        })
      : options;
    return base.slice(0, MAX_VISIBLE);
  }, [options, search]);

  const triggerClass =
    variant === "chip"
      ? "flex items-center gap-2 rounded-full bg-surface-muted border border-main px-3 py-1.5 text-sm font-semibold text-main cursor-pointer transition-colors duration-200 ease-in-out hover:border-strong"
      : "flex items-center gap-2 rounded-full bg-surface-raised border border-main px-3 py-2 text-sm font-semibold text-main cursor-pointer transition-colors duration-200 ease-in-out hover:border-strong";

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        type="button"
        aria-label={label}
        disabled={options.length === 0 || loading || locked}
        onClick={() => {
          if (locked) return;
          setOpen((prev) => !prev);
        }}
        className={`${triggerClass} ${locked ? "cursor-default" : "disabled:cursor-not-allowed"}`}
        whileHover={
          options.length > 0 && !loading && !locked
            ? { scale: 1.03 }
            : undefined
        }
        whileTap={
          options.length > 0 && !loading && !locked
            ? { scale: 0.96 }
            : undefined
        }
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {loading && !active ? (
          <>
            <span
              className="animate-pulse rounded-full bg-surface-muted"
              style={{ width: 24, height: 24 }}
            />
            <span className="animate-pulse h-3 w-14 rounded-full bg-surface-muted" />
          </>
        ) : active ? (
          <>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={active.key}
                initial={{ opacity: 0, scale: 0.6, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6, rotate: 45 }}
                transition={{ type: "spring", stiffness: 480, damping: 28 }}
                className="flex"
              >
                <OptionIcon option={active} size={24} />
              </motion.span>
            </AnimatePresence>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={`label-${active.key}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="tracking-tight"
              >
                {active.label}
              </motion.span>
            </AnimatePresence>
          </>
        ) : (
          <span className="tracking-tight text-muted">{emptyLabel ?? "—"}</span>
        )}
        {locked ? null : (
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            className="flex"
          >
            <FiChevronDown className="h-4 w-4 text-muted" />
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && !locked ? (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute right-0 z-20 mt-2 w-60 origin-top-right overflow-hidden rounded-2xl border border-main bg-surface-raised"
            style={{ willChange: "transform, opacity" }}
          >
            {showSearch ? (
              <div className="flex items-center gap-2 border-b border-main px-4 py-2.5">
                <FiSearch className="h-3.5 w-3.5 text-faint" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="min-w-0 flex-1 bg-transparent text-xs text-main outline-none placeholder:text-faint"
                  autoFocus
                />
              </div>
            ) : null}
            <ul className="max-h-72 divide-y divide-(--color-line) overflow-y-auto">
              {filtered.map((option) => {
                const isActive = option.key === active?.key;
                return (
                  <li key={option.key}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(option.key);
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-left cursor-pointer transition-colors duration-100 hover:bg-surface-muted"
                    >
                      <span className="flex items-center gap-3">
                        <OptionIcon option={option} size={28} />
                        <span className="flex flex-col">
                          <span className="text-sm font-semibold text-main">
                            {option.label}
                          </span>
                          {option.hint ? (
                            <span className="text-xs text-muted">
                              {option.hint}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      {isActive ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-white">
                          <FiCheck className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
