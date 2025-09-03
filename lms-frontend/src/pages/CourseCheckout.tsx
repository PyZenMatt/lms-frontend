// src/pages/CourseCheckout.tsx
import React from "react"
import { useParams, Link } from "react-router-dom"
import { getPaymentSummary, createPaymentIntent, previewDiscount } from "../services/payments"
import { getCourse } from "../services/courses"
import { loadStripe } from "@stripe/stripe-js"
import type { Stripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import TeoDiscountWidget from "../components/checkout/TeoDiscountWidget"
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

type SummaryState = {
  price_eur?: number
  discount_percent?: number
  total_eur?: number
  teo_required?: number
  currency?: string
}

function maskKey(pk?: string | null) {
  if (!pk) return "(none)"
  if (pk.length <= 10) return pk
  return `${pk.slice(0, 10)}…${pk.slice(-4)}`
}

function getPublishableKeyFromEnv(): string | null {
  // preferisci .env Vite
  const metaEnv = (import.meta as { env?: Record<string, string> }).env
  const winEnv = (window as unknown as Record<string, string | undefined>)
  const pk = metaEnv?.VITE_STRIPE_PUBLISHABLE_KEY || winEnv?.VITE_STRIPE_PUBLISHABLE_KEY
  return typeof pk === "string" ? pk : null
}

export default function CourseCheckout() {
  const { id } = useParams<{ id: string }>()
  
  const courseId = Number(id)

  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState<null | "card" | "teo">(null)
  const [error, setError] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState<string>("")
  const [summary, setSummary] = React.useState<SummaryState>({})

  // Stripe state
  const [clientSecret, setClientSecret] = React.useState<string | null>(null)
  const [publishableKey, setPublishableKey] = React.useState<string | null>(null)

  // (discount override stored directly on summary via setSummary in onApply)
  const [teoDiscountApplied, setTeoDiscountApplied] = React.useState<boolean>(false)
  const [discountBreakdown, setDiscountBreakdown] = React.useState<Record<string, unknown> | null>(null)

  // wallet address not needed during checkout

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      const [s, c] = await Promise.all([getPaymentSummary(courseId), getCourse(courseId)])
      if (!mounted) return
      if (s.ok) {
        setSummary({
          price_eur: s.data.price_eur,
          discount_percent: s.data.discount_percent,
          total_eur: s.data.total_eur,
          teo_required: s.data.teo_required,
          currency: s.data.currency || "EUR",
        })
        // If backend didn't provide a full breakdown, request a preview (server-truth)
        try {
          const needsPreview = !(s.data.raw && (s.data.raw.breakdown || s.data.raw.discount))
          if (needsPreview) {
            const pv = await previewDiscount({ price_eur: s.data.price_eur, course_id: courseId, discount_percent: 0 })
            if (pv.ok) {
              // prefer server's student_pay_eur/teo values
              setSummary((old) => ({
                ...old,
                total_eur: pv.data.student_pay_eur ?? old.total_eur,
                teo_required: pv.data.teacher_teo ?? old.teo_required,
              }))
            }
          }
        } catch (e) {
          console.debug("previewDiscount failed:", e)
        }
      }
  setTitle(c.ok ? (c.data?.title ?? `Corso #${courseId}`) : `Corso #${courseId}`)
      setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [courseId])

  async function onPayCard() {
    setSubmitting("card")
    setError(null)

    // 1) Publishable key (pk_test...) dal .env
    const envPk = getPublishableKeyFromEnv()
    if (!envPk) {
      setSubmitting(null)
      setError(
        "Publishable key Stripe mancante. Aggiungi VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... nel .env e riavvia il dev server."
      )
      return
    }
    if (!/^pk_(test|live)_/.test(envPk)) {
      setSubmitting(null)
      setError(
        "Publishable key non valida. Deve iniziare con pk_test_ (in modalità test) o pk_live_."
      )
      return
    }

    // 2) Creo l'intent sul BE (restituisce client_secret)
    const intentPayload: Record<string, unknown> = {}
    if (summary.discount_percent && summary.discount_percent > 0) {
      // require the discount to be applied via widget before creating intent
      if (!teoDiscountApplied) {
        setSubmitting(null)
        setError("Devi prima applicare lo sconto TEO prima di procedere al pagamento.")
        return
      }
      intentPayload.use_teocoin_discount = true
      intentPayload.discount_percent = summary.discount_percent
      // Source of truth for euro discount: prefer explicit fields (price_eur - total_eur) when available
      if (typeof summary.price_eur === 'number' && typeof summary.total_eur === 'number') {
        intentPayload.discount_eur = summary.price_eur - summary.total_eur
      } else if (typeof summary.price_eur === 'number' && typeof summary.discount_percent === 'number') {
        intentPayload.discount_eur = summary.price_eur * (summary.discount_percent / 100)
      }
    }
    // attach server-provided breakdown when available (backend will prefer explicit values)
    if (discountBreakdown) intentPayload.breakdown = discountBreakdown

    // debug: log payload so we can verify the frontend sends use_teocoin_discount or breakdown
    console.debug("[Checkout] createPaymentIntent payload:", intentPayload)
    const res = await createPaymentIntent(courseId, intentPayload)
    setSubmitting(null)

    if (!res.ok) {
      setError(`Creazione pagamento fallita (HTTP ${res.status})`)
      return
    }
    // Caso Checkout Session → redirect
    if (res.checkout_url) {
      window.location.href = res.checkout_url
      return
    }
    // Caso Payment Intent → Elements
    const pk = res.publishable_key || envPk
    // Debug non sensibile (mascherato)
    console.debug("[Stripe] publishableKey:", maskKey(pk), "clientSecret:", res.client_secret ? "present" : "missing")

    if (res.client_secret && pk) {
      setPublishableKey(pk)
      setClientSecret(res.client_secret)
      return
    }

    setError("Il server non ha fornito dati di pagamento utilizzabili (client_secret assente).")
  }

  // Full TeoCoin payment removed: platform uses TEO only for discounts.

  if (loading)
    return (
      <div className="p-6 flex items-center justify-center">
        <Spinner size={28} className="mr-3 text-neutral-600 dark:text-neutral-300" />
        <div className="text-sm">Caricamento…</div>
      </div>
    )

  const showSummary =
    summary.price_eur !== undefined ||
    summary.total_eur !== undefined ||
    summary.teo_required !== undefined

  const discountEUR = (typeof summary.price_eur === 'number' && typeof summary.total_eur === 'number') ? (summary.price_eur - summary.total_eur) : undefined

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Checkout corso</h1>
        <p className="text-sm opacity-80">
          <Link to={`/courses/${courseId}`} className="underline">
            {title || `Corso #${courseId}`}
          </Link>
        </p>
      </div>

      {error && (
        <Alert variant="error" title="Errore">
          {error}
        </Alert>
      )}

      <div className="rounded-2xl border p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm opacity-70">Riepilogo</div>
          {showSummary ? (
            <>
              {summary.price_eur !== undefined && (
                <div className="text-sm">
                  Prezzo: <b>{summary.price_eur.toFixed(2)} {summary.currency || "EUR"}</b>
                </div>
              )}
              {(summary.discount_percent ?? 0) > 0 && (
                <div className="text-sm text-emerald-700">
                  Sconto {typeof discountEUR === 'number' ? (<><b>-{discountEUR.toFixed(2)} EUR</b> {summary.discount_percent ? `(${summary.discount_percent}% )` : null}</>) : (`${summary.discount_percent}%`)}
                </div>
              )}
              {summary.total_eur !== undefined && (
                <div className="text-sm">
                  Totale: <b>{summary.total_eur.toFixed(2)} {summary.currency || "EUR"}</b>
                </div>
              )}
              {/* Full-TEO payment not supported in checkout; only discounts available */}
            </>
          ) : (
            <div className="text-sm opacity-70">
              Riepilogo non disponibile — puoi procedere al pagamento.
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Teo Discount Widget */}
          <TeoDiscountWidget
            priceEUR={summary.price_eur ?? (summary.total_eur ?? 0)}
            courseId={courseId}
            onApply={(finalPriceEUR, discountEUR, details) => {
              // Normalize returned fields: prefer backend-provided final_price_eur/discount_eur
              const d = (details || {}) as Record<string, unknown>;
              const final = Number(
                (d as Record<string, unknown>)['final_price_eur'] ?? (d as Record<string, unknown>)['finalPriceEUR'] ?? finalPriceEUR ?? summary.price_eur ?? summary.total_eur ?? 0
              );
              const discount = Number(
                (d as Record<string, unknown>)['discount_eur'] ?? (d as Record<string, unknown>)['discountEUR'] ?? discountEUR ?? (typeof summary.price_eur === 'number' ? (summary.price_eur - final) : 0)
              );
              // robustly parse discount_percent from server breakdown (may be string)
              let discount_percent_val: number | undefined = undefined;
              const rawDiscountPercent = (d as Record<string, unknown>)['discount_percent'] ?? (d as Record<string, unknown>)['discountPct'] ?? (d as Record<string, unknown>)['discount'] ?? undefined;
              if (rawDiscountPercent !== undefined) {
                const n = Number(rawDiscountPercent);
                if (Number.isFinite(n)) discount_percent_val = n;
              }
              if (discount_percent_val === undefined && typeof summary.price_eur === 'number' && summary.price_eur > 0) {
                discount_percent_val = ((summary.price_eur - final) / summary.price_eur) * 100;
              }
              // Normalize teo_required into number | undefined
              const rawTeo = (d as Record<string, unknown>)['teo_required'] ?? (d as Record<string, unknown>)['teoRequired'] ?? (d as Record<string, unknown>)['teo_spent'] ?? summary.teo_required;
              let teo_required_parsed: number | undefined = undefined;
              if (typeof rawTeo === 'number' && Number.isFinite(rawTeo)) {
                teo_required_parsed = rawTeo;
              } else if (typeof rawTeo === 'string' && rawTeo.trim() !== '' && !Number.isNaN(Number(rawTeo))) {
                teo_required_parsed = Number(rawTeo);
              }

              setSummary((s) => ({
                ...s,
                total_eur: final,
                discount_percent: typeof discount_percent_val === 'number' ? discount_percent_val : s.discount_percent,
                teo_required: teo_required_parsed ?? s.teo_required,
              }));
              // persist optional server-provided breakdown so it can be forwarded to createPaymentIntent
              try {
                const bd = (details || {})['breakdown'] ?? details ?? null
                if (bd) setDiscountBreakdown(bd as Record<string, unknown>)
              } catch {
                // ignore
              }
               setTeoDiscountApplied(true);
              // optional: you can store details in state or send analytics
              console.debug("TEO discount applied", { finalPriceEUR, discountEUR, details, normalized: { final, discount, discount_percent: discount_percent_val, teo_required: teo_required_parsed } });
            }}
          />

          {!clientSecret ? (
            <>
              <button
                onClick={onPayCard}
                disabled={!!submitting}
                className="w-full rounded-xl px-4 py-2 border bg-black text-white disabled:opacity-50"
              >
                {submitting === "card" ? "Creo pagamento…" : "Paga con carta (Stripe)"}
              </button>

              {/* Full TeoCoin payment removed: no wallet input or full-TEO payment allowed */}
            </>
          ) : (
            <StripeElementsBlock
              clientSecret={clientSecret}
              publishableKey={publishableKey!}
              returnTo={`${window.location.origin}/payments/return?course=${courseId}`}
            />
          )}
        </div>
      </div>

      <div className="text-sm opacity-70">
        Al termine del pagamento verrai riportato alla pagina del corso.
      </div>
    </div>
  )
}

