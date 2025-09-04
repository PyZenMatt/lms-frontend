// src/services/payments.ts
import { api } from "../lib/api"
import { showToast } from "@/lib/toast"

/** =========================
 *  Tipi e helper comuni
 *  ========================= */
type Ok<T> = { ok: true; status: number; data: T }
type Err = { ok: false; status: number; error: any }
export type Result<T> = Ok<T> | Err

const asNumber = (v: any): number | undefined => {
  if (v === null || v === undefined) return undefined

  // Accept objects produced by some backend serializers like
  // { source: "5.0", parsedValue: 5 }
  if (typeof v === "object") {
    if (v === null) return undefined
    if (typeof v.parsedValue === "number" && Number.isFinite(v.parsedValue)) return v.parsedValue
    if (typeof v.source === "string") {
      const n = Number(v.source)
      if (Number.isFinite(n)) return n
    }
    if (typeof v.value === "number" && Number.isFinite(v.value)) return v.value
    if (typeof v.value === "string") {
      const n = Number(v.value)
      if (Number.isFinite(n)) return n
    }
    return undefined
  }

  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

const withQuery = (params?: Record<string, any>) => ({
  params: params ?? undefined,
  query: params ?? undefined,
})

/** =========================
 *  Tipi dominio pagamenti
 *  ========================= */
export type PaymentSummary = {
  course_id: number
  title?: string
  price_eur?: number
  discount_percent?: number
  total_eur?: number
  teo_required?: number
  currency?: string
  raw?: Record<string, any>
}

export type PaymentIntentInitResult = {
  ok: boolean
  status: number
  client_secret?: string
  publishable_key?: string
  checkout_url?: string
  raw?: any
  error?: any
}

export type VerificationData = {
  enrolled?: boolean
  course_id?: number
  payment_intent?: string
  status?: string // "succeeded" | "processing" | "requires_payment_method" | ...
  raw?: any
}

/** =========================
 *  API: Payment Summary
 *  ========================= */
export async function getPaymentSummary(
  courseId: number,
  params?: { discount_percent?: number; student_address?: string }
): Promise<Result<PaymentSummary>> {
  const res = await api.get<any>(`/v1/courses/${courseId}/payment-summary/`, withQuery(params as any))
  if (!res.ok) return { ok: false, status: res.status, error: (res as any).error }

  const raw = res.data ?? {}
  const pricing = (raw.pricing ?? raw.pricing_summary) as Record<string, any> | undefined
  const firstOption = Array.isArray(raw.pricing_options) && raw.pricing_options.length ? (raw.pricing_options[0] as Record<string, any>) : undefined

  const price_eur =
    asNumber(raw.price_eur ?? raw.price ?? raw.base_price ?? raw.original_price) ??
    asNumber(pricing?.original_price) ??
    asNumber(firstOption?.price) ??
    undefined

  const discount_percent = asNumber(raw.discount_percent ?? raw.discountPct ?? pricing?.discount_percent ?? firstOption?.discount_percent)

  const total_eur =
    asNumber(raw.total_eur ?? raw.total ?? raw.final_price) ??
    asNumber(pricing?.final_price) ??
    asNumber(firstOption?.final_price) ??
    undefined

  // Compute teo_required carefully: prefer explicit teocoin pricing option (and only if not disabled).
  // Avoid falling back to fiat price (firstOption.price) which would show e.g. 49.99 TEO incorrectly.
  let teo_required = asNumber(raw.teo_required ?? raw.teo_cost ?? raw.teocoin_required) ?? undefined

  const teocoinOption = Array.isArray(raw.pricing_options)
    ? (raw.pricing_options as Record<string, any>[]).find((o) => o.method === "teocoin")
    : undefined

  if (teocoinOption && !teocoinOption.disabled) {
    const optPriceNum = asNumber(teocoinOption.price)
    if (optPriceNum !== undefined) {
      teo_required = optPriceNum
  }
  // Do NOT derive teo_required from fiat prices or discount percentages.
  // teo_required must come explicitly from backend fields (raw.teo_required / pricing_options.price)
  // This avoids showing a TEO amount computed with an implicit 1:1 EUR->TEO assumption.
  }

  const currency = String(raw.currency ?? pricing?.currency ?? firstOption?.currency ?? "EUR")

  const summary: PaymentSummary = {
    course_id: Number(courseId),
    title: raw.title,
    price_eur,
    discount_percent,
    total_eur,
    teo_required,
    currency,
    raw,
  }

  return { ok: true, status: res.status, data: summary }
}

/** =========================
 *  API: Create Payment Intent (Stripe)
 *  ========================= */
export async function createPaymentIntent(
  courseId: number,
  payload?: Record<string, any>
): Promise<PaymentIntentInitResult> {
  const body = payload ?? {}
  const candidates = [
    `/v1/courses/${courseId}/create-payment-intent/`,
    `/v1/courses/${courseId}/start-payment/`,
    `/v1/courses/${courseId}/payment-intent/`,
  ]
  for (const path of candidates) {
    const res = await api.post<any>(path, body)
    if (res.ok) {
      const data = res.data ?? {}
      return {
        ok: true,
        status: res.status,
        client_secret: data.client_secret ?? data.clientSecret,
        publishable_key: data.publishable_key ?? data.publishableKey,
        checkout_url: data.checkout_url ?? data.url ?? data.redirect_url,
        raw: data,
      }
    }
    if (![404, 405, 501].includes((res as any).status ?? res.status)) {
      return { ok: false, status: res.status, error: (res as any).error }
    }
  }
  return { ok: false, status: 404, error: "No payment-intent endpoint available" }
}

/** =========================
 *  API: Purchase/Enroll (fallback o TeoCoin/Stripe generico)
 *  ========================= */
export async function purchaseCourse(
  courseId: number,
  payload?: Record<string, any>
): Promise<Result<any>> {
  let res = await api.post<any>(`/v1/courses/${courseId}/purchase/`, payload ?? {})
  if (res.ok) return { ok: true, status: res.status, data: res.data }

  if (res.status === 404) {
    res = await api.post<any>(`/v1/courses/${courseId}/enroll/`, payload ?? {})
    if (res.ok) return { ok: true, status: res.status, data: res.data }
  }

  return { ok: false, status: res.status, error: (res as any).error }
}

/** =========================
 *  API: Confirm post-Stripe (smart payload)
 *  ========================= */
/**
 * Prova più shape di payload per adattarsi ai nomi attesi dal BE.
 * - Preferito: { payment_intent, payment_intent_client_secret, redirect_status, method: "stripe", course_id }
 * - Alternative: { payment_intent_id }, { client_secret }, { intent_id }, { pi_id }, ecc.
 */
export async function confirmStripePaymentSmart(
  courseId: number,
  args: { payment_intent: string; payment_intent_client_secret?: string; redirect_status?: string }
): Promise<Result<VerificationData>> {
  const { payment_intent, payment_intent_client_secret, redirect_status } = args

  const shapes: Record<string, any>[] = [
    { payment_intent, payment_intent_client_secret, redirect_status, method: "stripe", course_id: courseId },
    { payment_intent_id: payment_intent, client_secret: payment_intent_client_secret, redirect_status, method: "stripe", course_id: courseId },
    { pi_id: payment_intent, client_secret: payment_intent_client_secret, method: "stripe", course_id: courseId },
    { intent_id: payment_intent, method: "stripe", course_id: courseId },
    { payment_intent, method: "stripe" },
  ]

  let last400: any = null

  for (const body of shapes) {
    const res = await api.post<any>(`/v1/courses/${courseId}/confirm-payment/`, body)
    if (res.ok) {
      const data = res.data ?? {}
      const enrolled =
        data.enrolled === true ||
        data.enrollment_created === true ||
        data.status === "enrolled" ||
        data.result === "ok"

      const cid =
        asNumber(data.course_id) ??
        asNumber(data.course) ??
        (Number.isFinite(courseId) ? Number(courseId) : undefined)

      const status: string | undefined =
        data.status ?? data.payment_status ?? data.pi_status ?? data.intent_status

      return { ok: true, status: res.status, data: { enrolled, course_id: cid, status, raw: data } }
    }
    if (res.status === 400) {
      last400 = (res as any).error ?? res
      // provo shape successivo
      continue
    }
    if (![404, 405, 501].includes((res as any).status ?? res.status)) {
      return { ok: false, status: res.status, error: (res as any).error }
    }
  }

  return { ok: false, status: 400, error: last400 ?? "Bad Request" }
}

/** =========================
 *  API: Rewards / Discounts (preview & confirm)
 *  These wrap the backend endpoints that return the server-side breakdown
 *  for teocoin-based discounts and confirm the persisted snapshot after
 *  a successful payment (idempotent).
 *  ========================= */

export type DiscountBreakdown = {
  student_pay_eur?: number
  teacher_eur?: number
  platform_eur?: number
  teacher_teo?: number
  platform_teo?: number
  absorption_policy?: string
  // full raw payload from backend
  raw?: any
}

export async function previewDiscount(payload?: Record<string, any>): Promise<Result<DiscountBreakdown>> {
  const body = payload ?? {}
  const res = await api.post<any>(`/v1/rewards/discounts/preview/`, body)
  if (!res.ok) return { ok: false, status: res.status, error: (res as any).error }

  const data = res.data ?? {}
  const breakdown: DiscountBreakdown = {
    student_pay_eur: asNumber(data.student_pay_eur ?? data.student_pay ?? data.student_amount) ?? undefined,
    teacher_eur: asNumber(data.teacher_eur ?? data.teacher_amount) ?? undefined,
    platform_eur: asNumber(data.platform_eur ?? data.platform_amount) ?? undefined,
    teacher_teo: asNumber(data.teacher_teo ?? data.teacher_teocoin) ?? undefined,
    platform_teo: asNumber(data.platform_teo ?? data.platform_teocoin) ?? undefined,
    absorption_policy: data.absorption_policy ?? data.policy ?? undefined,
    raw: data,
  }

  return { ok: true, status: res.status, data: breakdown }
}

export async function confirmDiscount(payload?: Record<string, any>): Promise<Result<{ snapshot?: any; breakdown?: DiscountBreakdown }>> {
  const body = payload ?? {}
  const res = await api.post<any>(`/v1/rewards/discounts/confirm/`, body)
  if (!res.ok) return { ok: false, status: res.status, error: (res as any).error }

  const data = res.data ?? {}
  const breakdownData = data.breakdown ?? data ?? {}
  const breakdown: DiscountBreakdown = {
    student_pay_eur: asNumber(breakdownData.student_pay_eur ?? breakdownData.student_pay ?? breakdownData.student_amount) ?? undefined,
    teacher_eur: asNumber(breakdownData.teacher_eur ?? breakdownData.teacher_amount) ?? undefined,
    platform_eur: asNumber(breakdownData.platform_eur ?? breakdownData.platform_amount) ?? undefined,
    teacher_teo: asNumber(breakdownData.teacher_teo ?? breakdownData.teacher_teocoin) ?? undefined,
    platform_teo: asNumber(breakdownData.platform_teo ?? breakdownData.platform_teocoin) ?? undefined,
    absorption_policy: breakdownData.absorption_policy ?? breakdownData.policy ?? undefined,
    raw: data,
  }

  return { ok: true, status: res.status, data: { snapshot: data.snapshot ?? data, breakdown } }
}

/**
 * GET discount snapshot by order_id.
 * Fallback callers should call confirmDiscount(...) when GET is not available (404).
 */
export async function getDiscountSnapshot(orderId: string): Promise<Result<{ snapshot?: any; breakdown?: DiscountBreakdown; status?: string; deadline_at?: string }>> {
  if (!orderId) return { ok: false, status: 400, error: "order_id required" }
  const path = `/v1/rewards/discounts/${orderId}/`
  const res = await api.get<any>(path)
  if (!res.ok) return { ok: false, status: res.status, error: (res as any).error }

  const data = (res.data ?? {}) as any
  const snapshot = data.snapshot ?? data
  const breakdownData = snapshot.breakdown ?? snapshot ?? {}
  const breakdown: DiscountBreakdown = {
    student_pay_eur: asNumber(breakdownData.student_pay_eur ?? breakdownData.student_pay ?? breakdownData.student_amount) ?? undefined,
    teacher_eur: asNumber(breakdownData.teacher_eur ?? breakdownData.teacher_amount) ?? undefined,
    platform_eur: asNumber(breakdownData.platform_eur ?? breakdownData.platform_amount) ?? undefined,
    teacher_teo: asNumber(breakdownData.teacher_teo ?? breakdownData.teacher_teocoin) ?? undefined,
    platform_teo: asNumber(breakdownData.platform_teo ?? breakdownData.platform_teocoin) ?? undefined,
    absorption_policy: breakdownData.absorption_policy ?? breakdownData.policy ?? undefined,
    raw: snapshot,
  }

  const status = (snapshot.status ?? snapshot.state) as string | undefined
  const deadline_at = snapshot.deadline_at ?? snapshot.expires_at

  return { ok: true, status: res.status, data: { snapshot, breakdown, status, deadline_at } }
}

/** =========================
 *  API: Teacher Inbox & Staking wrappers
 *  These are small FE wrappers around rewards endpoints used by
 *  the teacher inbox (pending teo decisions) and staking pages.
 *  They follow the project's Result<T> style and surface 404 as a
 *  friendly toast "funzionalità in arrivo".
 *  ========================= */

export type PendingTeoDecision = {
  id: number
  order_id?: string
  course_title?: string
  student_name?: string
  teacher_eur?: number
  platform_eur?: number
  teacher_teo?: number
  expected_bonus_teo?: number
  deadline_at?: string
  status?: string
  raw?: any
}

export async function listPendingTeoDecisions(): Promise<Result<PendingTeoDecision[]>> {
  // Align with existing backend: /api/v1/teacher-choices/pending/
  const path = `/api/v1/teacher-choices/pending/`
  const res = await api.get<any>(path)
  if (!res.ok) return { ok: false, status: res.status, error: (res as any).error }

  const payload = res.data ?? {}
  // Expected shape: { success: true, pending_requests: [...], count: N }
  const rawList = Array.isArray(payload) ? payload : (Array.isArray(payload.pending_requests) ? payload.pending_requests : [])

  const items: PendingTeoDecision[] = rawList.map((r: any) => ({
    id: Number(r.id),
    order_id: r.order_id ?? r.request_id ?? undefined,
    course_title: r.course_title ?? undefined,
    student_name: r.student_email ?? r.student ?? undefined,
    // Not all fields are present; map what we can
    teacher_eur: asNumber(r.teacher_earnings_if_declined?.fiat) ?? undefined,
    platform_eur: undefined,
    teacher_teo: asNumber(r.teacher_earnings_if_accepted?.total_teo ?? r.teacher_earnings_if_accepted?.teo) ?? undefined,
    expected_bonus_teo: undefined,
    deadline_at: r.expires_at ?? undefined,
    status: r.decision ?? "pending",
    raw: r,
  }))

  return { ok: true, status: res.status, data: items }
}

export async function acceptTeo(decisionId: number): Promise<Result<any>> {
  if (!decisionId) return { ok: false, status: 400, error: "decision id required" }
  const path = `/api/v1/teacher-choices/${decisionId}/accept/`
  const res = await api.post<unknown>(path, {})
  if (!res.ok) return { ok: false, status: res.status, error: (res as any).error }
  return { ok: true, status: res.status, data: res.data ?? {} }
}

export async function rejectTeo(decisionId: number): Promise<Result<any>> {
  if (!decisionId) return { ok: false, status: 400, error: "decision id required" }
  const path = `/api/v1/teacher-choices/${decisionId}/decline/`
  const res = await api.post<unknown>(path, {})
  if (!res.ok) return { ok: false, status: res.status, error: (res as any).error }
  return { ok: true, status: res.status, data: res.data ?? {} }
}

/** =========================
 *  Web3 prepared transactions (optional)
 *  These endpoints may not be present on all backends; callers should
 *  gracefully fallback to the server-side-only confirm endpoints.
 *  ========================= */

export type PreparedTx = { to: string; data?: string | null; value?: string | null; chainId?: string | number }

export async function getMintTx(orderId: string): Promise<Result<PreparedTx>> {
  if (!orderId) return { ok: false, status: 400, error: "order_id required" }
  const path = `/v1/web3/tx/mint?order_id=${encodeURIComponent(orderId)}`
  const res = await api.get<any>(path)
  if (!res.ok) return { ok: false, status: res.status, error: (res as any).error }
  const data = res.data ?? {}
  const tx: PreparedTx = { to: data.to, data: data.data ?? data.input ?? data.calldata ?? null, value: data.value ?? null, chainId: data.chainId ?? data.chain_id ?? undefined }
  return { ok: true, status: res.status, data: tx }
}

export async function getBurnTx(orderId: string): Promise<Result<PreparedTx>> {
  if (!orderId) return { ok: false, status: 400, error: "order_id required" }
  const path = `/v1/web3/tx/burn?order_id=${encodeURIComponent(orderId)}`
  const res = await api.get<any>(path)
  if (!res.ok) return { ok: false, status: res.status, error: (res as any).error }
  const data = res.data ?? {}
  const tx: PreparedTx = { to: data.to, data: data.data ?? data.input ?? data.calldata ?? null, value: data.value ?? null, chainId: data.chainId ?? data.chain_id ?? undefined }
  return { ok: true, status: res.status, data: tx }
}

export async function postTxReceipt(orderId: string, payload: { hash: string; status: string }): Promise<Result<void>> {
  if (!orderId) return { ok: false, status: 400, error: "order_id required" }
  const body = { order_id: orderId, ...payload }
  const path = `/v1/web3/tx/receipt/`
  const res = await api.post<any>(path, body)
  if (!res.ok) return { ok: false, status: res.status, error: (res as any).error }
  return { ok: true, status: res.status, data: undefined }
}

export type StakingOverview = {
  balance_teo?: number
  available_teo?: number
  staked_teo?: number
  tier_name?: string
  bonus_multiplier?: number
  next_tier?: string
  next_tier_threshold_teo?: number
  raw?: any
}

export async function getStakingOverview(): Promise<Result<StakingOverview>> {
  const path = `/v1/rewards/staking/overview/`
  const res = await api.get<any>(path)
  if (!res.ok) {
    if ((res as any).status === 404) showToast({ variant: "info", message: "Funzionalità in arrivo: staking" })
    return { ok: false, status: res.status, error: (res as any).error }
  }

  const data = res.data ?? {}
  console.debug("getStakingOverview: raw response", data);
  // Extract raw numbers (may come in several shapes, including nested `data.balance` used by wallet endpoints)
  const b = (data && typeof data.balance === 'object') ? (data.balance as Record<string, any>) : undefined;

  const rawBalance = asNumber(
    data.balance_teo ?? data.balance ?? data.balance_teocoin ??
    (b ? (b.total_balance ?? b.total ?? b.balance ?? undefined) : undefined)
  );
  const rawAvailable = asNumber(
    data.available_teo ?? data.available ?? data.available_balance ?? data.available_teocoin ??
    (b ? (b.available_balance ?? b.available ?? b.available_teo ?? undefined) : undefined)
  );
  const rawStaked = asNumber(
    data.staked_teo ?? data.staked ?? data.staked_balance ??
    (b ? (b.staked_balance ?? b.staked ?? undefined) : undefined)
  );

  // Compute derived values when explicit ones are missing
  const computedAvailable = (Number.isFinite(rawBalance as number) && Number.isFinite(rawStaked as number))
    ? Math.max(0, (rawBalance as number) - (rawStaked as number))
    : undefined;
  const computedStaked = (Number.isFinite(rawBalance as number) && Number.isFinite(rawAvailable as number))
    ? Math.max(0, (rawBalance as number) - (rawAvailable as number))
    : undefined;

  const out: StakingOverview = {
    // keep balance as reported when available
    balance_teo: rawBalance ?? undefined,
    // prefer explicit available, otherwise computed from total - staked
    available_teo: rawAvailable ?? computedAvailable ?? undefined,
    // prefer explicit staked, otherwise compute from total - available
    staked_teo: rawStaked ?? computedStaked ?? undefined,
    tier_name: data.tier_name ?? data.tier ?? undefined,
    bonus_multiplier: asNumber(data.bonus_multiplier ?? data.bonus ?? undefined) ?? undefined,
    next_tier: data.next_tier ?? undefined,
    next_tier_threshold_teo: asNumber(data.next_tier_threshold_teo ?? data.next_threshold ?? data.next_tier_threshold) ?? undefined,
    raw: data,
  }
  console.debug("getStakingOverview: normalized", out);

  return { ok: true, status: res.status, data: out }
}

export async function stakeTeo(amount: string): Promise<Result<StakingOverview>> {
  if (!amount) return { ok: false, status: 400, error: "amount required" }
  const path = `/v1/rewards/staking/stake/`
  const body = { amount }
  const res = await api.post<any>(path, body)
  if (!res.ok) {
    if ((res as any).status === 404) showToast({ variant: "info", message: "Funzionalità in arrivo: stake TEO" })
    return { ok: false, status: res.status, error: (res as any).error }
  }

  const data = res.data ?? {}
  // assume backend returns overview
  return getStakingOverview().then((r) => (r.ok ? r : { ok: true, status: res.status, data: { raw: data } }))
}

export async function unstakeTeo(amount: string): Promise<Result<StakingOverview>> {
  if (!amount) return { ok: false, status: 400, error: "amount required" }
  const path = `/v1/rewards/staking/unstake/`
  const body = { amount }
  const res = await api.post<any>(path, body)
  if (!res.ok) {
    if ((res as any).status === 404) showToast({ variant: "info", message: "Funzionalità in arrivo: unstake TEO" })
    return { ok: false, status: res.status, error: (res as any).error }
  }

  return getStakingOverview().then((r) => (r.ok ? r : { ok: true, status: res.status, data: { raw: res.data ?? {} } }))
}

/** =========================
 *  (Opzionale) Verify generico
 *  ========================= */
export async function verifyStripePayment(
  paymentIntentId: string,
  courseId?: number
): Promise<Result<VerificationData>> {
  const payload = { payment_intent: paymentIntentId, course_id: courseId }
  const candidates = [
    `/v1/payments/verify/`,
    `/v1/stripe/verify/`,
    courseId ? `/v1/courses/${courseId}/verify-payment/` : null,
  ].filter(Boolean) as string[]

  for (const path of candidates) {
    const res = await api.post<any>(path, payload)
    if (res.ok) {
      const data = res.data ?? {}
      const enrolled =
        data.enrolled === true ||
        data.enrollment_created === true ||
        data.status === "enrolled" ||
        data.result === "ok"
      const cid =
        asNumber(data.course_id) ??
        asNumber(data.course) ??
        (courseId !== undefined ? Number(courseId) : undefined)
      const status: string | undefined =
        data.status ?? data.payment_status ?? data.pi_status ?? data.intent_status

      return { ok: true, status: res.status, data: { enrolled, course_id: cid, payment_intent: paymentIntentId, status, raw: data } }
    }
    if (![404, 405, 501].includes((res as any).status ?? res.status)) {
      return { ok: false, status: res.status, error: (res as any).error }
    }
  }
  return { ok: false, status: 404, error: "No payment verification endpoint available" }
}
