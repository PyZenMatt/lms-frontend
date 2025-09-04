import React, { useEffect, useState } from "react";
import { showToast } from "@/lib/api";
import { getChallenge, linkWallet, unlinkWallet } from "@/features/wallet/walletApi";
import { ensureChain, requestAccounts, personalSign } from "@/features/wallet/eth";
import { shortAddress } from "@/lib/formatters";
import { useAuth } from "@/context/AuthContext";

const CHAIN = (import.meta as any)?.env?.VITE_CHAIN_ID ?? "0x13882";
const RPC = (import.meta as any)?.env?.VITE_RPC_URL_AMOY ?? undefined;

export default function ConnectWalletButton() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // noop: we could hydrate linked state from global wallet refresh
    const onUpdated = () => {
      // the WalletPage refresh will re-fetch profile; for now we just notify user
      try { window.dispatchEvent(new CustomEvent('wallet:refreshed')); } catch {}
    };
    window.addEventListener('wallet:updated', onUpdated as EventListener);
    return () => window.removeEventListener('wallet:updated', onUpdated as EventListener);
  }, []);

  async function handleConnect() {
    setError(null);
    if (!isAuthenticated) {
      setError('Devi effettuare il login prima di collegare un wallet.');
      showToast({ variant: 'error', message: 'Login richiesto per collegare MetaMask' });
      return;
    }
    setLoading(true);
    try {
      const chainRes = await ensureChain(String(CHAIN), RPC);
      if (!chainRes.ok) throw chainRes.error ?? new Error('Chain switch failed');

      const acc = await requestAccounts();
      if (!acc.ok) throw acc.error ?? new Error('No accounts');
      const addr = acc.address;
      setAddress(addr);

  // fetch challenge from walletApi (ok/data shape)
  const challRes = await getChallenge();
  if (!challRes || !('ok' in challRes) || !challRes.ok) throw new Error('Challenge failed');

  // Prefer server-provided message to avoid signature mismatches
  const message = (challRes.data?.message as string | undefined) ?? (challRes.data?.nonce ? `Sign to link wallet. Nonce: ${challRes.data.nonce}` : 'Sign to link wallet');

  // sign
  console.debug('wallet connect (walletApi): signing payload', { message, address: addr });
  const sig = await personalSign(message, addr);
      if (!sig.ok) throw sig.error ?? new Error('Signing failed');

  // link (walletApi)
  const linkedRes = await linkWallet(addr, sig.signature);
  if (!linkedRes || !('ok' in linkedRes) || !linkedRes.ok) throw new Error(linkedRes.error ?? `HTTP_${linkedRes.status ?? 'ERR'}`);
  setLinked(true);
      setError(null);
      showToast({ variant: 'success', message: 'Wallet collegato ✅' });
        try {
          window.dispatchEvent(new CustomEvent('wallet:updated'));
        } catch (err) {
          console.warn('wallet update dispatch failed', err);
        }
      } catch (e: unknown) {
        console.error('wallet connect error', e);
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : String(e ?? '');
      setError(msg);
      showToast({ variant: 'error', message: 'Errore collegamento wallet: ' + msg });
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlink() {
    setLoading(true);
    try {
  const res = await unlinkWallet();
  if (!res || !('ok' in res) || !res.ok) throw new Error(res.error ?? `HTTP_${res.status ?? 'ERR'}`);
      setLinked(false);
      setAddress(null);
      showToast({ variant: 'success', message: 'Wallet scollegato' });
      try { window.dispatchEvent(new CustomEvent('wallet:updated')); } catch {}
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : String(e);
      setError(msg);
      showToast({ variant: 'error', message: 'Errore unlink: ' + msg });
    } finally {
      setLoading(false);
    }
  }

  // Render
  if (!window || typeof window === 'undefined' || !('ethereum' in window)) {
    return (
      <a target="_blank" rel="noreferrer" href="https://metamask.io/download.html" className="text-sm px-3 py-1 border rounded">Installa MetaMask</a>
    );
  }

  if (!isAuthenticated) {
    return (
      <a href="/login" className="text-sm px-3 py-1 border rounded">Login per collegare</a>
    );
  }

  if (linked) {
    return (
      <div className="flex items-center gap-2">
        {address && <div className="text-sm px-2 py-1 border rounded">{shortAddress(address)}</div>}
        <div className="text-sm text-green-700">Wallet collegato ✅</div>
        <button onClick={handleUnlink} disabled={loading} className="text-sm px-2 py-1 border rounded">Scollega</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button className="h-10 px-4 rounded-xl bg-indigo-600 text-white" onClick={handleConnect} disabled={loading}>
        {loading ? 'Collegamento…' : 'Collega MetaMask'}
      </button>
      {address && <div className="text-xs font-mono break-all">{address}</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}
