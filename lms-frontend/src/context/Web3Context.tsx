import React, { useEffect, useState, useMemo } from "react";
import { ensureProvider, connectWallet, ensureChain } from "@/web3/web3";
import Ctx from "@/web3/context";
// Backwards-compatible hook export for modules still importing from '@/context/Web3Context'
export { useWeb3 } from "@/web3/context";

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [available] = useState<boolean>(ensureProvider());
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);

  const isConnected = Boolean(address);
  // parse chainId which may be hex (0x...) or decimal string
  const parsedChainId = chainId ? (String(chainId).startsWith('0x') ? parseInt(String(chainId), 16) : Number(chainId)) : null;
  const desiredChain = Number(import.meta.env.VITE_CHAIN_ID ?? '80002');
  const isCorrectNetwork = parsedChainId !== null && parsedChainId === desiredChain;

  useEffect(() => {
    if (!available) return;
    const handleAccounts = (accs: unknown) => {
      if (Array.isArray(accs) && accs.length) setAddress(String(accs[0]));
      else setAddress(null);
    };
    const handleChain = (c: unknown) => setChainId(c ? String(c) : null);

    const w = window as unknown as { ethereum?: { request?: (opts: unknown) => Promise<unknown>; on?: (ev: string, cb: (...args: unknown[]) => void) => void; removeListener?: (ev: string, cb: (...args: unknown[]) => void) => void } };
    try {
  w.ethereum?.request?.({ method: "eth_accounts" }).then((accs) => handleAccounts(accs)).catch(() => {});
  w.ethereum?.request?.({ method: "eth_chainId" }).then((c) => handleChain(c)).catch(() => {});
  w.ethereum?.on?.("accountsChanged", handleAccounts);
  w.ethereum?.on?.("chainChanged", handleChain);
    } catch {
      // ignore
    }

    return () => {
      try {
  w.ethereum?.removeListener?.("accountsChanged", handleAccounts);
  w.ethereum?.removeListener?.("chainChanged", handleChain);
      } catch {
        // ignore
      }
    };
  }, [available]);

  const doConnect = React.useCallback(async () => {
    if (!available) return { ok: false, error: "no provider" } as const;
    const r = await connectWallet();
    if (r.ok) setAddress(r.address ?? null);
    return r as { ok: boolean; address?: string | null; error?: unknown };
  }, [available]);

  function disconnect() {
    setAddress(null);
  }

  // lazy helpers that return live signer/contract when invoked
  const getSigner = React.useCallback(async () => {
    if (!ensureProvider()) return null;
    try {
      const ethers = await import('ethers');
      const w = window as unknown as { ethereum?: unknown };
      // BrowserProvider expects window.ethereum
      const provider = new ethers.BrowserProvider(w.ethereum as any);
      return provider.getSigner();
    } catch {
      return null;
    }
  }, []);

  const getContract = React.useCallback(async () => {
    try {
      const ethers = await import('ethers');
      const TEOCOIN_ABI = (await import('@/web3/teocoin_abi')).default;
      const addr = import.meta.env.VITE_TEO_CONTRACT_ADDRESS ?? (await import('@/web3/teocoin_abi')).CONTRACT_ADDRESS;
      const signer = await getSigner();
      if (!signer) return null;
      return new ethers.Contract(addr, TEOCOIN_ABI, signer);
    } catch {
      return null;
    }
  }, [getSigner]);

  const value = useMemo(() => ({ available, address, chainId, connect: doConnect, disconnect, ensureChain, isConnected, getSigner, getContract, isCorrectNetwork }), [available, address, chainId, doConnect, getSigner, getContract, isConnected, isCorrectNetwork]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export default Web3Provider;
