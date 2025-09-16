import React from 'react'

export type PaymentSummaryProps = {
  userId: number
  total?: number
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({ userId, total }) => {
  return (
    <div>
      <h3>Payments for user {userId}</h3>
      <div>Total: {total ?? '—'}</div>
    </div>
  )
}

export default PaymentSummary
