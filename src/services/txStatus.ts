import * as walletApi from '@/features/wallet/walletApi';

export type FinalStatus = 'pending' | 'confirmed' | 'completed' | 'failed' | null;

export type PollOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  fetchStatus?: (id: string) => Promise<{ ok: boolean; data?: any; status?: number; error?: unknown }>;
};

export function startTxPolling(
  id: string,
  onUpdate: (status: FinalStatus) => void,
  onDone: (finalStatus: FinalStatus) => void,
  opts: PollOptions = {}
): { stop: () => void } {
  const { maxAttempts = 30, baseDelayMs = 2000, maxDelayMs = 8000, fetchStatus = walletApi.getTxStatus } = opts;
  let attempts = 0;
  let stopped = false;
  let timer: number | null = null;

  const clear = () => {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  const stop = () => {
    stopped = true;
    clear();
  };

  const tick = async () => {
    if (stopped) return;
    attempts += 1;
    try {
      const res = await fetchStatus(id as string) as any;
      if (res && res.ok) {
        const s = (res.data?.tx_status || res.data?.status) ?? null;
        const normalized = (typeof s === 'string' ? (s as FinalStatus) : null);
        onUpdate(normalized);
        if (normalized === 'confirmed' || normalized === 'completed' || normalized === 'failed') {
          stop();
          onDone(normalized);
          return;
        }
      }
    } catch (e) {
      // ignore transient errors
    }

    if (attempts >= maxAttempts) {
      stop();
      onDone(null);
      return;
    }

    const delay = Math.min(maxDelayMs, baseDelayMs + attempts * 500);
    timer = window.setTimeout(tick, delay);
  };

  // start immediately
  void tick();

  return { stop };
}
