import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { getSubmission, getAreaFeedback } from "../../services/reviews"

type AreaKey =
  | "technical" | "technique"
  | "creative"
  | "following"
  | "strengths" | "suggestions" | "final"
  | string

function normalizeAreaKey(k?: string | null): AreaKey | null {
  if (!k) return null
  const s = String(k).toLowerCase()
  if (s === "technique" || s === "technical") return "technical"
  if (s.startsWith("follow")) return "following"
  if (s.startsWith("creat")) return "creative"
  if (s.startsWith("strength")) return "strengths"
  if (s.startsWith("suggest")) return "suggestions"
  if (s.startsWith("final")) return "final"
  return s
}

type Reviewer = { id?: string | number; name?: string; username?: string }
type Review = {
  reviewer?: Reviewer | string | null
  comment?: string | null
  text?: string | null
  body?: string | null
  content?: unknown
  reviewed_at?: string | number | null
  // campi specifici (se presenti)
  technical_comment?: string | null
  creative_comment?: string | null
  following_comment?: string | null
  [k: string]: unknown
}

function areaLabel(k?: AreaKey | null) {
  switch (k) {
    case "technical": return "Technique"
    case "creative": return "Creative"
    case "following": return "Following"
    case "strengths": return "Highlight Strengths"
    case "suggestions": return "Constructive Suggestions"
    case "final": return "Final Thoughts"
    default: return "Feedback"
  }
}

function isRatingLike(val: unknown) {
  if (val == null) return false
  const s = String(val)
  if (!s.trim()) return false
  const numOnly = /^\s*\d+(?:\.\d+)?\s*$/
  const ratingPattern = /(Technical|Technique|Creative|Following).{0,40}\d\s*\/\s*5/i
  return numOnly.test(s) || ratingPattern.test(s)
}

function pickRaw(review: Review | null, ...keys: (keyof Review | string)[]) {
  if (!review) return null
  const r = review as Record<string, unknown>
  for (const k of keys) {
    const v = r[k]
    if (v == null) continue
    const s = String(v)
    if (!s.trim()) continue
    if (isRatingLike(s)) continue
    return s
  }
  return null
}

// NOTE: previous intelligent fallback parsing removed — we avoid parsing blob for vote areas

function reviewerToString(rev?: Reviewer | string | null) {
  if (!rev) return "Reviewer"
  if (typeof rev === "string") return rev
  return rev.name ?? rev.username ?? "Reviewer"
}
function reviewerInitials(rev?: Reviewer | string | null) {
  const s = reviewerToString(rev)
  const parts = String(s).trim().split(/\s+/)
  return (parts.length >= 2 ? (parts[0][0] + parts[1][0]) : String(s).slice(0, 2)).toUpperCase()
}
function renderCommentValue(v: unknown) {
  const s = v == null ? "" : String(v)
  return s.trim() ? s : "— Nessun commento testuale per questa sezione —"
}
function getReviewerKey(rev?: Reviewer | string | null): string {
  if (!rev) return "anon"
  if (typeof rev === "string") return rev.trim().toLowerCase()
  const r = rev as Reviewer
  if (r.id != null) return `id:${String(r.id)}`
  if (r.username) return `u:${r.username.toLowerCase()}`
  if (r.name) return `n:${r.name.toLowerCase()}`
  return JSON.stringify(r)
}
function normalizeComment(item: Review | null): string | null {
  if (!item) return null
  const c = item.comment ?? item.text ?? item.body ?? null
  const s = c != null ? String(c) : ""
  return s.trim() ? s : null
}

// preferisci SEMPRE il campo specifico; niente parsing blob nell’aggregato
function getPerAreaCommentStrict(obj: Review | null, area: "technical" | "creative" | "following"): string | null {
  if (!obj) return null
  const rec = obj as Record<string, unknown>
  const directVal = rec[`${area}_comment`]
  if (typeof directVal === "string" && directVal.trim() && !isRatingLike(directVal)) return directVal.trim()
  const altVal = rec[`${area}_text`]
  if (typeof altVal === "string" && altVal.trim() && !isRatingLike(altVal)) return altVal.trim()
  // se l’oggetto arriva dall’endpoint per-area, `comment` è già specifico
  const c = normalizeComment(obj)
  return c && !isRatingLike(c) ? c : null
}

// ancora piu' restrittivo per la vista aggregata: NON fare fallback su comment/blob
function getPerAreaCommentAggregated(obj: Review | null, area: "technical" | "creative" | "following"): string | null {
  if (!obj) return null
  const rec = obj as Record<string, unknown>
  const directVal = rec[`${area}_comment`]
  if (typeof directVal === "string" && directVal.trim() && !isRatingLike(directVal)) return directVal.trim()
  const altVal = rec[`${area}_text`]
  if (typeof altVal === "string" && altVal.trim() && !isRatingLike(altVal)) return altVal.trim()
  return null
}

