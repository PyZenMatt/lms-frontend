import { useEffect, useState } from "react";
import { getWallet, type WalletInfo } from "../../services/wallet";
import { previewDiscount, confirmDiscount } from "../../services/payments";

type Props = {
  priceEUR: number;
  courseId?: number;
  // onApply ora riceve anche idempotency_key per tracciarlo lato checkout
  onApply: (finalPriceEUR: number, discountEUR: number, details?: Record<string, unknown>) => void;
  onReceipt?: (receipt: {
    final_price_eur: number;
    discount_eur: number;
    teo_spent?: number;
    stripe_client_secret?: string;
    order_id?: string | number;
  }) => void;
  // refetch callback (per aggiornar e saldo/movimenti post esito)
  onRefreshAfterSuccess?: () => Promise<void> | void;
};

export default function TeoDiscountWidget({ priceEUR, courseId, onApply, onRefreshAfterSuccess }: Props) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [eligible, setEligible] = useState<boolean | null>(null);
  // result will contain server-side breakdown from previewDiscount
  const [checking, setChecking] = useState(false);
  // options are fixed TEO amounts the user can spend
  const options = [5, 10, 15];
  // TEO per 1 EUR (frontend config via Vite). Only use if explicitly provided by env/window.
  // Do NOT assume a default conversion rate here; showing TEO without a known rate
  // may confuse users (and previously caused 1:1 or 1:10 mixups).
  let TEO_PER_EUR: number | undefined = undefined
  try {
    const win = window as unknown as Record<string, unknown>
    const wenv = (win['__ENV'] as Record<string, unknown> | undefined)
    const fromWin = wenv && typeof wenv.VITE_TEO_EUR_RATE === 'string' ? Number(wenv.VITE_TEO_EUR_RATE) : undefined
    const fromMeta = typeof (import.meta as { env?: Record<string, string> }).env?.VITE_TEO_EUR_RATE === 'string' ? Number((import.meta as { env?: Record<string, string> }).env!.VITE_TEO_EUR_RATE) : undefined
    if (Number.isFinite(fromWin as number)) TEO_PER_EUR = fromWin
    else if (Number.isFinite(fromMeta as number)) TEO_PER_EUR = fromMeta
  } catch {
    // ignore and leave undefined
  }
  const [selectedPct, setSelectedPct] = useState<number | null>(null);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    // If price, course or selected percent change, clear previous check/apply result to avoid stale teo_required
    setResult(null);
    setApplied(false);
  }, [priceEUR, selectedPct, courseId]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      const w = await getWallet();
      if (!alive) return;
      if (w.ok) setWallet(w.data);
      else setError(`Wallet error: ${w.status}`);
      setLoading(false);
    }
    load();
    return () => { alive = false; };
  }, [courseId, priceEUR]);

  // Ensure selected discount is still affordable when wallet, price, or TEO rate changes.
  // Ensure selected TEO amount is still affordable when wallet changes.
  useEffect(() => {
    if (selectedPct === null) return;
    const availableTEO = (typeof wallet?.balance_teo === 'number') ? wallet!.balance_teo : 0
    if (availableTEO < selectedPct) {
      setSelectedPct(null)
      setResult(null)
      setEligible(false)
    }
  }, [wallet, selectedPct]);

  async function handleCheck() {
    setChecking(true);
    setError(null);
    // If user selected a fixed TEO amount, prefer sending tokens_to_spend.
    const payload: { price_eur: number; course_id?: number; discount_percent?: number; tokens_to_spend?: number; [k: string]: unknown } = { price_eur: priceEUR };
    if (courseId) payload.course_id = courseId;
    if (selectedPct) {
      // selectedPct stores fixed TEO amount. Send tokens_to_spend.
      payload.tokens_to_spend = selectedPct;
      // Derive discount_percent from tokens using known rate when available.
      // Fallback to rate=1.0 to match backend default RATE_TEOCOIN_EUR when front-end rate not provided.
      const rate = (typeof TEO_PER_EUR === 'number' && Number.isFinite(TEO_PER_EUR)) ? TEO_PER_EUR : 1.0
      const discountEUR = Number(selectedPct) / Number(rate)
      if (Number.isFinite(discountEUR) && discountEUR > 0 && Number.isFinite(priceEUR) && priceEUR > 0) {
        payload.discount_percent = Math.round((discountEUR / priceEUR) * 10000) / 100
      }
    }
    console.debug('[TeoDiscountWidget] preview payload:', payload);
    const res = await previewDiscount(payload);
    console.debug('[TeoDiscountWidget] preview response:', res);
    setChecking(false);
    if (!res.ok) {
      setError(`Verifica sconto fallita (${res.status})`);
      return;
    }
    // res.data is our DiscountBreakdown shape from the server
    setResult(res.data as Record<string, unknown>);
    // server-side eligible/tokens_required/balance (prefer data object)
    try {
      const data = res.data as unknown as Record<string, unknown> | undefined
  const tokensReq = data ? (data['tokens_required'] ?? data['teo_required'] ?? data['teacher_teo']) : undefined
      const elig = data ? data['eligible'] : undefined
      setEligible(Boolean(tokensReq === undefined ? true : Boolean(elig)));
    } catch {
      setEligible(null);
    }
  }
  async function handleApply() {
    if (!result) return;
    setError(null);
    setApplying(true);
    // propagate server-provided breakdown via onApply. Parent will call createPaymentIntent with discount flags.
  // finalPrice is computed later from server response when needed; avoid local unused var
      try {
      // First, try to persist the preview as a discount snapshot on the server so the flow is idempotent
      // and teachers can be notified. We call confirmDiscount which is safe to call multiple times.
      try {
        // backend requires an order_id on confirm; frontend generates a lightweight id so the snapshot
        // can be created before the Stripe PaymentIntent exists. The PaymentReturn flow will call
        // confirmDiscount again with the real order_id (payment intent) and be idempotent.
          // Derive discount_percent from server preview result when possible
          const previewStudentPay = Number(result['student_pay_eur'] ?? result['student_pay'] ?? NaN)
          let derivedDiscountPercent: number | undefined = undefined
          if (Number.isFinite(previewStudentPay)) {
            const discountEUR = Number(priceEUR) - previewStudentPay
            if (Number.isFinite(discountEUR) && discountEUR > 0 && Number.isFinite(priceEUR) && priceEUR > 0) {
              derivedDiscountPercent = Math.round(((discountEUR / priceEUR) * 100) * 100) / 100
            }
          }
          // fallback: derive from selectedPct interpreted as TEO amount using rate (fallback 1.0)
          if (derivedDiscountPercent === undefined && typeof selectedPct === 'number') {
            const rate = (typeof TEO_PER_EUR === 'number' && Number.isFinite(TEO_PER_EUR)) ? TEO_PER_EUR : 1.0
            const discountEUR = Number(selectedPct) / Number(rate)
            if (Number.isFinite(discountEUR) && discountEUR > 0 && Number.isFinite(priceEUR) && priceEUR > 0) {
              derivedDiscountPercent = Math.round(((discountEUR / priceEUR) * 100) * 100) / 100
            }
          }

          const payload: Record<string, unknown> = {
            order_id: `local_${Date.now()}`,
            course_id: courseId,
            price_eur: priceEUR,
            discount_percent: derivedDiscountPercent,
            breakdown: result,
            // include tokens_to_spend from server preview when available, otherwise the selected TEO amount
            tokens_to_spend: result && (result['tokens_required'] ?? result['teo_required'] ?? result['teacher_teo']) ? Number(result['tokens_required'] ?? result['teo_required'] ?? result['teacher_teo']) : (typeof selectedPct === 'number' ? selectedPct : undefined),
          };
        console.debug('[TeoDiscountWidget] confirming discount snapshot with payload:', payload)
        const conf = await confirmDiscount(payload)
        console.debug('[TeoDiscountWidget] confirmDiscount response:', conf)
        if (!conf.ok) {
          // If backend explicitly returned 400 INSUFFICIENT_TOKENS, reset selection and show message
          if (conf.status === 400 && conf.error === 'INSUFFICIENT_TOKENS') {
            setError('Saldo insufficiente per applicare lo sconto. Seleziona un altro valore.');
            setSelectedPct(null);
            setResult(null);
            setEligible(false);
            // Ask parent to refresh wallet/balance if provided
            if (onRefreshAfterSuccess) {
              try { void onRefreshAfterSuccess(); } catch { /* ignore */ }
            }
            return;
          }
          setError(`Impossibile registrare lo sconto: HTTP ${conf.status}`)
        } else {
          // Prefer server-side breakdown values when available (they are the source of truth).
          // The server may return breakdown in several shapes; attempt to parse common variants.
          const serverBreakdown: unknown = (conf.data && (conf.data.breakdown ?? conf.data.snapshot ?? conf.data)) || null;

          // helper to read nested numeric fields safely
          const readNumber = (obj: unknown, ...keys: string[]) => {
            const map = (obj && typeof obj === 'object') ? (obj as Record<string, unknown>) : undefined
            for (const k of keys) {
              if (!map) continue
              const v = map[k]
              if (v === undefined || v === null) continue
              // if value is an object that wraps the real value (like { source, parsedValue }) dig deeper
              if (typeof v === 'object') {
                const vmap = v as Record<string, unknown>
                if ('parsedValue' in vmap) return Number(vmap['parsedValue'])
                if ('source' in vmap) {
                  const n = Number(vmap['source'])
                  if (!Number.isNaN(n)) return n
                }
                // try common nested locations
                if ('data' in vmap) {
                  const n = Number((vmap['data'] as unknown) as number)
                  if (!Number.isNaN(n)) return n
                }
                continue
              }
              const n = Number(v)
              if (!Number.isNaN(n)) return n
            }
            return undefined
          }

          let finalFromServer = readNumber(serverBreakdown, 'student_pay_eur', 'student_pay', 'final_price_eur')
          // sometimes serverBreakdown.raw.data.student_pay_eur
          if (finalFromServer === undefined && serverBreakdown && typeof serverBreakdown === 'object') {
            const sb = serverBreakdown as Record<string, unknown>
            if (sb['raw'] && typeof sb['raw'] === 'object') {
              const raw = sb['raw'] as Record<string, unknown>
              if (raw['data'] && typeof raw['data'] === 'object') {
                finalFromServer = readNumber(raw['data'], 'student_pay_eur', 'student_pay')
              }
            }
          }

          let final = Number(result['student_pay_eur'] ?? result['student_pay'] ?? priceEUR)
          if (finalFromServer !== undefined && Number.isFinite(finalFromServer)) final = finalFromServer

          // compute discount eur from server value if available
          let discountComputed = Number(priceEUR) - final
          if (!Number.isFinite(discountComputed) || discountComputed === 0) {
            // try server-provided discount if present
            const serverDiscount = readNumber(serverBreakdown, 'discount_eur', 'discount_amount')
            if (serverDiscount !== undefined && Number.isFinite(serverDiscount)) discountComputed = serverDiscount
          }

          const detailsWithSnapshot = {
            breakdown: serverBreakdown ?? result,
            snapshot: conf.data.snapshot ?? null,
            // normalized helpers expected by CourseCheckout
            final_price_eur: final,
            discount_eur: discountComputed,
          } as Record<string, unknown>

          onApply(final, discountComputed, detailsWithSnapshot)
          setApplied(true)
          setError(null)
          // persist a normalized breakdown in local state so it won't be the full wrapper later
          try {
            setResult((r) => ({ ...(r ?? {}), _snapshot: conf.data.snapshot ?? null, ...((serverBreakdown && typeof serverBreakdown === 'object') ? serverBreakdown : {}) }))
          } catch {
            // ignore
          }
          return
        }
      } catch (e) {
        console.debug('confirmDiscount failed:', e)
        setError(String(e))
      }

  // If confirmDiscount failed we must NOT proceed to payment here.
  // The onApply call above is only performed on successful confirm (see branch above).
    } catch (e) {
      setError(String(e));
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Sconto con TEO</div>
          <div className="text-base">Prezzo corrente: <span className="font-semibold text-foreground">{priceEUR.toFixed(2)} EUR</span></div>
        </div>
  {loading ? (
          <div className="h-6 w-24 animate-pulse rounded bg-muted/20" />
        ) : (
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Saldo TEO</div>
      <div className="font-semibold text-foreground">{wallet && typeof wallet.balance_teo === 'number' ? wallet.balance_teo.toFixed(8) : "--"} TEO</div>
          </div>
        )}
      </div>

      {/* Disable entire widget until wallet loaded or wallet fetch errored */}
      {(!loading && wallet === null) && (
        <div className="mt-2 text-sm text-muted-foreground">Wallet non disponibile. Ricarica o effettua il login per usare TEO.</div>
      )}

      {error && <div className="mt-3 rounded border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive-foreground">{error}</div>}

      <div className="mt-4">
        <div className="text-sm mb-2 text-foreground">Scegli sconto TEO</div>
        <div className="flex gap-2">
      {options.map((pct) => {
      const discountEUR = Number((priceEUR * pct) / 100)
      // convert EUR discount to TEO required only when an explicit rate is configured
      const teoNeeded = (typeof TEO_PER_EUR === 'number' && Number.isFinite(TEO_PER_EUR)) ? (discountEUR * TEO_PER_EUR) : undefined
  const availableTEO = (typeof wallet?.balance_teo === 'number') ? wallet!.balance_teo : 0
  // If we don't have a reliable TEO rate, don't disable options based on TEO balance
  const disabled = typeof teoNeeded === 'number' ? (availableTEO < teoNeeded) : false
      const fmtTEO = (v?: number) => {
        if (v === undefined) return '\u2014'
        return Number(v).toFixed(v % 1 === 0 ? 0 : 2)
      }
      const title = disabled ? `Saldo TEO insufficiente: servono ${fmtTEO(teoNeeded)} TEO` : undefined
      return (
              <button
                key={pct}
                onClick={() => { if (!disabled) setSelectedPct(pct) }}
                disabled={loading || disabled}
                title={title}
                className={`rounded-lg px-3 py-2 text-sm border disabled:opacity-50 ${selectedPct === pct ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'}`}
              >
        {pct}% {disabled ? '(non disponibile)' : (typeof teoNeeded === 'number' ? `-\t${discountEUR.toFixed(2)} / ${fmtTEO(teoNeeded)} TEO` : `-\t${discountEUR.toFixed(2)}`)}
              </button>
            )
          })}
        </div>


        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleCheck}
            disabled={loading || checking}
            className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60"
          >
            {checking ? 'Verifico...' : 'Verifica sconto TEO'}
          </button>
          {result && (
            <button
              onClick={handleApply}
              disabled={applying || eligible === false}
              title={eligible === false ? 'Saldo TEO insufficiente per applicare lo sconto' : undefined}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground disabled:opacity-60"
            >
              {applying ? 'Applico...' : applied ? 'Applicato' : 'Applica sconto'}
            </button>
          )}
        </div>
      </div>

      {applied && result && (
        <div className="mt-4 rounded-lg border border-border bg-popover p-3 text-sm text-foreground">
              {(() => {
                const studentPay = Number(result['student_pay_eur'] ?? result['student_pay'] ?? priceEUR);
                const discount = Number.isFinite(Number(priceEUR - studentPay)) ? Number(priceEUR - studentPay) : Number(result['discount_eur'] ?? 0);
                const teoReq = Number(result['teacher_teo'] ?? result['teacher_teocoin'] ?? result['teo_required'] ?? 0);
                return (
                  <>
                    <div className="flex justify-between"><span>Sconto:</span><span>-{discount.toFixed(2)} EUR</span></div>
                    <div className="flex justify-between"><span>TEO richiesti:</span><span>{teoReq.toFixed(8)} TEO</span></div>
                    <div className="flex justify-between font-semibold"><span>Totale finale:</span><span>{studentPay.toFixed(2)} EUR</span></div>
                  </>
                )
              })()}
        </div>
      )}
    </div>
  );
}
