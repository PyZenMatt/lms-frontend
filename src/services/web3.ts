// WARNING: EIP-1193 helpers only — do NOT import HTTP/DB services (e.g. '@/services/wallet')
// or perform fetch/axios calls here. Keep this file strictly for provider-level helpers
// (connect, ensureChain, sendTx) and lightweight formatters. Server REST belongs in
// `features/wallet/walletApi.ts` and low-level contract helpers in `services/ethersWeb3.ts`.
//
// This guard helps enforce the DB vs on-chain separation.
// Minimal, single implementation for EIP-1193 provider helpers.
export function ensureProvider(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { ethereum?: { request?: (opts: unknown) => Promise<unknown> } };
  return !!(w.ethereum && typeof w.ethereum.request === "function");
}

export function shortAddress(a?: string | null) {
  if (!a) return "";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export async function connectWallet(): Promise<{ ok: boolean; address?: string; error?: unknown }> {
  if (!ensureProvider()) return { ok: false, error: "no provider" };
  try {
  const w = window as unknown as { ethereum: { request: (opts: unknown) => Promise<unknown> } };
    const accs = await w.ethereum.request({ method: "eth_requestAccounts" });
    if (Array.isArray(accs) && accs.length) return { ok: true, address: String(accs[0]) };
    if (typeof accs === "string") return { ok: true, address: accs };
    return { ok: false, error: "no accounts returned" };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function ensureChain(chainIdHex: string, rpcUrl?: string): Promise<{ ok: boolean; switched?: boolean; error?: unknown }> {
  if (!ensureProvider()) return { ok: false, error: "no provider" };
  try {
  const w = window as unknown as { ethereum: { request: (opts: unknown) => Promise<unknown> } };
    const current = await w.ethereum.request({ method: "eth_chainId" });
    if (String(current) === String(chainIdHex)) return { ok: true, switched: false };
    try {
      await w.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] });
      return { ok: true, switched: true };
    } catch (switchErr) {
      // 4902 — chain not added
  const maybeCode = (switchErr as unknown as Record<string, unknown>)?.code;
      if (maybeCode === 4902 && rpcUrl) {
        try {
          await w.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chainIdHex,
                chainName: "Polygon Amoy",
                nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
                rpcUrls: [rpcUrl],
                blockExplorerUrls: [],
              },
            ],
          });
          return { ok: true, switched: true };
        } catch (addErr) {
          return { ok: false, error: addErr };
        }
      }
      return { ok: false, error: switchErr };
    }
  } catch (err) {
    return { ok: false, error: err };
  }
}

type SendTxInput = { to: string; data?: string | null; value?: string | null };
export async function sendTx(input: SendTxInput): Promise<{ ok: boolean; hash?: string; status?: "success" | "failed"; error?: unknown }> {
  if (!ensureProvider()) return { ok: false, error: "no provider" };
  try {
  const w = window as unknown as { ethereum: { request: (opts: unknown) => Promise<unknown> } };
    const params: Record<string, unknown> = { to: input.to };
    if (input.data) params.data = input.data;
    if (input.value) params.value = input.value;
    const txHash = (await w.ethereum.request({ method: "eth_sendTransaction", params: [params] })) as string;
    // simple polling for receipt
    const start = Date.now();
    const timeout = 2 * 60 * 1000;
    while (Date.now() - start < timeout) {
      const receipt = await w.ethereum.request({ method: "eth_getTransactionReceipt", params: [txHash] });
      if (receipt) {
  const status = (((receipt as unknown) as Record<string, unknown>).status === "0x1" || ((receipt as unknown) as Record<string, unknown>).status === 1) ? "success" : "failed";
        return { ok: status === "success", hash: txHash, status };
      }
      await new Promise((r) => setTimeout(r, 3500));
    }
    return { ok: false, hash: txHash, status: "failed", error: "timeout" };
  } catch (err) {
    return { ok: false, error: err };
  }
}

