// src/components/PriceBreakdown.tsx
import React from "react";
import type { PaymentSummary } from "../services/payments";

const fmtEUR = (v?: number) =>
  typeof v === "number"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(v)
    : "—";

const fmtTEO = (v?: number) => {
  if (typeof v !== 'number') return '\u2014'
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v)
}

export default function PriceBreakdown({ summary }: { summary: PaymentSummary }) {
  const price = summary.price_eur;
  const total = summary.total_eur ?? price;
  const discountPercent = typeof summary.discount_percent === "number" ? summary.discount_percent : undefined;
  // Prefer explicit euro discount: price - total. Fall back to discount_percent*price if needed.
  const discountEUR = (() => {
    const priceNum = typeof price === 'number' ? price : undefined
    const totalNum = typeof total === 'number' ? total : undefined
    if (priceNum !== undefined && totalNum !== undefined) return priceNum - totalNum
    if (priceNum !== undefined && typeof discountPercent === 'number') return priceNum * (discountPercent / 100)
    return undefined
  })()
  const hasDiscount = typeof discountEUR === 'number' && discountEUR > 0

  return (
    <div className="rounded-2xl border p-4">
      <h3 className="text-lg font-semibold">Riepilogo pagamento</h3>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span>Prezzo</span>
          <span>{fmtEUR(price)}</span>
        </div>

        {hasDiscount && (
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span>Sconto</span>
            <span>-{fmtEUR(discountEUR)}</span>
          </div>
        )}

        {typeof summary.teo_required === "number" && (
          <div className="flex items-center justify-between">
            <span>TEO richiesti</span>
            <span>{fmtTEO(summary.teo_required)} TEO</span>
          </div>
        )}

        <div className="mt-2 border-t pt-2 text-base font-medium">
          <div className="flex items-center justify-between">
            <span>Totale</span>
            <span>{fmtEUR(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
