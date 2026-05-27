import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIFI_EARN_API_BASE_URL =
  process.env.LIFI_EARN_API_BASE_URL ?? "https://earn.li.fi/v1";
const LIFI_EARN_VAULTS_URL = `${LIFI_EARN_API_BASE_URL}/vaults`;

const PASS_THROUGH_PARAMS = [
  "chainId",
  "asset",
  "protocol",
  "minTvlUsd",
  "sortBy",
  "limit",
  "cursor",
] as const;

export async function GET(request: NextRequest) {
  const apiKey = process.env.LIFI_API_KEY;
  const incoming = request.nextUrl.searchParams;
  const upstream = new URL(LIFI_EARN_VAULTS_URL);

  for (const key of PASS_THROUGH_PARAMS) {
    const value = incoming.get(key);
    if (value !== null && value !== "") {
      upstream.searchParams.set(key, value);
    }
  }

  if (!upstream.searchParams.has("limit")) {
    upstream.searchParams.set("limit", "10");
  }

  try {
    const headers: Record<string, string> = { accept: "application/json" };
    if (apiKey) headers["x-lifi-api-key"] = apiKey;

    const upstreamResponse = await fetch(upstream.toString(), {
      headers,
      cache: "no-store",
    });

    const text = await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          error: "upstream_error",
          status: upstreamResponse.status,
          message: text,
        },
        { status: upstreamResponse.status },
      );
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control":
          "public, max-age=15, s-maxage=15, stale-while-revalidate=45",
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
