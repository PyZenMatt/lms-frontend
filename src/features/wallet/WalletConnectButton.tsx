import React, { useState } from 'react';
import { ensureChain, requestAccounts, personalSign } from './eth';
import { getChallenge, linkWallet } from './walletApi';
import { showToast } from '@/lib/api';

const CHAIN = (import.meta as any)?.env?.VITE_CHAIN_ID ?? '0x13882';
const RPC = (import.meta as any)?.env?.VITE_RPC_URL_AMOY ?? undefined;

export default function WalletConnectButton() {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);

  async function handleConnect() {
    setError(null);
    setLoading(true);
    try {
      const chainRes = await ensureChain(String(CHAIN), RPC);
      console.debug('ensureChain', chainRes);
      if (!chainRes.ok) throw chainRes.error ?? new Error('Chain switch failed');

      const acc = await requestAccounts();
      if (!acc.ok) throw acc.error ?? new Error('No accounts');
      const addr = acc.address;
      setAddress(addr);

      // fetch challenge
  const chall = await getChallenge();
      console.debug('challenge', chall);
      if (!chall.ok) throw new Error('Challenge failed: ' + String(chall.error ?? chall.status));

  // Prefer server-provided message to avoid mismatches
  const message = chall.data.message ?? `Sign this one-time nonce: ${chall.data.nonce}`;

      // sign
      const sig = await personalSign(message, addr);
      if (!sig.ok) throw sig.error ?? new Error('Signing failed');

  // link
  console.debug('wallet connect: signing payload', { message, address: addr, signature: sig.signature });
  const linkedRes = await linkWallet(addr, sig.signature);
      console.debug('link', linkedRes);
      if (!linkedRes.ok) {
        const e = linkedRes.error ?? linkedRes.status;
        throw e;
      }

      // Success shape: linkedRes.ok === true and data.wallet_address provided
      if (linkedRes.data && (linkedRes.data.wallet_address || linkedRes.data.wallet_address === '')) {
        setLinked(true);
        showToast({ variant: 'success', message: 'Wallet collegato ✅' });
        // notify other parts of the app
        try {
          window.dispatchEvent(new CustomEvent('wallet:updated'));
        } catch (err) {
          console.warn('wallet update dispatch failed', err);
        }
      } else {
        // unexpected shape
        throw new Error(String(linkedRes.data?.message ?? 'link failed'));
      }
    } catch (e: any) {
      console.error('wallet connect error', e);
      const msg = e?.message ? String(e.message) : String(e);
      setError(msg);
      showToast({ variant: 'error', message: 'Errore collegamento wallet: ' + msg });
    } finally {
      setLoading(false);
    }
  }

  if (linked) return <div className="text-sm text-green-700">Wallet collegato ✅</div>;

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
