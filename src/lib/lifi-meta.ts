export type LifiChainMeta = {
  id: number;
  key: string;
  name: string;
  logoURI?: string;
  chainType: string;
  nativeToken?: {
    symbol: string;
    logoURI?: string;
  };
};

export type LifiTokenMeta = {
  address: string;
  chainId: number;
  symbol: string;
  decimals: number;
  name: string;
  logoURI?: string;
  priceUSD?: string;
};

export type LifiProtocolMeta = {
  name: string;
  logoUri?: string;
  logoURI?: string;
  url?: string;
};

export type LifiMetaResponse = {
  chains?: LifiChainMeta[];
  tokens?: Record<string, LifiTokenMeta[]>;
  protocols?: LifiProtocolMeta[];
};

export async function fetchLifiMeta(
  signal?: AbortSignal,
): Promise<LifiMetaResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const url = new URL("/api/nox/meta", baseUrl);
  const response = await fetch(url.toString(), {
    signal,
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`nox_meta_failed_${response.status}`);
  }
  const raw = await response.json();
  return {
    chains: (raw.chains ?? []).map(
      (c: {
        id: number;
        name: string;
        shortName: string;
        logoURI?: string;
      }) => ({
        id: c.id,
        key: c.shortName?.toLowerCase().replace(/\s+/g, "-") ?? String(c.id),
        name: c.name,
        logoURI: c.logoURI,
        chainType: "EVM",
      }),
    ),
    tokens: raw.tokens ?? {},
    protocols: [],
  } as LifiMetaResponse;
}
