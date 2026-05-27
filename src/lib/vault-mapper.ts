import { mockChains } from "@/data";
import type { LifiVault } from "@/lib/lifi-earn";
import { resolveProtocol } from "@/lib/protocol-registry";
import type { VaultRisk, VaultStrategy } from "@/types";

export function inferVaultRisk(apyPercent: number, tvlUsd: number): VaultRisk {
  if (!Number.isFinite(apyPercent) || apyPercent <= 0) return "medium";

  const whaleTvl = tvlUsd >= 50_000_000;
  const largeTvl = tvlUsd >= 5_000_000;
  const smallTvl = tvlUsd < 1_000_000;

  if (apyPercent >= 40) return "high";
  if (apyPercent >= 20 && !whaleTvl) return "high";
  if (smallTvl && apyPercent >= 10) return "high";

  if (apyPercent >= 12) return "medium";
  if (apyPercent >= 6 && !whaleTvl) return "medium";
  if (smallTvl) return "medium";

  if (largeTvl && apyPercent <= 10) return "low";
  return "low";
}

export function resolveChainShortName(chainId: number): string {
  const chain = mockChains.find((item) => item.id === chainId);
  if (chain) return chain.shortName;
  return `Chain ${chainId}`;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function mapLifiVault(vault: LifiVault): VaultStrategy {
  const tvlUsd = toNumber(vault.analytics?.tvl?.usd, 0);
  const apyPercent = toNumber(vault.analytics?.apy?.total, 0);
  const apy30dPercent =
    vault.analytics?.apy30d === null || vault.analytics?.apy30d === undefined
      ? null
      : toNumber(vault.analytics.apy30d, 0);
  const underlying = vault.underlyingTokens?.[0];
  const rawProtocolName = vault.protocol?.name ?? "Unknown";
  const resolved = resolveProtocol(rawProtocolName);
  const apiLogo = vault.protocol?.logoUri ?? vault.protocol?.logoURI;

  return {
    id: `${vault.chainId}:${vault.address}`,
    protocol: resolved.displayName,
    protocolKey: resolved.slug,
    protocolLogoUri: resolved.logoPath ?? apiLogo,
    protocolUrl: vault.protocol?.url,
    vaultName: vault.name,
    vaultAddress: vault.address,
    tokenSymbol: underlying?.symbol ?? "-",
    tokenAddress: underlying?.address ?? "",
    tokenDecimals: underlying?.decimals ?? 18,
    chainId: vault.chainId,
    chainShortName: resolveChainShortName(vault.chainId),
    apy: apyPercent,
    apy30d: apy30dPercent,
    tvlUsd,
    risk: inferVaultRisk(apyPercent, tvlUsd),
    isTransactional: Boolean(vault.isTransactional),
    isRedeemable: Boolean(vault.isRedeemable),
    kyc: Boolean(vault.kyc),
    timeLock: toNumber(vault.timeLock, 0),
    tags: Array.isArray(vault.tags) ? vault.tags : [],
  };
}
