import type { Address } from "viem";

export type FhenixVault = {
  address: string;
  chainId: number;
  name: string;
  protocol: string;
  protocolLogo?: string;
  description?: string;
  underlyingToken: FhenixToken;
  apy: {
    base: number | null;
    reward: number | null;
    total: number;
  };
  apy1d?: number | null;
  apy7d?: number | null;
  apy30d?: number | null;
  tvl: {
    usd: string;
    native?: string;
  };
  caps?: {
    totalCap?: string;
    maxCap?: string;
  };
  timeLock?: number;
  isFhenix: true;
  riskTier?: "low" | "medium" | "high";
};

export type FhenixToken = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  priceUSD?: string;
  isFhenix: boolean;
};

export type FhenixChain = {
  id: number;
  name: string;
  shortName: string;
  logoURI?: string;
  rpcUrl?: string;
  explorerUrl?: string;
  isFhenixSupported: boolean;
};

export type FhenixVaultsResponse = {
  data: FhenixVault[];
  nextCursor: string | null;
  total: number;
};

export type FetchVaultsParams = {
  chainId?: number;
  tokenAddress?: string;
  protocol?: string;
  minTvlUsd?: number;
  sortBy?: "apy" | "tvl";
  limit?: number;
  cursor?: string;
};

export type FhenixQuote = {
  vaultAddress: string;
  tokenIn: FhenixToken;
  tokenOut: FhenixToken;
  amountIn: string;
  amountOut: string;
  estimatedYield: string;
  fee: string;
  steps: FhenixQuoteStep[];
  isFhenix: true;
};

export type FhenixQuoteStep = {
  type: "approve" | "deposit" | "withdraw";
  token: FhenixToken;
  amount: string;
  contractAddress?: string;
  spender?: string;
};

export type FhenixPortfolio = {
  chainId: number;
  vaultAddress: string;
  vaultName: string;
  protocol: string;
  token: FhenixToken;
  balance: string;
  balanceUSD: string;
  apy: number;
  isFhenix: true;
  decryptedBalance?: string;
};

export const ARBITRUM_SEPOLIA_ID = 421614;

export const FHENIX_CHAINS: FhenixChain[] = [
  {
    id: 421614,
    name: "Arbitrum Sepolia",
    shortName: "Arb Sepolia",
    logoURI: "/Assets/Images/Logo-Coin/arb-logo.svg",
    isFhenixSupported: true,
  },
  {
    id: 42161,
    name: "Arbitrum One",
    shortName: "Arbitrum",
    logoURI: "/Assets/Images/Logo-Coin/arb-logo.svg",
    isFhenixSupported: true,
  },
];

export const FHENIX_CONTRACTS = {
  USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  RLC: "0x9923eD3cbd90CD78b910c475f9A731A6e0b8C963",
} as const;

export const FHENIX_VAULTS = {
  USDC_VAULT: "0x0000000000000000000000000000000000000000",
  RLC_VAULT: "0x0000000000000000000000000000000000000000",
} as const;

export function getVaultForToken(tokenAddress: string): `0x${string}` {
  const lower = tokenAddress.toLowerCase();
  if (lower === FHENIX_CONTRACTS.USDC.toLowerCase())
    return FHENIX_VAULTS.USDC_VAULT;
  if (lower === FHENIX_CONTRACTS.RLC.toLowerCase())
    return FHENIX_VAULTS.RLC_VAULT;
  return "0x0000000000000000000000000000000000000000";
}

export const FHENIX_TOKENS: Record<number, FhenixToken[]> = {
  421614: [
    {
      address: FHENIX_CONTRACTS.USDC,
      symbol: "cUSDC",
      name: "Confidential USDC",
      decimals: 6,
      logoURI:
        "https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
      priceUSD: "1",
      isFhenix: true,
    },
    {
      address: FHENIX_CONTRACTS.RLC,
      symbol: "cRLC",
      name: "Confidential RLC",
      decimals: 9,
      logoURI: "/Assets/Images/Logo-Coin/rlc-logo.svg",
      priceUSD: "3.5",
      isFhenix: true,
    },
  ],
  42161: [],
};

export function isFhenixVault(symbol: string): boolean {
  return symbol.startsWith("c");
}

export const FHENIX_YIELD_VAULT_ABI = [
  {
    type: "function",
    name: "deposit",
    inputs: [
      {
        name: "encryptedAmount",
        type: "tuple",
        internalType: "struct InEuint64",
        components: [
          { name: "ctHash", type: "uint256" },
          { name: "securityZone", type: "int32" },
          { name: "utype", type: "uint8" },
          { name: "signature", type: "bytes" },
        ],
      },
      { name: "plaintextAmount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      {
        name: "encryptedShares",
        type: "tuple",
        internalType: "struct InEuint64",
        components: [
          { name: "ctHash", type: "uint256" },
          { name: "securityZone", type: "int32" },
          { name: "utype", type: "uint8" },
          { name: "signature", type: "bytes" },
        ],
      },
      { name: "plaintextShares", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "encryptedBalanceOf",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalAssets",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "estimatedAPY",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "asset",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "convertToAssets",
    inputs: [{ name: "shares", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "convertToShares",
    inputs: [{ name: "assets", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "previewDeposit",
    inputs: [{ name: "assets", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "previewRedeem",
    inputs: [{ name: "shares", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
] as const;
