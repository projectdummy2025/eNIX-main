"use client";

import type { CofheClient } from "@cofhe/sdk";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { chains } from "@cofhe/sdk/chains";
import { createCofheClient, createCofheConfig } from "@cofhe/sdk/web";
import type { PublicClient, WalletClient } from "viem";

let cofheClient: CofheClient | null = null;
let connected = false;

export function getCofheClient(): CofheClient {
  if (!cofheClient) {
    const config = createCofheConfig({
      supportedChains: [chains.arbSepolia],
    });
    cofheClient = createCofheClient(config);
  }
  return cofheClient;
}

export async function connectCofheClient(
  publicClient: PublicClient,
  walletClient: WalletClient,
): Promise<void> {
  const client = getCofheClient();
  if (connected) return;
  await client.connect(publicClient, walletClient);
  connected = true;
}

export function disconnectCofheClient(): void {
  const client = getCofheClient();
  client.disconnect();
  connected = false;
}

export function isCofheConnected(): boolean {
  return connected;
}

export async function ensurePermit(): Promise<void> {
  const client = getCofheClient();
  await client.permits.getOrCreateSelfPermit();
}

export async function encryptUint64(value: bigint) {
  const client = getCofheClient();
  const [encrypted] = await client
    .encryptInputs([Encryptable.uint64(value)])
    .execute();
  return encrypted;
}

export async function decryptForView(ctHash: `0x${string}`): Promise<bigint> {
  const client = getCofheClient();
  const result = await client.decryptForView(ctHash, FheTypes.Uint64).execute();
  return result as bigint;
}

export { Encryptable, FheTypes };
export type { CofheClient };
