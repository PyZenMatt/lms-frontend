import React from "react";

export type Web3Ctx = {
  available: boolean;
  address: string | null;
  chainId: string | null;
  connect: () => Promise<{ ok: boolean; address?: string | null; error?: unknown }>;
  disconnect: () => void;
  ensureChain: (chainIdHex: string) => Promise<{ ok: boolean; switched?: boolean; error?: unknown }>;
  // additions
  isConnected: boolean;
  // getters for on-demand signer/contract (avoid storing objects in context to prevent stale closures)
  getSigner?: () => Promise<any | null>;
  getContract?: () => Promise<any | null>;
  isCorrectNetwork: boolean;
};

export const Ctx = React.createContext<Web3Ctx | undefined>(undefined);

export function useWeb3() {
  const c = React.useContext(Ctx);
  if (!c) throw new Error("useWeb3 must be used inside Web3Provider");
  return c;
}

export default Ctx;