export function FeedbackDetailDrawer({
  submissionId, open, onClose, area,
}: {
  submissionId: number | null
  open: boolean
  onClose: () => void
  area?: AreaKey
}) {
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<Record<string, unknown> | null>(null)
  const [areaItems, setAreaItems] = React.useState<Review[] | null>(null)
  const [voteAreaItems, setVoteAreaItems] = React.useState<{technical: Review[]; creative: Review[]; following: Review[]}>({ technical: [], creative: [], following: [] })
  const [error, setError] = React.useState<string | null>(null)

  const areaKey = normalizeAreaKey(area ?? null)
  const normalizedArea = React.useMemo(() => {
    const s = String(area ?? "").toLowerCase()
    if (!s) return null
    if (s === "technique" || s === "technical") return "technical"
    if (s.startsWith("creat")) return "creative"
    if (s.startsWith("follow")) return "following"
    return s
  }, [area])

  React.useEffect(() => {
    let mounted = true
    async function load() {
      if (!submissionId) return
      setLoading(true); setError(null)

      const res = await getSubmission(submissionId)
      if (!mounted) return
      if (res.ok) setData(res.data)
      else setError(`Errore caricamento dettagli feedback (HTTP ${res.status})`)

      // single-area: fetcha sempre per-area
      if (areaKey && submissionId) {
        const mapToBackendArea = (k: AreaKey | null) => {
          if (!k) return k
          if (k === "strengths") return "highlights"
          if (k === "suggestions") return "suggestions"
          if (k === "final") return "final"
          return k
        }
        try {
          const ares = await getAreaFeedback(submissionId, String(mapToBackendArea(areaKey)))
          if (!mounted) return
            if (ares.ok && Array.isArray(ares.data?.items)) {
            const normalized = (ares.data.items as unknown[]).map((it) => {
              const item = it as Record<string, unknown>
              // If the endpoint returned area-specific comment field, prefer it;
              // but FALLBACK to generic comment/text/body if area-specific field is missing.
              const areaField = areaKey ? `${String(areaKey)}_comment` : 'comment'
              const direct = (item[areaField] as string) ?? null
              const fallback = (item.comment as string) ?? (item.text as string) ?? (item.body as string) ?? null
              const commentText = (typeof direct === 'string' && direct.trim())
                ? direct.trim()
                : (typeof fallback === 'string' && fallback.trim() ? fallback.trim() : null)
              return ({ ...item, [areaField]: commentText ?? null, comment: commentText ?? null } as Review)
            })
            setAreaItems(normalized)
          } else setAreaItems(null)
        } catch { setAreaItems(null) }
      } else setAreaItems(null)

      // aggregato: prefetch 3 aree voto
      if (!areaKey && submissionId) {
        try {
          const areas: ("technical"|"creative"|"following")[] = ["technical","creative","following"]
          const results = await Promise.all(areas.map(a => getAreaFeedback(submissionId, a)))
          if (!mounted) return
          const map: { [k: string]: Review[] } = { technical: [], creative: [], following: [] }
          areas.forEach((a, i) => {
            const resA = results[i]
              if (resA?.ok && Array.isArray(resA.data?.items)) {
              const items = (resA.data.items as unknown[]).map((it) => {
                const item = it as Record<string, unknown>
                // only promote explicit per-area comment returned by backend for vote areas
                const areaField = `${a}_comment`
                const direct = (item[areaField] as string) ?? null
                const commentText = typeof direct === 'string' && direct.trim() ? direct : null
                return ({ ...item, [areaField]: commentText ?? null, comment: commentText ?? null } as Review)
              })
              items.sort((x, y) => {
                const aT = x.reviewed_at ? Date.parse(String(x.reviewed_at)) : 0
                const bT = y.reviewed_at ? Date.parse(String(y.reviewed_at)) : 0
                return bT - aT
              })
              map[a] = items
            }
          })
          setVoteAreaItems({ technical: map.technical, creative: map.creative, following: map.following })
        } catch { setVoteAreaItems({ technical: [], creative: [], following: [] }) }
      }

      setLoading(false)
    }
    if (open) load()
    return () => { mounted = false }
  }, [submissionId, open, area, areaKey])

  // runtime instrumentation for dev: log when aggregated drawer mounts
  // (moved below aggregatedByReviewer declaration to avoid TDZ access)

  // --- dettaglio submission: reviews (per fallback singola area)
  function findReviewArrayDeep(obj: unknown): Review[] | null {
    const hasTextFields = (o: unknown): boolean => {
      if (!o || typeof o !== "object") return false
      const r = o as Record<string, unknown>
      return Boolean(
        r.comment || r.text || r.body || r.technical_comment || r.creative_comment || r.following_comment
      )
    }
    const queue: unknown[] = []
    if (obj && typeof obj === "object") queue.push(obj)
    while (queue.length) {
      const cur = queue.shift()
      if (!cur || typeof cur !== "object") continue
      const curObj = cur as Record<string, unknown>
      for (const k of Object.keys(curObj)) {
        const v = curObj[k]
        if (Array.isArray(v) && v.length) {
          const arr = v as unknown[]
          const first = arr[0]
          if (first && typeof first === "object" && hasTextFields(first)) {
            return v as Review[]
          }
        }
        if (v && typeof v === "object") queue.push(v)
      }
    }
    return null
  }

  const primaryReviews = (
    ((data as Record<string, unknown> | null)?.reviews as Review[] | undefined) ??
    ((data as Record<string, unknown> | null)?._reviews as Review[] | undefined) ??
    ((data as Record<string, unknown> | null)?.results as Review[] | undefined)
  ) as Review[] | undefined

  const deepReviews = React.useMemo(() => {
    return (!primaryReviews || primaryReviews.length === 0) ? findReviewArrayDeep(data) : null
  }, [data, primaryReviews])

  const reviews = React.useMemo(() => {
    return (primaryReviews ?? deepReviews ?? []) as Review[]
  }, [primaryReviews, deepReviews])

  // === SINGLE AREA (rimane come prima, ma preferendo *_comment) ===
  const textualItems = React.useMemo(() => {
    const key = (normalizedArea as "technical"|"creative"|"following"|"strengths"|"suggestions"|"final"|null)
    if (!key) return []
    if (Array.isArray(areaItems) && areaItems.length > 0) {
      return (areaItems as Review[]).map((it) => ({
        reviewer: it.reviewer ?? undefined,
        // include generic fields as fallback when area-specific ones are missing
        comment: pickRaw(it, `${key}_comment`, `${key}_text`, 'comment', 'text', 'body') || ""
      })).filter(it => it.comment && String(it.comment).trim())
    }
    // fallback: use only per-area fields from reviews; do NOT parse blob for vote areas
    return (reviews || []).map((r: Review) => ({
      reviewer: r.reviewer ?? undefined,
      comment: (getPerAreaCommentStrict(r as Review, key as "technical"|"creative"|"following") || "").toString().trim()
    })).filter(it => it.comment && String(it.comment).trim())
  }, [areaItems, reviews, normalizedArea])

  // === AGGREGATO: una card per reviewer, SOLO sezioni presenti ===
  type ReviewerBundle = {
    key: string
    reviewer: Reviewer | string | null
    latestAt: number
    technical?: string | null
    creative?: string | null
    following?: string | null
  }

  const aggregatedByReviewer = React.useMemo<ReviewerBundle[]>(() => {
    if (areaKey) return []

    // 1) costruisci mappe reviewer->comment per ciascuna area SOLO da fonti per-area
  const buildMap = (area: "technical"|"creative"|"following", items: Review[]) => {
      const m = new Map<string, { reviewer: Reviewer | string | null; comment: string | null; ts: number }>()
      for (const it of (items || [])) {
        const key = getReviewerKey(it.reviewer)
    const c = getPerAreaCommentAggregated(it, area) // <-- niente blob qui, aggregato strict
        const ts = it.reviewed_at ? Date.parse(String(it.reviewed_at)) : 0
        if (!c) continue
        const prev = m.get(key)
        if (!prev || ts > prev.ts) m.set(key, { reviewer: it.reviewer ?? null, comment: c, ts })
      }
      return m
    }

    const techMap = buildMap("technical", voteAreaItems.technical ?? [])
    const creatMap = buildMap("creative",  voteAreaItems.creative  ?? [])
    const follMap  = buildMap("following", voteAreaItems.following ?? [])

    // 2) se tutto vuoto (improbabile), fallback a campi *_comment in reviews (NO blob)
    const emptyAll = techMap.size === 0 && creatMap.size === 0 && follMap.size === 0
    if (emptyAll && reviews.length) {
      for (const r of reviews) {
        const key = getReviewerKey(r.reviewer)
        const ts = r.reviewed_at ? Date.parse(String(r.reviewed_at)) : 0
        const maybeSet = (map: Map<string, { reviewer: Reviewer | string | null; comment: string | null; ts: number }>, area: "technical"|"creative"|"following", val: string | null) => {
          if (!val) return
          const prev = map.get(key)
          if (!prev || ts > prev.ts) map.set(key, { reviewer: r.reviewer ?? null, comment: val, ts })
        }
        maybeSet(techMap,  "technical", pickRaw(r, "technical_comment") as string | null)
        maybeSet(creatMap, "creative",  pickRaw(r, "creative_comment")  as string | null)
        maybeSet(follMap,  "following", pickRaw(r, "following_comment") as string | null)
      }
    }

    // 3) unisci per reviewer e tieni SOLO le sezioni esistenti
    const keys = new Set<string>([...techMap.keys(), ...creatMap.keys(), ...follMap.keys()])
    const out: ReviewerBundle[] = []
    for (const k of keys) {
      const t = techMap.get(k)
      const c = creatMap.get(k)
      const f = follMap.get(k)
      const reviewer = t?.reviewer ?? c?.reviewer ?? f?.reviewer ?? null
      const latestAt = Math.max(t?.ts ?? 0, c?.ts ?? 0, f?.ts ?? 0)
      // salta bundle completamente vuoti (non dovrebbe accadere)
      if (!t && !c && !f) continue
      out.push({
        key: k, reviewer, latestAt,
        ...(t ? { technical: t.comment } : {}),
        ...(c ? { creative:  c.comment } : {}),
        ...(f ? { following: f.comment } : {}),
      })
    }

    // ordina per più recente
    out.sort((a, b) => b.latestAt - a.latestAt)
    return out
  }, [areaKey, voteAreaItems, reviews])

  // runtime instrumentation for dev: log when aggregated drawer mounts
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && open && !areaKey) {
      try {
        console.info('[AGG] aggregated drawer opened', { voteAreaItemsLength: { technical: voteAreaItems.technical.length, creative: voteAreaItems.creative.length, following: voteAreaItems.following.length }, aggregatedByReviewerLength: aggregatedByReviewer.length })
  } catch { /* ignore */ }
    }
  }, [open, areaKey, voteAreaItems, aggregatedByReviewer])

  const title = (() => {
    const ex = data?.exercise as Record<string, unknown> | undefined
    return (ex && (ex.title as string)) ?? (data?.title as string) ?? `Feedback`
  })()

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent aria-describedby="feedback-drawer-desc" className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription id="feedback-drawer-desc">
            View textual feedback for this submission — only written comments are shown.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div>Loading…</div>
        ) : error ? (
          <div className="text-rose-600">{error}</div>
        ) : !areaKey ? (
          // === AGGREGATO: 1 card per reviewer, SOLO sezioni presenti (nessun blob)
          <div className="mt-3 max-h-[70vh] overflow-y-auto space-y-4 pr-1">
            {aggregatedByReviewer.length === 0 ? (
              <div className="text-sm text-muted-foreground">No reviews yet</div>
            ) : (
              aggregatedByReviewer.map((rb) => (
                <Card key={rb.key}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar><AvatarFallback>{reviewerInitials(rb.reviewer)}</AvatarFallback></Avatar>
                      <div className="text-sm font-medium">{reviewerToString(rb.reviewer)}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {rb.technical && (
                      <div className="rounded border p-3">
                        <div className="text-xs font-semibold mb-1">{areaLabel("technical")}</div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {renderCommentValue(rb.technical)}
                        </div>
                      </div>
                    )}
                    {rb.creative && (
                      <div className="rounded border p-3">
                        <div className="text-xs font-semibold mb-1">{areaLabel("creative")}</div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {renderCommentValue(rb.creative)}
                        </div>
                      </div>
                    )}
                    {rb.following && (
                      <div className="rounded border p-3">
                        <div className="text-xs font-semibold mb-1">{areaLabel("following")}</div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {renderCommentValue(rb.following)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          // === SINGLE AREA: lista piatta (preferendo *_comment, poi fallback)
          <Card>
            <CardHeader>
              <h4 className="font-medium">{areaLabel(areaKey)}</h4>
            </CardHeader>
            <CardContent>
              {(() => {
                if (textualItems.length === 0) {
                  return <div className="text-sm text-muted-foreground">No reviews yet</div>
                }
                return textualItems.map((it, idx) => (
                  <div key={idx} className="border rounded p-3 mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar><AvatarFallback>{reviewerInitials(it.reviewer)}</AvatarFallback></Avatar>
                      <div className="text-sm font-medium">{reviewerToString(it.reviewer)}</div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {renderCommentValue(it.comment)}
                    </div>
                  </div>
                ))
              })()}
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}
