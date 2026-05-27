"use client";

import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useConfig } from "wagmi";
import { useWalletReady } from "@/lib/wallet-ready";
import { useMetaStore, usePortfolioStore } from "@/stores";
import { ConnectPromptCard } from "./connect-prompt-card";
import { NetworkFilter } from "./network-filter";
import { PortfolioHeader } from "./portfolio-header";
import { PositionsSection } from "./positions-section";
import { TokensSection } from "./tokens-section";
import { TotalSummary } from "./total-summary";

const ShareCard = dynamic(
  () => import("./share-card").then((m) => m.ShareCard),
  { ssr: false },
);

const WithdrawSheet = dynamic(
  () => import("./withdraw-sheet").then((m) => m.WithdrawSheet),
  { ssr: false },
);

export function PortfolioView() {
  return (
    <>
      <main className="relative mx-auto flex w-full max-w-[1160px] flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <PortfolioBody />
      </main>
      <WithdrawSheet />
    </>
  );
}

function PortfolioBody() {
  const ready = useWalletReady();
  if (!ready) {
    return <PortfolioSkeletonShell />;
  }
  return <ConnectionGate />;
}

function ConnectionGate() {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return (
      <>
        <PortfolioHeader address={null} />
        <ConnectPromptCard />
      </>
    );
  }

  return <ConnectedPortfolio address={address} />;
}

function ConnectedPortfolio({ address }: { address: `0x${string}` }) {
  const [shareOpen, setShareOpen] = useState(false);
  const config = useConfig();
  const chainsById = useMetaStore((state) => state.chainsById);
  const tokensByChain = useMetaStore((state) => state.tokensByChain);
  const metaStatus = useMetaStore((state) => state.status);
  const loadMeta = useMetaStore((state) => state.loadMeta);

  const loadPortfolio = usePortfolioStore((state) => state.loadPortfolio);
  const lastFetchedAddress = usePortfolioStore(
    (state) => state.lastFetchedAddress,
  );
  const networkFilter = usePortfolioStore((state) => state.networkFilter);
  const holdings = usePortfolioStore((state) => state.holdings);
  const positions = usePortfolioStore((state) => state.positions);
  const status = usePortfolioStore((state) => state.status);
  const totalValueUsd = usePortfolioStore((state) => state.totalValueUsd);
  const totalHoldingsUsd = usePortfolioStore((state) => state.totalHoldingsUsd);
  const totalPositionsUsd = usePortfolioStore(
    (state) => state.totalPositionsUsd,
  );
  const pendingRefetch = usePortfolioStore((state) => state.pendingRefetch);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (metaStatus !== "ready") return;
    if (!address) return;
    if (lastFetchedAddress === address && status === "ready") return;
    loadPortfolio({
      config,
      address,
      meta: { chainsById, tokensByChain },
    });
  }, [
    metaStatus,
    address,
    lastFetchedAddress,
    status,
    config,
    chainsById,
    tokensByChain,
    loadPortfolio,
  ]);

  useEffect(() => {
    if (networkFilter === "all") return;
    if (metaStatus !== "ready" || !address) return;
    loadPortfolio({
      config,
      address,
      meta: { chainsById, tokensByChain },
    });
  }, [
    networkFilter,
    config,
    address,
    chainsById,
    tokensByChain,
    loadPortfolio,
    metaStatus,
  ]);

  useEffect(() => {
    if (!pendingRefetch || metaStatus !== "ready" || !address) return;
    const timer = setTimeout(() => {
      loadPortfolio({
        config,
        address,
        meta: { chainsById, tokensByChain },
      });
    }, 15_000);
    return () => clearTimeout(timer);
  }, [
    pendingRefetch,
    metaStatus,
    address,
    config,
    chainsById,
    tokensByChain,
    loadPortfolio,
  ]);

  const filteredHoldings = useMemo(() => {
    if (networkFilter === "all") return holdings;
    return holdings.filter((holding) => holding.chainId === networkFilter);
  }, [holdings, networkFilter]);

  const filteredPositions = useMemo(() => {
    if (networkFilter === "all") return positions;
    return positions.filter((position) => position.chainId === networkFilter);
  }, [positions, networkFilter]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PortfolioHeader
          address={address}
          right={<NetworkFilter chainsById={chainsById} />}
          onShareClick={() => setShareOpen(true)}
        />
      </motion.div>

      <div className="flex flex-col gap-6">
        <TotalSummary
          totalValueUsd={totalValueUsd}
          totalHoldingsUsd={totalHoldingsUsd}
          totalPositionsUsd={totalPositionsUsd}
          status={status}
        />
        <TokensSection
          holdings={filteredHoldings}
          status={status}
          networkFilter={networkFilter}
        />
        <PositionsSection
          positions={filteredPositions}
          status={status}
          networkFilter={networkFilter}
          chainsById={chainsById}
        />
      </div>

      <ShareCard
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        address={address}
        totalPositionsUsd={totalPositionsUsd}
        positions={filteredPositions}
        chainsById={chainsById}
      />
    </>
  );
}

function PortfolioSkeletonShell() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-40 animate-pulse rounded-3xl bg-surface" />
      <div className="h-64 animate-pulse rounded-3xl bg-surface" />
      <div className="h-56 animate-pulse rounded-3xl bg-surface" />
    </div>
  );
}
