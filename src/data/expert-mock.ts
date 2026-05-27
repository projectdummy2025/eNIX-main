import type { Chain, Token } from "@/types";

export const mockTokens: Token[] = [
  { symbol: "USDC", name: "USD Coin", usdPrice: 1 },
  { symbol: "RLC", name: "iExec RLC", usdPrice: 3.5 },
];

export const mockChains: Chain[] = [
  {
    id: 421614,
    name: "Arbitrum Sepolia",
    shortName: "Arb Sepolia",
    logoURI: "/Assets/Images/Logo-Coin/arb-logo.svg",
  },
  {
    id: 42161,
    name: "Arbitrum One",
    shortName: "Arbitrum",
    logoURI: "/Assets/Images/Logo-Coin/arb-logo.svg",
  },
  { id: 8453, name: "Base", shortName: "Base" },
  { id: 137, name: "Polygon", shortName: "Polygon" },
  { id: 747474, name: "Katana", shortName: "Katana" },
  { id: 56, name: "BNB Chain", shortName: "BSC" },
  { id: 10, name: "Optimism", shortName: "Optimism" },
  { id: 43114, name: "Avalanche", shortName: "Avalanche" },
  { id: 59144, name: "Linea", shortName: "Linea" },
  { name: "Gnosis", id: 100, shortName: "Gnosis" },
  { id: 130, name: "Unichain", shortName: "Unichain" },
  { id: 5000, name: "Mantle", shortName: "Mantle" },
  { id: 146, name: "Sonic", shortName: "Sonic" },
  { id: 42220, name: "Celo", shortName: "Celo" },
];
