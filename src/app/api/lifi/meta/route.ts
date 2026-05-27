import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 60;

const CHAINS_URL = "https://li.quest/v1/chains";
const TOKENS_URL = "https://li.quest/v1/tokens";
const LIFI_EARN_API_BASE_URL =
  process.env.LIFI_EARN_API_BASE_URL ?? "https://earn.li.fi/v1";
const EARN_PROTOCOLS_URL = `${LIFI_EARN_API_BASE_URL}/protocols`;
const EARN_CHAINS_URL = `${LIFI_EARN_API_BASE_URL}/chains`;
const EARN_VAULTS_URL = `${LIFI_EARN_API_BASE_URL}/vaults`;

const PRIORITY_SYMBOLS = new Set([
  "ETH",
  "WETH",
  "USDC",
  "USDT",
  "DAI",
  "USDe",
  "sUSDe",
  "USDtb",
  "USDS",
  "PYUSD",
  "RLUSD",
  "USDG",
  "USD1",
  "FDUSD",
  "WBTC",
  "cbBTC",
  "LBTC",
  "tBTC",
  "BTCB",
  "weETH",
  "wstETH",
  "stETH",
  "rETH",
  "rsETH",
  "ezETH",
  "cbETH",
  "osETH",
  "tETH",
  "AAVE",
  "LINK",
  "UNI",
  "MKR",
  "CRV",
  "LDO",
  "WAVAX",
  "sAVAX",
  "WBNB",
  "WMATIC",
  "WCELO",
  "slisBNB",
]);

type EarnChainEntry = { chainId: number };

type TokenEntry = {
  address: string;
  chainId: number;
  symbol: string;
  decimals: number;
  name?: string;
  logoURI?: string;
  priceUSD?: string;
};

type EarnVault = {
  chainId: number;
  underlyingTokens?: {
    address: string;
    symbol: string;
    decimals: number;
    name?: string;
  }[];
};

