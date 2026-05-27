import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIFI_QUOTE_URL = "https://li.quest/v1/quote";

const PASS_THROUGH_PARAMS = [
  "fromChain",
  "toChain",
  "fromToken",
  "toToken",
  "fromAddress",
  "toAddress",
  "fromAmount",
  "slippage",
  "order",
  "integrator",
  "referrer",
  "allowBridges",
  "allowExchanges",
] as const;

export async function GET(request: NextRequest) {
  const apiKey = process.env.LIFI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "missing_api_key" }, { status: 500 });
  }

  const incoming = request.nextUrl.searchParams;
  const upstream = new URL(LIFI_QUOTE_URL);

  for (const key of PASS_THROUGH_PARAMS) {
    const value = incoming.get(key);
    if (value !== null && value !== "") {
      upstream.searchParams.set(key, value);
    }
  }

  try {
    const upstreamResponse = await fetch(upstream.toString(), {
      headers: {
        accept: "application/json",
        "x-lifi-api-key": apiKey,
      },
      cache: "no-store",
    });

    const text = await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      let message = text;
      let code: string | number | undefined;
      try {
        const parsed = JSON.parse(text) as {
          message?: string;
          code?: string | number;
        };
        if (typeof parsed.message === "string") message = parsed.message;
        if (parsed.code !== undefined) code = parsed.code;
      } catch {}
      return NextResponse.json(
        {
          error: "upstream_error",
          status: upstreamResponse.status,
          code,
          message,
        },
        { status: upstreamResponse.status },
      );
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
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
