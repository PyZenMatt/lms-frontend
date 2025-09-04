// src/components/checkout/ReceiptCard.tsx
type Receipt = {
  final_price_eur: number;
  discount_eur: number;
  teo_spent?: number;
  stripe_client_secret?: string;
  order_id?: string | number;
  created_at?: string;
  status?: "pending" | "accepted" | "rejected";
  deadline_at?: string;
  teacher_bonus_teo?: number;
};

function formatEUR(v: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}

function formatTEO(v: number) {
  return Number(v).toFixed(8)
}

export default function ReceiptCard({ r }: { r: Receipt }) {
  return (
  <div className="rounded-lg border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Ricevuta</div>
        {r.status === 'pending' && <div className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">In attesa di accettazione (24h)</div>}
        {r.status === 'accepted' && <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Accettato</div>}
        {r.status === 'rejected' && <div className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">Rifiutato</div>}
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between"><span>Prezzo finale</span><span className="font-medium">{formatEUR(r.final_price_eur)}</span></div>
  <div className="flex justify-between"><span>Sconto</span><span className="text-emerald-700">-{formatEUR(r.discount_eur)}</span></div>
        {typeof r.teo_spent === "number" && (
          <div className="flex justify-between"><span>TEO spesi</span><span>{formatTEO(r.teo_spent)} TEO</span></div>
        )}
        {typeof r.teacher_bonus_teo === 'number' && (
          <div className="flex justify-between"><span>Bonus docente</span><span>{formatTEO(r.teacher_bonus_teo)} TEO</span></div>
        )}
        {r.order_id && <div className="flex justify-between"><span>Ordine</span><span className="font-mono">{String(r.order_id)}</span></div>}
  {r.deadline_at && <div className="text-xs text-muted-foreground">Scadenza decisione: {new Date(r.deadline_at).toLocaleString()}</div>}
  {r.created_at && <div className="text-xs text-muted-foreground">Data: {new Date(r.created_at).toLocaleString()}</div>}
      </div>
    </div>
  );
}
