"use client";

import "@rainbow-me/rainbowkit/styles.css";

import {
  darkTheme,
  lightTheme,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { type Config, WagmiProvider } from "wagmi";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { createWagmiConfig } from "@/lib/wagmi";
import { WalletReadyContext } from "@/lib/wallet-ready";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <WagmiAndWalletProviders>{children}</WagmiAndWalletProviders>
    </ThemeProvider>
  );
}

function WagmiAndWalletProviders({ children }: ProvidersProps) {
  const [config, setConfig] = useState<Config | null>(null);
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/wallet-config", {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("wallet_config_fetch_failed");
        return response.json() as Promise<{ projectId?: string }>;
      })
      .then((data) => {
        if (!data?.projectId) return;
        setConfig(createWagmiConfig(data.projectId));
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  if (!config) {
    return (
      <WalletReadyContext.Provider value={false}>
        {children}
      </WalletReadyContext.Provider>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitWithTheme>{children}</RainbowKitWithTheme>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function RainbowKitWithTheme({ children }: ProvidersProps) {
  const { theme } = useTheme();
  const rainbowTheme = useMemo(() => {
    const opts = {
      accentColor: "#1e40af",
      accentColorForeground: "#ffffff",
      borderRadius: "large" as const,
      fontStack: "system" as const,
      overlayBlur: "small" as const,
    };
    return theme === "light" ? lightTheme(opts) : darkTheme(opts);
  }, [theme]);

  return (
    <RainbowKitProvider modalSize="compact" theme={rainbowTheme}>
      <WalletReadyContext.Provider value={true}>
        {children}
      </WalletReadyContext.Provider>
    </RainbowKitProvider>
  );
}
