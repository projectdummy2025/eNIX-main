import { getBalance, multicall } from "@wagmi/core";
import { formatUnits } from "viem";
import type { Config } from "wagmi";
import type { LifiChainMeta, LifiTokenMeta } from "@/lib/lifi-meta";
import {
  fetchPortfolioViaProxy,
  type LifiPortfolioPosition,
} from "@/lib/lifi-portfolio";
import { getTrackedVaults } from "@/lib/tracked-vaults";

const NATIVE_PLACEHOLDERS = new Set([
  "0x0000000000000000000000000000000000000000",
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
]);

const TRACKED_SYMBOLS = new Set([
  "USDC",
  "USDT",
  "DAI",
  "WETH",
  "WBTC",
  "USDC.E",
]);

const BALANCE_OF_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

const DECIMALS_ABI = [
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
] as const;

export type PortfolioHolding = {
  chainId: number;
  chainName: string;
  chainLogo?: string;
  tokenAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  priceUsd: number;
  balance: bigint;
  amount: number;
  valueUsd: number;
  isNative: boolean;
};

export type PortfolioSnapshot = {
  holdings: PortfolioHolding[];
  positions: LifiPortfolioPosition[];
  totalValueUsd: number;
  totalHoldingsUsd: number;
  totalPositionsUsd: number;
};

type MetaInput = {
  chainsById: Record<number, LifiChainMeta>;
  tokensByChain: Record<number, LifiTokenMeta[]>;
};

function toAmount(balance: bigint, decimals: number): number {
  if (balance === 0n) return 0;
  const divisor = 10 ** decimals;
  return Number(balance) / divisor;
}

function toPrice(raw?: string | number | null): number {
  if (raw === undefined || raw === null) return 0;
  const value = typeof raw === "string" ? Number.parseFloat(raw) : raw;
  return Number.isFinite(value) ? value : 0;
}

async function loadChainHoldings(
  config: Config,
  address: `0x${string}`,
  chain: LifiChainMeta,
  tokens: LifiTokenMeta[],
): Promise<PortfolioHolding[]> {
  const holdings: PortfolioHolding[] = [];

  const nativeToken = tokens.find((token) =>
    NATIVE_PLACEHOLDERS.has(token.address.toLowerCase()),
  );

  try {
    const native = await getBalance(config, {
      address,
      chainId: chain.id,
    });
    if (native.value > 0n) {
      const priceUsd = toPrice(nativeToken?.priceUSD);
      const decimals = nativeToken?.decimals ?? native.decimals;
      const amount = Number(formatUnits(native.value, decimals));
      holdings.push({
        chainId: chain.id,
        chainName: chain.name,
        chainLogo: chain.logoURI,
        tokenAddress: nativeToken?.address ?? "native",
        symbol: nativeToken?.symbol ?? native.symbol,
        name: nativeToken?.name ?? native.symbol,
        decimals: nativeToken?.decimals ?? native.decimals,
        logoURI: nativeToken?.logoURI,
        priceUsd,
        balance: native.value,
        amount,
        valueUsd: amount * priceUsd,
        isNative: true,
      });
    }
  } catch {}

  const tracked = tokens.filter((token) => {
    if (NATIVE_PLACEHOLDERS.has(token.address.toLowerCase())) return false;
    return TRACKED_SYMBOLS.has(token.symbol.toUpperCase());
  });

  if (tracked.length === 0) {
    return holdings;
  }

  try {
    const results = await multicall(config, {
      chainId: chain.id,
      allowFailure: true,
      contracts: tracked.map((token) => ({
        address: token.address as `0x${string}`,
        abi: BALANCE_OF_ABI,
        functionName: "balanceOf",
        args: [address],
      })),
    });

    tracked.forEach((token, index) => {
      const result = results[index];
      if (!result || result.status !== "success") return;
      const value = result.result as bigint;
      if (value === 0n) return;
      const amount = toAmount(value, token.decimals);
      const priceUsd = toPrice(token.priceUSD);
      holdings.push({
        chainId: chain.id,
        chainName: chain.name,
        chainLogo: chain.logoURI,
        tokenAddress: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoURI: token.logoURI,
        priceUsd,
        balance: value,
        amount,
        valueUsd: amount * priceUsd,
        isNative: false,
      });
    });
  } catch {}

  return holdings;
}

