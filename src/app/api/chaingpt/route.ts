import { NextResponse } from "next/server";
import { chatWithChainGPT } from "@/lib/chaingpt";

export async function POST(request: Request) {
  const body = (await request.json()) as { prompt?: string };
  const prompt = body.prompt;

  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  try {
    const text = await chatWithChainGPT(prompt);
    return NextResponse.json({ text });
  } catch (error) {
    const message = (error as Error).message || "ChainGPT request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
