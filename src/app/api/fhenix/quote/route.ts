import { NextResponse } from "next/server";
import type { FhenixQuote, FhenixQuoteStep } from "@/lib/fhenix-types";
import { FHENIX_CONTRACTS } from "@/lib/fhenix-types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const vaultAddress = searchParams.get("vaultAddress");
  const tokenIn = searchParams.get("tokenIn");
  const amountIn = searchParams.get("amountIn");

  if (!vaultAddress || !tokenIn || !amountIn) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  }

  try {
    BigInt(amountIn);
  } catch {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const isUSDC = tokenIn.toLowerCase() === FHENIX_CONTRACTS.USDC.toLowerCase();
  const isRLC = tokenIn.toLowerCase() === FHENIX_CONTRACTS.RLC.toLowerCase();

  if (!isUSDC && !isRLC) {
    return NextResponse.json(
      {
        error:
          "Unsupported token. Only USDC and RLC are supported on Arbitrum Sepolia.",
      },
      { status: 400 },
    );
  }

  const decimals = isUSDC ? 6 : 9;
  const symbol = isUSDC ? "USDC" : "RLC";
  const name = isUSDC ? "USD Coin" : "iExec RLC";

  const steps: FhenixQuoteStep[] = [
    {
      type: "approve",
      token: { address: tokenIn, symbol, name, decimals, isFhenix: false },
      amount: amountIn,
      spender: vaultAddress,
    },
    {
      type: "deposit",
      token: { address: tokenIn, symbol, name, decimals, isFhenix: false },
      amount: amountIn,
      contractAddress: vaultAddress,
    },
  ];

  const quote: FhenixQuote = {
    vaultAddress,
    tokenIn: { address: tokenIn, symbol, name, decimals, isFhenix: false },
    tokenOut: { address: tokenIn, symbol, name, decimals, isFhenix: true },
    amountIn,
    amountOut: amountIn,
    estimatedYield: "5.7",
    fee: "0",
    steps,
    isFhenix: true,
  };

  return NextResponse.json(quote);
}
