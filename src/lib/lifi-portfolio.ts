export type LifiPortfolioPosition = {
  chainId: number;
  protocolName: string;
  asset: {
    address: string;
    symbol: string;
    decimals: number;
    name?: string;
    logoURI?: string;
  };
  balanceNative: string;
  balanceUsd: string;
  tvlUsd?: string;
  apy?: number;
  vaultAddress?: string;
  vaultName?: string;
  tokenId?: string;
};

export type LifiPortfolioResponse = {
  data: LifiPortfolioPosition[];
  total: number;
};

export async function fetchPortfolioViaProxy(
  address: string,
  signal?: AbortSignal,
): Promise<LifiPortfolioResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const url = new URL(`/api/fhenix/portfolio/${address}`, baseUrl);
  const response = await fetch(url.toString(), {
    signal,
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`portfolio_failed_${response.status}`);
  }
  return (await response.json()) as LifiPortfolioResponse;
}