export async function loadPortfolioSnapshot({
  config,
  address,
  meta,
}: {
  config: Config;
  address: `0x${string}`;
  meta: MetaInput;
}): Promise<PortfolioSnapshot> {
  const chains = Object.values(meta.chainsById).filter((chain) =>
    Boolean(meta.tokensByChain[chain.id]?.length),
  );

  const chainResults = await Promise.all(
    chains.map((chain) =>
      loadChainHoldings(
        config,
        address,
        chain,
        meta.tokensByChain[chain.id] ?? [],
      ).catch(() => [] as PortfolioHolding[]),
    ),
  );

  let positions: LifiPortfolioPosition[] = [];
  try {
    const portfolio = await fetchPortfolioViaProxy(address);
    positions = portfolio.data ?? [];
  } catch {
    positions = [];
  }

  const onChainPositions = await loadTrackedVaultPositions(
    config,
    address,
    meta.tokensByChain,
  );
  if (onChainPositions.length > 0) {
    const lifiKeys = new Set(
      positions.map((p) => `${p.chainId}-${p.protocolName}`),
    );
    for (const op of onChainPositions) {
      const key = `${op.chainId}-${op.protocolName}`;
      if (!lifiKeys.has(key)) {
        positions.push(op);
      }
    }
  }

  const holdings = chainResults.flat().sort((a, b) => b.valueUsd - a.valueUsd);

  const totalHoldingsUsd = holdings.reduce(
    (sum, holding) => sum + holding.valueUsd,
    0,
  );
  const totalPositionsUsd = positions.reduce((sum, position) => {
    const value = Number.parseFloat(position.balanceUsd ?? "0");
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

  return {
    holdings,
    positions,
    totalValueUsd: totalHoldingsUsd + totalPositionsUsd,
    totalHoldingsUsd,
    totalPositionsUsd,
  };
}

async function loadTrackedVaultPositions(
  config: Config,
  address: `0x${string}`,
  tokensByChain: Record<number, LifiTokenMeta[]>,
): Promise<LifiPortfolioPosition[]> {
  const tracked = getTrackedVaults();
  if (tracked.length === 0) return [];

  function priceForSymbol(chainId: number, symbol: string): number {
    const list = tokensByChain[chainId];
    if (!list) return 0;
    const upper = symbol.toUpperCase();
    const match = list.find((t) => t.symbol?.toUpperCase() === upper);
    return toPrice(match?.priceUSD);
  }

  const byChain = new Map<number, typeof tracked>();
  for (const vault of tracked) {
    const list = byChain.get(vault.chainId) ?? [];
    list.push(vault);
    byChain.set(vault.chainId, list);
  }

  const results: LifiPortfolioPosition[] = [];

  for (const [chainId, vaults] of byChain) {
    try {
      const contracts = vaults.flatMap((v) => [
        {
          address: v.vaultAddress as `0x${string}`,
          abi: BALANCE_OF_ABI,
          functionName: "balanceOf" as const,
          args: [address],
        },
        {
          address: v.vaultAddress as `0x${string}`,
          abi: DECIMALS_ABI,
          functionName: "decimals" as const,
        },
      ]);

      const raw = await multicall(config, {
        chainId,
        allowFailure: true,
        contracts,
      });

      vaults.forEach((vault, index) => {
        const balResult = raw[index * 2];
        const decResult = raw[index * 2 + 1];
        if (!balResult || balResult.status !== "success") return;
        if (!decResult || decResult.status !== "success") return;

        const balance = balResult.result as bigint;
        if (balance === 0n) return;

        const decimals = Number(decResult.result);
        const amount = Number(formatUnits(balance, decimals));

        const priceUsd = priceForSymbol(vault.chainId, vault.tokenSymbol);

        results.push({
          chainId: vault.chainId,
          protocolName: vault.protocolName,
          asset: {
            address: vault.vaultAddress,
            name: vault.vaultName,
            symbol: vault.tokenSymbol,
            decimals,
          },
          balanceNative: amount.toFixed(Math.min(decimals, 8)),
          balanceUsd: (amount * priceUsd).toFixed(6),
        });
      });
    } catch {}
  }

  return results;
}
