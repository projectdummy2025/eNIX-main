import { create } from "zustand";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

type AIChatStore = {
  open: boolean;
  messages: ChatMessage[];
  loading: boolean;
  toggle: () => void;
  close: () => void;
  send: (content: string) => Promise<void>;
  clear: () => void;
};

export const useAIChatStore = create<AIChatStore>((set, get) => ({
  open: false,
  messages: [],
  loading: false,

  toggle: () => set((s) => ({ open: !s.open })),
  close: () => set({ open: false }),

  send: async (content: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    set((s) => ({ messages: [...s.messages, userMsg], loading: true }));

    try {
      const res = await fetch("/api/chaingpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content }),
      });

      if (!res.ok) throw new Error(`Failed: ${res.status}`);

      const data = (await res.json()) as { text: string };
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.text ?? "No response.",
        timestamp: Date.now(),
      };

      set((s) => ({ messages: [...s.messages, assistantMsg], loading: false }));
    } catch {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I couldn't process your request. Please try again.",
        timestamp: Date.now(),
      };
      set((s) => ({ messages: [...s.messages, errorMsg], loading: false }));
    }
  },

  clear: () => set({ messages: [] }),
}));
