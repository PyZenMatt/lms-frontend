import React, { useEffect, useState } from 'react'
import { getPaymentSummary } from '@/services/payments'
import PaymentSummary from '@/ui/PaymentSummary'

export const PaymentSummaryContainer: React.FC<{ userId: number }> = ({ userId }) => {
  const [total, setTotal] = useState<number | undefined>(undefined)

  useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        const res = await getPaymentSummary(userId)
        if (!mounted) return
        if (res && (res as any).total != null) setTotal((res as any).total)
      } catch (e) {
        console.error('failed loading payment summary', e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [userId])

  return <PaymentSummary userId={userId} total={total} />
}

export default PaymentSummaryContainer
