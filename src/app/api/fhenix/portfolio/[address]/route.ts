import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";
import type { FhenixPortfolio } from "@/lib/fhenix-types";
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;

  if (!address || address === "undefined" || address === "null") {
    return NextResponse.json({ data: [], total: 0 });
  }

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address);
  if (!isValidAddress) {
    return NextResponse.json({ data: [], total: 0 });
  }

  const userAddress = address as `0x${string}`;
  const portfolio: FhenixPortfolio[] = [];

  const vaultEntries: Array<{
    vault: string;
    symbol: string;
    name: string;
    underlyingPrice: string;
    decimals: number;
  }> = [
    {
      vault: FHENIX_VAULTS.USDC_VAULT,
      symbol: "USDC",
      name: "Confidential USDC Vault",
      underlyingPrice: "1",
      decimals: 6,
    },
    {
      vault: FHENIX_VAULTS.RLC_VAULT,
      symbol: "RLC",
      name: "Confidential RLC Vault",
      underlyingPrice: "3.5",
      decimals: 9,
    },
  ];

  for (const entry of vaultEntries) {
    if (isZeroAddress(entry.vault)) continue;

    try {
      const [shareBalance, totalSupply, totalAssets] = await Promise.all([
        client.readContract({
          address: entry.vault as `0x${string}`,
          abi: FHENIX_YIELD_VAULT_ABI,
          functionName: "balanceOf",
          args: [userAddress],
        }),
        client.readContract({
          address: entry.vault as `0x${string}`,
          abi: FHENIX_YIELD_VAULT_ABI,
          functionName: "totalSupply",
        }),
        client.readContract({
          address: entry.vault as `0x${string}`,
          abi: FHENIX_YIELD_VAULT_ABI,
          functionName: "totalAssets",
        }),
      ]);

      const shares = shareBalance as bigint;
      if (shares === 0n) continue;

      const supply = totalSupply as bigint;
      const assets = totalAssets as bigint;
      const tokenBalance = supply > 0n ? (shares * assets) / supply : 0n;
      const balanceStr = tokenBalance.toString();
      const price = Number.parseFloat(entry.underlyingPrice) || 0;
      const balanceUSD = (
        (Number(tokenBalance) / 10 ** entry.decimals) *
        price
      ).toFixed(6);

      portfolio.push({
        chainId: 421614,
        vaultAddress: entry.vault,
        vaultName: entry.name,
        protocol: "Fhenix CoFHE",
        token: {
          address: FHENIX_CONTRACTS.USDC,
          symbol: entry.symbol,
          name: entry.name,
          decimals: entry.decimals,
          logoURI:
            "https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
          priceUSD: entry.underlyingPrice,
          isFhenix: false,
        },
        balance: balanceStr,
        balanceUSD,
        apy: 0,
        isFhenix: true,
        decryptedBalance: tokenBalance.toString(),
      });
    } catch {}
  }

  return NextResponse.json({
    data: portfolio,
    total: portfolio.length,
  });
}
