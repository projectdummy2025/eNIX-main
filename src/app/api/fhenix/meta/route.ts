import { NextResponse } from "next/server";
import type { FhenixChain, FhenixToken } from "@/lib/fhenix-types";
import { FHENIX_CONTRACTS } from "@/lib/fhenix-types";

const SUPPORTED_CHAINS: FhenixChain[] = [
  {
    id: 421614,
    name: "Arbitrum Sepolia",
    shortName: "Arb Sepolia",
    logoURI: "/Assets/Images/Logo-Coin/arb-logo.svg",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    explorerUrl: "https://sepolia.arbiscan.io",
    isFhenixSupported: true,
  },
];

const FHENIX_META_TOKENS: Record<number, FhenixToken[]> = {
  421614: [
    {
      address: FHENIX_CONTRACTS.USDC,
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      logoURI:
        "https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
      priceUSD: "1",
      isFhenix: false,
    },
    {
      address: FHENIX_CONTRACTS.RLC,
      symbol: "RLC",
      name: "RLC",
      decimals: 9,
      logoURI: "/Assets/Images/Logo-Coin/rlc-logo.svg",
      priceUSD: "3.5",
      isFhenix: false,
    },
  ],
};

export async function GET() {
  return NextResponse.json({
    chains: SUPPORTED_CHAINS,
    tokens: FHENIX_META_TOKENS,
  });
}
