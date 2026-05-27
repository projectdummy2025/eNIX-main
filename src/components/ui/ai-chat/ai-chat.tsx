"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { FiMessageCircle, FiSend, FiTrash2, FiX } from "react-icons/fi";
import { useAIChatStore } from "./ai-chat-store";

function TypingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-muted"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

export function AIChatButton() {
  const { open, toggle, messages } = useAIChatStore();
  const hasMessages = messages.length > 0;

  return (
    <motion.button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-colors hover-brand"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={open ? "Close AI chat" : "Open AI chat"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.span
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <FiX className="h-6 w-6" />
          </motion.span>
        ) : (
          <motion.span
            key="open"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative"
          >
            <FiMessageCircle className="h-6 w-6" />
            {!hasMessages && (
              <motion.span
                className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-canvas bg-positive"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function AIChatSheet() {
  const { open, close, messages, loading, send, clear } = useAIChatStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = inputRef.current;
    if (!input || !input.value.trim() || loading) return;
    const text = input.value.trim();
    input.value = "";
    await send(text);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="chat-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-end sm:justify-end sm:p-6"
          onClick={close}
        >
          <motion.div
            key="chat-sheet"
            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-[min(600px,85dvh)] w-full max-w-[420px] flex-col overflow-hidden rounded-t-3xl border border-main bg-surface shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-main px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft">
                  <FiMessageCircle className="h-4.5 w-4.5 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-main">
                    AI Assistant
                  </p>
                  <p className="text-xs text-faint">Powered by ChainGPT</p>
                </div>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={clear}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-faint transition-colors hover:bg-surface-raised hover:text-negative"
                  aria-label="Clear chat"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft">
                    <FiMessageCircle className="h-6 w-6 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-main">
                      AI Vault Assistant
                    </p>
                    <p className="mt-1 text-xs text-faint leading-relaxed">
                      Ask about confidential vaults, DeFi strategies, smart
                      contract auditing, or yield optimization.
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {[
                      "What is Fhenix CoFHE?",
                      "Best yield strategy?",
                      "Audit my contract",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          inputRef.current!.value = suggestion;
                          inputRef.current?.focus();
                        }}
                        className="rounded-full border border-main px-3 py-1.5 text-xs text-muted transition-colors hover:border-brand hover:text-brand"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-3 flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-br-md bg-brand text-white"
                        : "rounded-bl-md bg-surface-raised text-main"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 flex justify-start"
                >
                  <div className="rounded-2xl rounded-bl-md bg-surface-raised px-4 py-3">
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-main px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about confidential DeFi..."
                  disabled={loading}
                  className="flex-1 rounded-full border border-main bg-surface-raised px-4 py-2.5 text-sm text-main placeholder:text-faint outline-none transition-colors focus:border-brand disabled:opacity-50"
                />
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-opacity disabled:opacity-50"
                  whileTap={{ scale: 0.9 }}
                >
                  <FiSend className="h-4 w-4" />
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
