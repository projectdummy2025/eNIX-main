import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIFI_EARN_API_BASE_URL =
  process.env.LIFI_EARN_API_BASE_URL ?? "https://earn.li.fi/v1";
const LIFI_PORTFOLIO_URL = `${LIFI_EARN_API_BASE_URL}/portfolio`;

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ address: string }> },
) {
  const { address } = await context.params;

  if (!ADDRESS_PATTERN.test(address)) {
    return NextResponse.json({ error: "invalid_address" }, { status: 400 });
  }

  const apiKey = process.env.LIFI_API_KEY;
  const headers: Record<string, string> = { accept: "application/json" };
  if (apiKey) headers["x-lifi-api-key"] = apiKey;

  try {
    const upstream = await fetch(`${LIFI_PORTFOLIO_URL}/${address}/positions`, {
      headers,
      cache: "no-store",
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: "upstream_error",
          status: upstream.status,
          message: text,
        },
        { status: upstream.status },
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
