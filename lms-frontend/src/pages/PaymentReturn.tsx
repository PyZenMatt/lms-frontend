// src/pages/PaymentReturn.tsx
import React from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { confirmStripePaymentSmart, purchaseCourse, confirmDiscount, getDiscountSnapshot, getPaymentSummary } from "../services/payments"
import ReceiptCard from "../components/checkout/ReceiptCard"
import { getCourse } from "../services/courses"
import { Spinner } from "../components/ui/spinner"
import { Alert } from "../components/ui/alert"

function useQS() {
  const { search } = useLocation()
  return React.useMemo(() => new URLSearchParams(search), [search])
}

function isEnrolledFlag(course?: Record<string, unknown>): boolean {
  const v = course && Object.prototype.hasOwnProperty.call(course, "is_enrolled") ? (course["is_enrolled"] as unknown) : undefined
  return v === true || v === "true" || v === 1
}

async function pollEnrollment(courseId: number, tries = 6, delayMs = 1500): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    const res = await getCourse(courseId)
    if (res.ok && isEnrolledFlag(res.data)) return true
    await new Promise(r => setTimeout(r, delayMs))
  }
  return false
}

export default function PaymentReturn() {
  const qs = useQS()
  const navigate = useNavigate()

  const paymentIntent = qs.get("payment_intent") || undefined
  const piClientSecret = qs.get("payment_intent_client_secret") || undefined
  const courseParam = qs.get("course") || undefined
  const redirectStatus = qs.get("redirect_status") || undefined
  const courseId = courseParam ? Number(courseParam) : undefined

  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [statusText, setStatusText] = React.useState<string>("in attesa di verifica")
  const [step, setStep] = React.useState<"init" | "confirm" | "fallback" | "poll" | "done">("init")
  const [serverMsg, setServerMsg] = React.useState<string | null>(null)
  const [receiptSnapshot, setReceiptSnapshot] = React.useState<Record<string, unknown> | null>(null)
  const pollingRef = React.useRef<number | null>(null)

  async function runFlow() {
    setBusy(true)
    setError(null)
    setServerMsg(null)
    setStatusText("Inizio verifica pagamento…")

    try {
      if (!paymentIntent || !courseId) {
        setError("Informazioni incomplete nel ritorno da Stripe (manca payment_intent o course).")
        setBusy(false)
        return
      }

      // 1) Conferma “smart”
      setStep("confirm")
      setStatusText("Conferma pagamento lato server…")
      const confirmRes = await confirmStripePaymentSmart(courseId, {
        payment_intent: paymentIntent,
        payment_intent_client_secret: piClientSecret || undefined,
        redirect_status: redirectStatus || undefined,
      })

      if (confirmRes.ok) {
        // Attempt to confirm discount snapshot if any teocoin discount was used
        try {
          // Backend confirm requires price_eur (and possibly discount_percent).
          // Fetch the payment summary for the course and include price_eur in the confirm payload
          // so the serializer validation passes.
          const confPayload: Record<string, unknown> = { order_id: paymentIntent }
          try {
            if (courseId) {
              const summ = await getPaymentSummary(courseId)
              if (summ.ok) {
                if (summ.data.price_eur !== undefined) confPayload.price_eur = summ.data.price_eur
                if (summ.data.discount_percent !== undefined) confPayload.discount_percent = summ.data.discount_percent
              }
            }
          } catch (e) {
            console.debug("getPaymentSummary failed:", e)
          }

          const c = await confirmDiscount(confPayload)
          if (c.ok) {
            // store snapshot for rendering
            setReceiptSnapshot(c.data.snapshot ?? c.data)
          }
        } catch (err) {
          console.debug("confirmDiscount initial failed:", err)
        }

        setServerMsg(confirmRes.data.status || "ok")
        setStatusText("Verifico l'iscrizione…")
        setStep("poll")
        const ok = await pollEnrollment(confirmRes.data.course_id ?? courseId, 8, 1200)
  if (ok) {
          setStatusText("Enrollment confermato, reindirizzo al corso…")
          setStep("done")
          setBusy(false)
          setTimeout(() => navigate(`/courses/${courseId}`), 700)
          return
        }
        // se non appare subito, continuo col fallback
      } else if (confirmRes.status !== 400 && ![404, 405, 501].includes(confirmRes.status)) {
        setError(`Errore conferma pagamento (HTTP ${confirmRes.status}).`)
        setBusy(false)
        return
      }

      // 2) Fallback: purchase/ con method: "stripe"
      setStep("fallback")
      setStatusText("Conferma alternativa (purchase) in corso…")
      const purchaseRes = await purchaseCourse(courseId, {
        method: "stripe",
        payment_intent: paymentIntent,
      })
      const purchaseStatus = ((purchaseRes as unknown) as { status?: number }).status ?? 0
      if (!purchaseRes.ok && ![404, 405, 501].includes(purchaseStatus)) {
        setError(`Errore nella conferma alternativa (HTTP ${purchaseStatus}).`)
        setBusy(false)
        return
      }

  // 3) Poll finale dell’enrollment (anche se purchase ha risposto 200, potrebbe essere async)
      setStep("poll")
      setStatusText("Aggiorno lo stato d'iscrizione…")
      const ok = await pollEnrollment(courseId, 8, 1200)
      if (ok) {
        setStatusText("Enrollment confermato, reindirizzo al corso…")
        setStep("done")
        setBusy(false)
        setTimeout(() => navigate(`/courses/${courseId}`), 700)
        return
      }

  // 4) Avviso all’utente se non riusciamo a determinare l’iscrizione
      const msg = confirmRes.status === 400
        ? "Conferma non accettata dal server (400). Potrebbe mancare un campo nel payload; riprova più tardi o contatta il supporto."
        : "Verifica non disponibile lato server. Il pagamento è riuscito, l'iscrizione potrebbe richiedere qualche istante."
      setError(msg)
      setBusy(false)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg || "Errore imprevisto nella verifica.")
      setBusy(false)
    }
  }

  // Polling loop to refresh discount snapshot until final state or deadline
  React.useEffect(() => {
    let mounted = true

    async function pollLoop(orderId?: string) {
      if (!orderId) return
      // clear any previous interval id stored in ref
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current)
        pollingRef.current = null
      }

      // immediate attempt done by runFlow; start periodic polling only if we have a snapshot or pending state
      pollingRef.current = window.setInterval(async () => {
        try {
          const snapRes = await getDiscountSnapshot(orderId)
          if (snapRes.ok) {
            const data = snapRes.data?.snapshot ?? snapRes.data ?? null
            if (mounted) setReceiptSnapshot(data)

            const status = (data?.status ?? data?.state) as string | undefined
            const deadline = new Date(data?.deadline_at ?? data?.expires_at ?? 0)
            if (status === "accepted" || status === "rejected") {
              // stop polling
              if (pollingRef.current) {
                window.clearInterval(pollingRef.current)
                pollingRef.current = null
              }
            } else if (deadline && !isNaN(deadline.getTime()) && Date.now() > deadline.getTime()) {
              // expired: treat as rejected per BE rules
              if (mounted) setReceiptSnapshot({ ...(data ?? {}), status: "rejected" })
              if (pollingRef.current) {
                window.clearInterval(pollingRef.current)
                pollingRef.current = null
              }
            }
            // clear previous polling notification state (no-op)
          } else if (snapRes.status === 404) {
            // fallback: try confirmDiscount which is idempotent and returns same snapshot
            try {
              const conf = await confirmDiscount({ order_id: orderId })
              if (conf.ok) {
                const data = conf.data?.snapshot ?? conf.data ?? null
                if (mounted) setReceiptSnapshot(data)
                const status = (data?.status ?? data?.state) as string | undefined
                const deadline = new Date(data?.deadline_at ?? data?.expires_at ?? 0)
                if (status === "accepted" || status === "rejected") {
                  if (pollingRef.current) {
                    window.clearInterval(pollingRef.current)
                    pollingRef.current = null
                  }
                } else if (deadline && !isNaN(deadline.getTime()) && Date.now() > deadline.getTime()) {
                  if (mounted) setReceiptSnapshot({ ...(data ?? {}), status: "rejected" })
                  if (pollingRef.current) {
                    window.clearInterval(pollingRef.current)
                    pollingRef.current = null
                  }
                }
              }
            } catch (err) {
              console.debug("confirmDiscount fallback failed:", err)
            }
          } else if (snapRes.status >= 500 || snapRes.status === 0) {
            // server/network issue — notify but keep polling
            try { window.dispatchEvent(new CustomEvent("toast:show", { detail: { variant: "warning", message: "Connessione instabile, ritento tra 20s" } })) } catch { void 0 }
          }
        } catch (err) {
          try { window.dispatchEvent(new CustomEvent("toast:show", { detail: { variant: "warning", message: "Connessione instabile, ritento tra 20s" } })) } catch { void 0 }
          console.debug("polling error:", err)
        }
      }, 20000)
    }

    // start polling if we have an order in query params
    if (paymentIntent) pollLoop(paymentIntent)

    return () => {
      mounted = false
      if (pollingRef.current) window.clearInterval(pollingRef.current)
    }
  }, [paymentIntent])

  React.useEffect(() => {
  runFlow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Ritorno da Stripe</h1>

      <div className="rounded-xl border p-4 space-y-1 text-sm">
        <div>Stato redirect: <b>{redirectStatus || "sconosciuto"}</b></div>
        <div>Payment Intent: <b>{paymentIntent || "—"}</b></div>
        <div>Corso: <b>{courseId ?? "—"}</b></div>
        <div>Fase: <b>{step}</b></div>
        {serverMsg && <div>Server: <b>{serverMsg}</b></div>}
      </div>

      {busy && (
        <div className="rounded-xl border p-4 text-sm">
          <div className="flex items-center gap-3">
            <Spinner />
            <div>{statusText}</div>
          </div>
        </div>
      )}

      {receiptSnapshot && (
        <div>
          <ReceiptCard r={{
            final_price_eur: receiptSnapshot.final_price_eur ?? receiptSnapshot.student_pay_eur ?? receiptSnapshot.total_eur ?? 0,
            discount_eur: receiptSnapshot.discount_eur ?? (typeof receiptSnapshot.price_eur === 'number' ? (receiptSnapshot.price_eur - (receiptSnapshot.final_price_eur ?? receiptSnapshot.student_pay_eur ?? receiptSnapshot.total_eur)) : 0),
            teo_spent: receiptSnapshot.teo_spent ?? receiptSnapshot.teo_required ?? receiptSnapshot.teacher_teo,
            order_id: receiptSnapshot.order_id ?? paymentIntent,
            created_at: receiptSnapshot.created_at ?? receiptSnapshot.created,
            status: receiptSnapshot.status ?? receiptSnapshot.state,
            deadline_at: receiptSnapshot.deadline_at ?? receiptSnapshot.expires_at,
            teacher_bonus_teo: receiptSnapshot.teacher_bonus_teo ?? receiptSnapshot.bonus_teo,
          }} />
        </div>
      )}

      {!busy && error && (
        <Alert variant="warning" title="Attenzione">
          <div>{error}</div>
          <div className="flex gap-3 mt-2">
            {courseId ? (
              <Link className="underline" to={`/courses/${courseId}`}>Vai al corso</Link>
            ) : (
              <Link className="underline" to="/courses">Vai al catalogo</Link>
            )}
            <button className="underline" onClick={() => runFlow()}>
              Riprova verifica
            </button>
          </div>
        </Alert>
      )}

      {!busy && !error && (
        <div className="rounded-xl border p-4 text-sm">
          {statusText}
        </div>
      )}
    </div>
  )
}