export async function GET() {
  const apiKey = process.env.LIFI_API_KEY;
  const headers: Record<string, string> = { accept: "application/json" };
  if (apiKey) headers["x-lifi-api-key"] = apiKey;

  try {
    const [chainsResponse, earnChainsRes, protocolsResponse, vaultsRes] =
      await Promise.all([
        fetch(`${CHAINS_URL}?chainTypes=EVM`, { headers, cache: "no-store" }),
        fetch(EARN_CHAINS_URL, { headers, cache: "no-store" }),
        fetch(EARN_PROTOCOLS_URL, { headers, cache: "no-store" }),
        fetch(`${EARN_VAULTS_URL}?limit=500&minTvlUsd=50000`, {
          headers,
          cache: "no-store",
        }),
      ]);

    if (!chainsResponse.ok) {
      return NextResponse.json({ error: "upstream_error" }, { status: 502 });
    }

    const chainsPayload = (await chainsResponse.json()) as {
      chains?: unknown[];
    };

    let earnChainIds: number[] = [];
    if (earnChainsRes.ok) {
      try {
        const earnChains = (await earnChainsRes.json()) as EarnChainEntry[];
        earnChainIds = earnChains.map((c) => c.chainId);
      } catch {}
    }
    if (earnChainIds.length === 0) {
      earnChainIds = [
        143, 1, 10, 56, 100, 130, 137, 146, 5000, 8453, 42161, 42220, 43114,
        59144,
      ];
    } else if (!earnChainIds.includes(143)) {
      earnChainIds = [143, ...earnChainIds];
    }

    const vaultTokensByChain = new Map<number, Set<string>>();
    if (vaultsRes.ok) {
      try {
        const body = (await vaultsRes.json()) as { data?: EarnVault[] };
        for (const vault of body.data ?? []) {
          if (!vaultTokensByChain.has(vault.chainId)) {
            vaultTokensByChain.set(vault.chainId, new Set());
          }
          const set = vaultTokensByChain.get(vault.chainId)!;
          for (const ut of vault.underlyingTokens ?? []) {
            if (ut.symbol) set.add(ut.symbol.toUpperCase());
          }
        }
      } catch {}
    }

    const tokenChainIds = earnChainIds.join(",");
    const tokensResponse = await fetch(
      `${TOKENS_URL}?chains=${tokenChainIds}`,
      { headers, cache: "no-store" },
    );

    const tokensPayload = tokensResponse.ok
      ? ((await tokensResponse.json()) as {
          tokens?: Record<string, TokenEntry[]>;
        })
      : { tokens: {} };

    let protocols: unknown[] = [];
    if (protocolsResponse.ok) {
      try {
        const protocolsPayload = (await protocolsResponse.json()) as unknown;
        if (Array.isArray(protocolsPayload)) {
          protocols = protocolsPayload;
        } else if (
          protocolsPayload &&
          typeof protocolsPayload === "object" &&
          "protocols" in protocolsPayload &&
          Array.isArray(
            (protocolsPayload as { protocols?: unknown[] }).protocols,
          )
        ) {
          protocols =
            (protocolsPayload as { protocols: unknown[] }).protocols ?? [];
        }
      } catch {
        protocols = [];
      }
    }

    const rawTokens = tokensPayload.tokens ?? {};
    const tokens: Record<string, TokenEntry[]> = {};

    for (const [chainIdKey, list] of Object.entries(rawTokens)) {
      if (!Array.isArray(list)) continue;
      const chainId = Number(chainIdKey);
      const vaultSymbols = vaultTokensByChain.get(chainId);

      tokens[chainIdKey] = list.filter((t) => {
        const sym = (t.symbol ?? "").toUpperCase();
        return PRIORITY_SYMBOLS.has(sym) || (vaultSymbols?.has(sym) ?? false);
      });
    }

    const missingChains = earnChainIds.filter(
      (id) => !tokens[String(id)] || tokens[String(id)].length === 0,
    );

    if (missingChains.length > 0) {
      const perChainFetches = missingChains.map(async (chainId) => {
        const vaultSymbols = vaultTokensByChain.get(chainId);

        try {
          const tokenRes = await fetch(`${TOKENS_URL}?chains=${chainId}`, {
            headers,
            cache: "no-store",
          });
          if (tokenRes.ok) {
            const payload = (await tokenRes.json()) as {
              tokens?: Record<string, TokenEntry[]>;
            };
            const list = payload.tokens?.[String(chainId)];
            if (list && list.length > 0) {
              const filtered = list.filter((t) => {
                const sym = (t.symbol ?? "").toUpperCase();
                return (
                  PRIORITY_SYMBOLS.has(sym) || (vaultSymbols?.has(sym) ?? false)
                );
              });
              if (filtered.length > 0) return { chainId, tokens: filtered };
            }
          }
        } catch {}

        try {
          const res = await fetch(
            `${EARN_VAULTS_URL}?chainId=${chainId}&limit=100`,
            { headers, cache: "no-store" },
          );
          if (!res.ok) return { chainId, tokens: [] as TokenEntry[] };
          const body = (await res.json()) as { data?: EarnVault[] };
          const vaults = body.data ?? [];
          const seen = new Set<string>();
          const chainTokens: TokenEntry[] = [];

          for (const vault of vaults) {
            for (const ut of vault.underlyingTokens ?? []) {
              if (!ut.symbol || seen.has(ut.address.toLowerCase())) continue;
              seen.add(ut.address.toLowerCase());
              chainTokens.push({
                address: ut.address,
                chainId,
                symbol: ut.symbol,
                decimals: ut.decimals,
                name: ut.name ?? ut.symbol,
              });
            }
          }
          return { chainId, tokens: chainTokens };
        } catch {
          return { chainId, tokens: [] as TokenEntry[] };
        }
      });

      const results = await Promise.all(perChainFetches);
      for (const { chainId, tokens: chainTokens } of results) {
        if (chainTokens.length > 0) {
          tokens[String(chainId)] = chainTokens;
        }
      }
    }

    return NextResponse.json(
      { chains: chainsPayload.chains ?? [], tokens, protocols },
      {
        headers: {
          "cache-control":
            "public, max-age=60, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "proxy_failed",
        message: error instanceof Error ? error.message : "unknown",
      },
      { status: 502 },
    );
  }
}
