import React, { useState } from "react";
import { ensureProvider, connectWallet, ensureChain } from "@onchain/web3";
import { linkWallet } from "@/features/wallet/walletApi";

const AMOY_HEX = "0x13882"; // 80002
const RPC_AMOY = import.meta.env?.VITE_RPC_URL_AMOY as string | undefined;

export function ConnectWallet({ onConnected }: { onConnected?: (addr: string) => void }) {
  const [loading, setLoading] = useState(false);
  const provider = ensureProvider();

  async function handleClick() {
    setLoading(true);
    try {
      const c = await ensureChain(AMOY_HEX, RPC_AMOY);
      if (!c.ok) throw c.error ?? new Error("chain switch failed");
      const r = await connectWallet();
      if (!r.ok) throw r.error ?? new Error("connect failed");
      const addr = r.address as string;
  // POST to backend
  // TODO: obtain a real signature from the provider and pass it here
  const save = await linkWallet(addr, "");
      if (!save.ok) throw save.error ?? new Error("link failed");
      if (onConnected) onConnected(addr);
    } catch (err) {
      console.error(err);
      // try to surface useful message
  const e = err as unknown;
  const msg = (e && typeof e === 'object' && 'message' in (e as Record<string, unknown>)) ? String((e as Record<string, unknown>).message) : String(e);
      alert(msg || String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!provider) {
    return (
      <a className="text-sm text-indigo-600 underline" href="https://metamask.io/download.html" target="_blank" rel="noreferrer">Install MetaMask</a>
    );
  }

  return (
    <button className="h-10 px-4 rounded-xl bg-indigo-600 text-white" onClick={handleClick} disabled={loading}>
      {loading ? "Collegamento…" : "Collega MetaMask"}
    </button>
  );
}

export default ConnectWallet;