function StripeElementsBlock({
  clientSecret,
  publishableKey,
  returnTo,
}: {
  clientSecret: string
  publishableKey: string
  returnTo: string
}) {
  const stripePromise = React.useMemo<Promise<Stripe | null>>(
    () => loadStripe(publishableKey),
    [publishableKey]
  )

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: "stripe" },
        locale: "it",
      }}
    >
      <StripeCheckoutForm returnTo={returnTo} />
    </Elements>
  )
}

function StripeCheckoutForm({ returnTo }: { returnTo: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  async function onConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setBusy(true)
    setErr(null)
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnTo },
    })
    setBusy(false)
    if (error) setErr(error.message || "Errore nella conferma del pagamento.")
  }

  return (
    <form onSubmit={onConfirm} className="space-y-3">
      <PaymentElement onReady={() => console.debug("[Stripe] PaymentElement ready")} />
      {err && <Alert variant="error">{err}</Alert>}
      <button
        type="submit"
        disabled={!stripe || !elements || busy}
        className="w-full rounded-xl px-4 py-2 border bg-black text-white disabled:opacity-50"
      >
        {busy ? (
          <>
            <Spinner size={16} className="inline mr-2 text-current" />
            Elaboro…
          </>
        ) : (
          "Conferma pagamento"
        )}
      </button>
    </form>
  )
}
