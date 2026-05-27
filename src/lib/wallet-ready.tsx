"use client";

import { createContext, useContext } from "react";

export const WalletReadyContext = createContext<boolean>(false);

export function useWalletReady(): boolean {
  return useContext(WalletReadyContext);
}
