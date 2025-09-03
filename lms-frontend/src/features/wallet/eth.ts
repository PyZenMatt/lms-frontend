/* eslint-disable @typescript-eslint/no-explicit-any */
// Minimal helper wrappers around window.ethereum for chain switching, account request and personal_sign
declare global {
  interface Window {
    ethereum?: unknown;
  }
}

export async function ensureChain(chainIdHex: string, rpcUrl?: string): Promise<{ ok: true } | { ok: false; error: unknown }> {
  if (!window.ethereum) return { ok: false, error: new Error('No web3 provider') };
  try {
  // @ts-expect-error access ethereum provided by wallet
  const current = await (window.ethereum as any).request({ method: 'eth_chainId' });
    if (String(current).toLowerCase() === String(chainIdHex).toLowerCase()) return { ok: true };
    // try to switch
    try {
      await (window.ethereum as any).request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chainIdHex }] });
      return { ok: true };
    } catch (switchErr: any) {
      // 4902 chain not found -> try to add
      const errCode = (switchErr as any)?.code ?? (switchErr as any)?.error?.code;
      if (errCode === 4902 && rpcUrl) {
        try {
          await (window.ethereum as any).request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: chainIdHex, rpcUrls: [rpcUrl], chainName: 'Amoy Testnet' }],
          });
          return { ok: true };
        } catch (addErr) {
          return { ok: false, error: addErr };
        }
      }
      return { ok: false, error: switchErr };
    }
  } catch (e) {
    return { ok: false, error: e };
  }
}

export async function requestAccounts(): Promise<{ ok: true; address: string } | { ok: false; error: unknown }> {
  if (!window.ethereum) return { ok: false, error: new Error('No web3 provider') };
  try {
    const accounts: string[] = await (window.ethereum as any).request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) return { ok: false, error: new Error('No accounts returned') };
    return { ok: true, address: accounts[0] };
  } catch (e) {
    return { ok: false, error: e };
  }
}

export async function personalSign(message: string, address: string): Promise<{ ok: true; signature: string } | { ok: false; error: unknown }> {
  if (!window.ethereum) return { ok: false, error: new Error('No web3 provider') };
  try {
    const eth = (window.ethereum as any);
    // Ensure the wallet has the desired account selected
    try {
      await eth.request({ method: 'eth_requestAccounts' });
    } catch {
      // ignore - user might have already approved
    }

    // Try the common ordering first (message, address)
    try {
      const sig = await eth.request({ method: 'personal_sign', params: [message, address] });
      console.debug('personalSign: used params [message,address]', { address, sig });
      return { ok: true, signature: sig };
  } catch {
      // Fallback: some providers expect [address, message]
      try {
        const sig2 = await eth.request({ method: 'personal_sign', params: [address, message] });
        console.debug('personalSign: used params [address,message] fallback', { address, sig: sig2 });
        return { ok: true, signature: sig2 };
      } catch (e2) {
        return { ok: false, error: e2 };
      }
    }
  } catch (e) {
    return { ok: false, error: e };
  }
}
