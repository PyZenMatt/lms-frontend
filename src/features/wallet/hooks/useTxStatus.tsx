import { useState, useRef, useEffect } from 'react';
import { startTxPolling, type FinalStatus } from '@/services/txStatus';

export type TxStatus = FinalStatus;

export function useTxStatus() {
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [status, setStatus] = useState<TxStatus>(null);
  const pollRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => () => { pollRef.current?.stop(); }, []);

  const stop = () => {
    pollRef.current?.stop();
    pollRef.current = null;
  };

  const start = (id: string) => {
    stop();
    setIdentifier(id);
    setStatus('pending');
    pollRef.current = startTxPolling(id, (s) => setStatus(s), (final) => {
      setStatus(final);
      pollRef.current = null;
    });
  };

  return { identifier, status, start, stop, isPolling: !!pollRef.current } as const;
}

export default useTxStatus;
