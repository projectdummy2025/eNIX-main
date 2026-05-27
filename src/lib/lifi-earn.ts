export type LifiVaultProtocol = {
  name: string;
  logoUri?: string;
  logoURI?: string;
  url?: string;
};

export type LifiUnderlyingToken = {
  address: string;
  symbol: string;
  decimals: number;
  weight?: number;
};

export type LifiVaultAnalytics = {
  apy: {
    base: number | null;
    reward: number | null;
    total: number;
  };
  apy1d: number | null;
  apy7d: number | null;
  apy30d: number | null;
  tvl: {
    usd: string;
    native?: string;
  };
  updatedAt: string;
};

export type LifiVault = {
  address: string;
  network: string;
  chainId: number;
  slug: string;
  name: string;
  description?: string | null;
  protocol: LifiVaultProtocol;
  underlyingTokens: LifiUnderlyingToken[];
  tags?: string[];
  analytics: LifiVaultAnalytics;
  timeLock?: number;
  kyc?: boolean;
  isTransactional: boolean;
  isRedeemable: boolean;
  syncedAt?: string;
};

export type LifiVaultsResponse = {
  data: LifiVault[];
  nextCursor: string | null;
  total: number;
};

export type FetchVaultsParams = {
  chainId?: number;
  asset?: string;
  protocol?: string;
  minTvlUsd?: number;
  sortBy?: "apy" | "tvl";
  limit?: number;
  cursor?: string;
};

export async function fetchVaultsViaProxy(
  params: FetchVaultsParams,
  signal?: AbortSignal,
): Promise<LifiVaultsResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const url = new URL("/api/earn/vaults", baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    signal,
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`vaults_fetch_failed_${response.status}`);
  }

  return (await response.json()) as LifiVaultsResponse;
}
