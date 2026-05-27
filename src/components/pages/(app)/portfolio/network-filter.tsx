"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiGlobe } from "react-icons/fi";
import type { LifiChainMeta } from "@/lib/lifi-meta";
import { usePortfolioStore } from "@/stores";

export function NetworkFilter({
  chainsById,
}: {
  chainsById: Record<number, LifiChainMeta>;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const networkFilter = usePortfolioStore((state) => state.networkFilter);
  const setNetworkFilter = usePortfolioStore((state) => state.setNetworkFilter);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  const activeChain =
    networkFilter === "all" ? null : chainsById[networkFilter];
  const chains = Object.values(chainsById).sort((a, b) => {
    const aIsArbitrum = a.name.toLowerCase().includes("arbitrum");
    const bIsArbitrum = b.name.toLowerCase().includes("arbitrum");
    if (aIsArbitrum && !bIsArbitrum) return -1;
    if (!aIsArbitrum && bIsArbitrum) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full bg-surface-raised border border-main px-4 py-2 text-xs font-semibold text-main cursor-pointer transition-colors hover:border-strong"
      >
        {activeChain?.logoURI ? (
          <Image
            src={activeChain.logoURI}
            alt={activeChain.name}
            width={16}
            height={16}
            className="h-4 w-4 rounded-full"
            unoptimized
          />
        ) : (
          <FiGlobe className="h-4 w-4 text-[#60a5fa]" />
        )}
        <span className="tracking-tight">
          {activeChain ? activeChain.name : "All networks"}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }}>
          <FiChevronDown className="h-4 w-4 text-muted" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 z-20 mt-2 max-h-[320px] w-56 origin-top-right overflow-y-auto rounded-2xl border border-main bg-surface-raised"
          >
            <button
              type="button"
              onClick={() => {
                setNetworkFilter("all");
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-surface-muted"
            >
              <FiGlobe className="h-5 w-5 text-[#60a5fa]" />
              <span className="flex-1 text-sm font-semibold text-main">
                All networks
              </span>
              {networkFilter === "all" ? (
                <span className="h-2 w-2 rounded-full bg-brand" />
              ) : null}
            </button>
            <div className="h-px bg-[var(--color-line)]" />
            {chains.map((chain) => {
              const isActive = networkFilter === chain.id;
              return (
                <button
                  key={chain.id}
                  type="button"
                  onClick={() => {
                    setNetworkFilter(chain.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-surface-muted"
                >
                  {chain.logoURI ? (
                    <Image
                      src={chain.logoURI}
                      alt={chain.name}
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded-full"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-[10px] font-semibold text-main">
                      {chain.name.charAt(0)}
                    </span>
                  )}
                  <span className="flex-1 text-sm font-semibold text-main">
                    {chain.name}
                  </span>
                  {isActive ? (
                    <span className="h-2 w-2 rounded-full bg-brand" />
                  ) : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
