"use client";

import { AnimatePresence, motion } from "motion/react";
import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "@/lib/theme-context";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-glass bg-glass text-main transition-colors hover:border-strong ${className}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
          className="flex"
        >
          {isDark ? (
            <FiMoon className="h-4 w-4" />
          ) : (
            <FiSun className="h-4 w-4" />
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
