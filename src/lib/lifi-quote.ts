export type LifiQuoteResponse = {
  id: string;
  type: string;
  tool: string;
  action: {
    fromChainId: number;
    toChainId: number;
    fromToken: {
      address: string;
      symbol: string;
      decimals: number;
      chainId: number;
    };
    toToken: {
      address: string;
      symbol: string;
      decimals: number;
      chainId: number;
    };
    fromAmount: string;
    slippage: number;
    fromAddress: string;
    toAddress: string;
  };
  estimate: {
    fromAmount: string;
    toAmount: string;
    toAmountMin: string;
    approvalAddress?: string;
    executionDuration: number;
    gasCosts?: { amountUSD: string }[];
    feeCosts?: { amountUSD: string }[];
    fromAmountUSD?: string;
    toAmountUSD?: string;
  };
  transactionRequest: {
    to?: string;
    data?: string;
    value?: string;
    chainId?: number;
  };
};

export type FetchQuoteParams = {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAddress: string;
  fromAmount: string;
  slippage: number;
};

export async function fetchQuoteViaProxy(
  params: FetchQuoteParams,
  signal?: AbortSignal,
): Promise<LifiQuoteResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const url = new URL("/api/earn/quote", baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, String(value));
  }
  const response = await fetch(url.toString(), {
    signal,
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`quote_failed_${response.status}`);
  }
  return (await response.json()) as LifiQuoteResponse;
}
