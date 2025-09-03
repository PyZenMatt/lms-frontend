/* eslint-disable @typescript-eslint/no-explicit-any */
// On-chain adapter: low-level MetaMask/ethers helpers.
// This file lives under `src/web3/` (on-chain layer). Do NOT import DB services here.
import { ensureProvider } from '@onchain/web3';
import TEOCOIN_ABI, { CONTRACT_ADDRESS } from '@/web3/teocoin_abi';
import type { BigNumberish } from 'ethers';

export function toWei(amountStr: string): bigint {
  const s = String(amountStr).trim();
  if (!s) throw new Error('invalid amount');
  const norm = s.replace(/,/g, '.');
  if (!/^-?\d*(?:\.\d*)?$/.test(norm)) throw new Error('invalid amount');
  const parts = norm.split('.');
  const whole = parts[0] || '0';
  const frac = (parts[1] || '').slice(0, 18).padEnd(18, '0');
  const combined = BigInt(whole || '0') * 10n ** 18n + BigInt(frac || '0');
  if (combined <= 0n) throw new Error('amount must be > 0');
  return combined;
}

async function getProvider(): Promise<any | null> {
  if (!ensureProvider()) return null;
  const ethers = await import('ethers');
  return new ethers.BrowserProvider((window as any).ethereum);
}

export async function mintTokens(_to: string, _amount: string | bigint): Promise<{ ok: true; hash: string } | { ok: false; error: string }> {
  return { ok: false, error: 'client_mint_forbidden: use server-side /api/onchain/mint' };
}

export async function getEthBalance(_address: string): Promise<never> {
  throw new Error('On-chain balance reads are disabled in frontend. Use DB balance via services/wallet.getWallet()');
}

export async function getTokenBalance(_contract: any, _address: string): Promise<never> {
  throw new Error('On-chain token balance reads are disabled in frontend. Use DB balance via services/wallet.getWallet()');
}

export async function burnTokens(amount: string | bigint): Promise<{ ok: true; hash: string } | { ok: false; error: string }> {
  if (!ensureProvider()) return { ok: false, error: 'no provider' };
  try {
    const ethers = await import('ethers');
    const provider = await getProvider();
    if (!provider) return { ok: false, error: 'no provider' };
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, TEOCOIN_ABI, signer);
    const decimals: number = Number(await contract.decimals());
    const value = typeof amount === 'bigint' ? amount : ethers.parseUnits(String(amount), decimals);
    const tx = await contract.burn(value as BigNumberish);
    return { ok: true, hash: tx.hash };
  } catch (errUnknown) {
    const e = errUnknown as Record<string, unknown>;
    const code = (e && (e as any).code) ?? ((e as any).error && (e as any).error.code);
    if (code === 4001 || code === 'ACTION_REJECTED') return { ok: false, error: 'user_rejected' };
    const msg = typeof (e as any)?.message === 'string' ? (e as any).message : String(errUnknown);
    return { ok: false, error: msg };
  }
}
