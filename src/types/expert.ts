export type Token = {
  symbol: string;
  name: string;
  usdPrice: number;
};

export type Chain = {
  id: number;
  name: string;
  shortName: string;
  logoURI?: string;
};

export type VaultRisk = "low" | "medium" | "high";

export type VaultStrategy = {
  id: string;
  protocol: string;
  protocolKey: string;
  protocolLogoUri?: string;
  protocolUrl?: string;
  vaultName: string;
  vaultAddress: string;
  tokenSymbol: string;
  tokenAddress: string;
  tokenDecimals: number;
  chainId: number;
  chainShortName: string;
  apy: number;
  apy30d: number | null;
  tvlUsd: number;
  risk: VaultRisk;
  isTransactional: boolean;
  isRedeemable: boolean;
  kyc: boolean;
  timeLock: number;
  tags: string[];
};

export type VaultSortKey = "apy" | "tvl";
