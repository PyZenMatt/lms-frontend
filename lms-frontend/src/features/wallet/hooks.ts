import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClientInstance';
import { withdraw } from '@/features/wallet/walletApi';

export function useWithdraw() {
  return useMutation({
    mutationFn: async ({ amount, metamask_address }: { amount: string; metamask_address?: string }) => {
      const res = await withdraw(amount, metamask_address);
      if (!res.ok) throw res.error ?? new Error('Withdraw failed');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet","balance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet","txs"] });
      // also trigger the global refresh hook (if present)
      void window.__wallet_refresh__?.();
    },
  });
}

export default useWithdraw;
