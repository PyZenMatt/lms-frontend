import React from 'react';

type Props = {
  paymentSummary?: string;
};

export const GoodPresentational: React.FC<Props> = ({ paymentSummary }) => {
  return <div>Payment summary: {paymentSummary ?? '—'}</div>;
};
