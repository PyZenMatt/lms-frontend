import { useQuery } from '@tanstack/react-query'
import { getPendingDiscountSnapshots } from '@/services/rewards'

export function usePendingDiscounts() {
  return useQuery({
    queryKey: ['pendingDiscounts'],
    queryFn: async () => {
      const res = await getPendingDiscountSnapshots()
      if (!res.ok) throw res.error || new Error('Failed to load pending discounts')
      return res.data
    },
    staleTime: 1000 * 30,
    retry: 1,
  })
}
