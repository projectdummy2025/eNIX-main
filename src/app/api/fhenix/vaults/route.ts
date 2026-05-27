import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";
import type { FhenixVault } from "@/lib/fhenix-types";
import {
  FHENIX_CONTRACTS,
  FHENIX_VAULTS,
  FHENIX_YIELD_VAULT_ABI,
} from "@/lib/fhenix-types";

const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
});

function isZeroAddress(addr: string): boolean {
  return addr === "0x0000000000000000000000000000000000000000";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get("chainId");
  const sortBy = searchParams.get("sortBy") as "apy" | "tvl" | null;
  const limit = searchParams.get("limit");

  let vaults: FhenixVault[] = [];

  const entries: Array<{
    underlying: string;
    vault: string;
    symbol: string;
    name: string;
    underlyingPrice: string;
    underlyingLogo: string;
    underlyingDecimals: number;
    defaultApy: number;
    riskTier: "low" | "medium";
  }> = [
    {
      underlying: FHENIX_CONTRACTS.USDC,
      vault: FHENIX_VAULTS.USDC_VAULT,
      symbol: "USDC",
      name: "USD Coin",
      underlyingPrice: "1",
      underlyingLogo:
        "https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
      underlyingDecimals: 6,
      defaultApy: 5.7,
      riskTier: "low",
    },
    {
      underlying: FHENIX_CONTRACTS.RLC,
      vault: FHENIX_VAULTS.RLC_VAULT,
      symbol: "RLC",
      name: "RLC",
      underlyingPrice: "3.5",
      underlyingLogo: "/Assets/Images/Logo-Coin/rlc-logo.svg",
      underlyingDecimals: 9,
      defaultApy: 4.0,
      riskTier: "medium",
    },
  ];

  for (const entry of entries) {
    let tvlUsd = "0";
    let apy = entry.defaultApy;

    if (!isZeroAddress(entry.vault)) {
      try {
        const [totalAssets, , estimatedAPY] = await Promise.all([
          client.readContract({
            address: entry.vault as `0x${string}`,
            abi: FHENIX_YIELD_VAULT_ABI,
            functionName: "totalAssets",
          }),
          client.readContract({
            address: entry.vault as `0x${string}`,
            abi: FHENIX_YIELD_VAULT_ABI,
            functionName: "totalSupply",
          }),
          client.readContract({
            address: entry.vault as `0x${string}`,
            abi: FHENIX_YIELD_VAULT_ABI,
            functionName: "estimatedAPY",
          }),
        ]);

        const assets = totalAssets as bigint;
        const eApy = estimatedAPY as bigint;
        const price = Number.parseFloat(entry.underlyingPrice) || 0;
        tvlUsd = (
          (Number(assets) / 10 ** entry.underlyingDecimals) *
          price
        ).toFixed(2);

        if (eApy > 0n) {
          apy = Number(eApy) / 100;
        }
      } catch {
        apy = entry.defaultApy;
      }
    }

    vaults.push({
      address: entry.vault,
      chainId: 421614,
      name: `Confidential ${entry.symbol} Vault`,
      protocol: "Fhenix CoFHE",
      protocolLogo: entry.underlyingLogo,
      description: `Earn yield on confidential ${entry.symbol} deposits with FHE encryption. Balances and amounts are encrypted on-chain via CoFHE.`,
      underlyingToken: {
        address: entry.underlying,
        symbol: entry.symbol,
        name: entry.name,
        decimals: entry.underlyingDecimals,
        logoURI: entry.underlyingLogo,
        priceUSD: entry.underlyingPrice,
        isFhenix: false,
      },
      apy: {
        base: Math.floor(apy * 0.8),
        reward: +(apy * 0.2).toFixed(1),
        total: +apy.toFixed(1),
      },
      tvl: {
        usd: tvlUsd,
      },
      isFhenix: true,
      riskTier: entry.riskTier,
      timeLock: 0,
    });
  }

  if (chainId) {
    vaults = vaults.filter((v) => v.chainId === parseInt(chainId, 10));
  }

  if (sortBy === "apy") {
    vaults.sort((a, b) => b.apy.total - a.apy.total);
  } else if (sortBy === "tvl") {
    vaults.sort(
      (a, b) => Number.parseFloat(b.tvl.usd) - Number.parseFloat(a.tvl.usd),
    );
  }

  const limitNum = limit ? parseInt(limit, 10) : vaults.length;
  const vaultSlice = vaults.slice(0, limitNum);

  return NextResponse.json({
    data: vaultSlice,
    nextCursor: null,
    total: vaultSlice.length,
  });
}
