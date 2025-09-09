import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { getSubmission, getAreaFeedback } from "../../services/reviews"

type AreaKey =
  | "technical"
  | "technique"
  | "creative"
  | "following"
  | "strengths"
  | "suggestions"
  | "final"
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

type Reviewer = {
  name?: string
  username?: string
}

type Review = {
  reviewer?: Reviewer | string
  comment?: string | null
  content?: unknown
  text?: string | null
  body?: string | null
  [k: string]: unknown
}

function areaLabel(k?: AreaKey | null) {
  switch (k) {
    case "technical":
      return "Technique"
    case "creative":
      return "Creative"
    case "following":
      return "Following"
    case "strengths":
      return "Highlight Strengths"
    case "suggestions":
      return "Constructive Suggestions"
    case "final":
      return "Final Thoughts"
    default:
      return "Feedback"
  }
}

function pickAreaText(review: Review | null, area: AreaKey | null): string | null {
  if (!review) return null
  // Helper: prefer explicit textual fields and avoid rating-like strings
  const isRatingLike = (val: unknown) => {
    if (val == null) return false
    const s = String(val)
    if (!s.trim()) return false
    const numOnly = /^\s*\d+(?:\.\d+)?\s*$/
    const ratingPattern = /(Technical|Technique|Creative|Following).{0,40}\d\s*\/\s*5/i
    return numOnly.test(s) || ratingPattern.test(s)
  }

  const pickRaw = (...keys: (keyof Review | string)[]) => {
    const r = review as Record<string, unknown>
    for (const k of keys) {
      const v = r[k]
      if (v == null) continue
      const s = String(v)
      if (!s.trim()) continue
      // avoid returning rating-like values
      if (isRatingLike(s)) continue
      return s
    }
    return null
  }

  // If no specific area requested, prefer comment/text/body and avoid content if it's a rating
  if (!area) return (pickRaw('comment', 'text', 'body', 'content')) as string | null

  // 1) campi dedicati (se esistono)
  const direct = pickRaw(`${area}_comment`, `${area}_text`, area)
  if (direct) return direct.trim()

  // 2) fallback: commento unico
  // Try to obtain a whole-text candidate avoiding rating-like blobs
  const whole = pickRaw('comment', 'text', 'body', 'content') as string | null
  if (!whole) return null

  // 3) parsing soft per sezioni tipiche (se presenti nel testo unico)
  const rx: Record<string, RegExp> = {
    strengths: /Highlight\s*Strengths[\s: -]*([\s\S]*?)(?=Constructive\s*Suggestions|Final\s*Thoughts|$)/i,
    suggestions: /Constructive\s*Suggestions[\s: -]*([\s\S]*?)(?=Final\s*Thoughts|Highlight\s*Strengths|$)/i,
    final: /Final\s*Thoughts[\s: -]*([\s\S]*?)$/i,
    technical: /(?:Technical|Technique)[\s: -]*([\s\S]*?)$/i,
    creative: /Creative[\s: -]*([\s\S]*?)$/i,
    following: /Following[\s: -]*([\s\S]*?)$/i,
  }

  const matcher = area && rx[area] ? rx[area] : null

  if (matcher) {
    const m = whole.match(matcher)
    if (m && m[1]) return m[1].trim()
  }

  // 4) ultimo fallback: tutto il commento
  return whole.trim() || null
}

function reviewerToString(rev?: Reviewer | string) {
  if (!rev) return "Reviewer"
  if (typeof rev === "string") return rev
  return rev.name ?? rev.username ?? "Reviewer"
}

function reviewerInitials(rev?: Reviewer | string) {
  const s = reviewerToString(rev)
  return String(s).slice(0, 2)
}

function renderCommentValue(v: unknown) {
  if (v == null) return "— Nessun commento testuale per questa sezione —"
  const s = String(v)
  if (!s.trim()) return "— Nessun commento testuale per questa sezione —"
  return s
}

export function FeedbackDetailDrawer({
  submissionId,
  open,
  onClose,
  area,
}: {
  submissionId: number | null
  open: boolean
  onClose: () => void
  /** quando valorizzata, mostra SOLO i feedback testuali della sezione */
  area?: AreaKey
}) {
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<Record<string, unknown> | null>(null)
  const [areaItems, setAreaItems] = React.useState<Review[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const areaKey = normalizeAreaKey(area ?? null)

  // Ensure we accept and normalize area keys passed from parent (Technique -> technical etc.)
  const normalizedArea = React.useMemo(() => {
    const s = String(area ?? "").toLowerCase()
    if (s === "technique" || s === "technical") return "technical"
    if (s.startsWith("creat")) return "creative"
    if (s.startsWith("follow")) return "following"
    if (!s) return null
    return s
  }, [area])

  // textualItems will be computed later after reviews is known

  React.useEffect(() => {
    let mounted = true
    async function load() {
      if (!submissionId) return
      setLoading(true)
      setError(null)
      const res = await getSubmission(submissionId)
      if (!mounted) return
      if (res.ok) setData(res.data)
      else setError(`Errore caricamento dettagli feedback (HTTP ${res.status})`)

      // Debug logs (temporary): inspect what the detail endpoint returned
      if (res.ok && 'data' in res) {
  const cnt = (res as unknown as { data?: { reviews?: unknown[] } }).data?.reviews?.length ?? null
  console.log('[Drawer:detail] reviews_count=', cnt)
      }

      // If an area is requested, always fetch area-specific items, including
      // vote-based areas (technical/creative/following). The backend endpoint
      // exposes textual per-area comments for these as well; we explicitly avoid
      // using numeric `content`.
      if (areaKey && submissionId) {
        // map frontend canonical keys to backend query keys
        const mapToBackendArea = (k: AreaKey | null) => {
          if (!k) return k
          if (k === "strengths") return "highlights"
          if (k === "suggestions") return "suggestions"
          if (k === "final") return "final"
          return k
        }
        try {
          const areaParam = mapToBackendArea(areaKey)
          const ares = await getAreaFeedback(submissionId, String(areaParam))
          if (!mounted) return
          if (ares.ok && Array.isArray(ares.data?.items)) {
            const itcnt = (ares as unknown as { data?: { items?: unknown[] } }).data?.items?.length ?? null
            console.log('[Drawer:area]', areaParam, 'items_count=', itcnt)
            // Normalize items: prefer explicit comment/text/body fields and
            // avoid treating numeric `content` (rating) as textual content.
            const normalized = (ares.data.items as unknown[]).map((it) => {
              const item = it as Record<string, unknown>
              const commentText =
                (item.comment as string) ?? (item.text as string) ?? (item.body as string) ?? null

              return {
                ...item,
                // expose `comment` as primary textual field for renderer
                // IMPORTANT: do NOT fall back to `content` which may contain numeric ratings
                comment: commentText ?? null,
              }
            })
            setAreaItems(normalized)
          } else {
            setAreaItems(null)
          }
        } catch {
          setAreaItems(null)
        }
      } else {
        setAreaItems(null)
      }
      setLoading(false)
    }
    if (open) load()
    return () => {
      mounted = false
    }
  }, [submissionId, open, area, areaKey])

  // Try multiple common keys the service may populate: reviews, _reviews, results
  // and fallback to a deep search for the first array-like object that looks like reviews
  function findReviewArrayDeep(obj: unknown): Review[] | null {
    const hasTextFields = (o: unknown): boolean => {
      if (!o || typeof o !== 'object') return false
      const r = o as Record<string, unknown>
      return Boolean(
        r.comment || r.text || r.body || r.technical_comment || r.creative_comment || r.following_comment
      )
    }

    const queue: unknown[] = []
    if (obj && typeof obj === 'object') queue.push(obj)

    while (queue.length) {
      const cur = queue.shift()
      if (!cur || typeof cur !== 'object') continue
      const curObj = cur as Record<string, unknown>
      for (const k of Object.keys(curObj)) {
        const v = curObj[k]
        if (Array.isArray(v) && v.length) {
          const arr = v as unknown[]
          const first = arr[0]
          if (first && typeof first === 'object' && hasTextFields(first)) {
            return v as Review[]
          }
        }
        if (v && typeof v === 'object') queue.push(v)
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

  // Build textual items for the selected area: prefer explicit areaItems (from area endpoint),
  // otherwise derive from submission-level reviews using per-area *_comment fields or blob parsing
  const textualItems = React.useMemo(() => {
    const key = normalizedArea as string | null
    const perKey = key ? `${key}_comment` : null

    // prefer areaItems returned by area endpoint if present and non-empty
    if (Array.isArray(areaItems) && areaItems.length > 0) {
      return (areaItems as Review[]).map((it) => ({ reviewer: it.reviewer ?? undefined, comment: (it.comment ?? "") as string }))
    }

    // otherwise, derive from submission-level reviews
    const list = (reviews || []).map((r: Review) => {
      const rObj = r as unknown as Record<string, unknown>
      const byArea = perKey ? (rObj[perKey] as string | null) : null
      const fromBlob = pickAreaText(r, key as AreaKey | null)
      const anyText = (byArea && String(byArea).trim()) ? byArea : (fromBlob ?? (r.comment ?? r.text ?? r.body ?? ""))
      return { reviewer: r.reviewer ?? undefined, comment: String(anyText || "").trim() }
    }).filter(it => it.comment && String(it.comment).trim().length > 0)

    return list
  }, [areaItems, reviews, normalizedArea])

  const title = (() => {
    const ex = data?.exercise as Record<string, unknown> | undefined
    return (ex && (ex.title as string)) ?? (data?.title as string) ?? `Feedback`
  })()

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent aria-describedby="feedback-drawer-desc">
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
        ) : error ? (
          <div className="text-rose-600">{error}</div>
        ) : !areaKey ? (
          // Fallback legacy: vista a 3 card se non è stata passata l'area
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Technical", "Creative", "Following"].map((legacyArea) => (
              <Card key={legacyArea}>
                <CardHeader>
                  <h4 className="font-medium">{legacyArea}</h4>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 && (
                    <>
                      <div className="text-sm text-muted-foreground">No reviews yet</div>
                      {/* dev debug: dump data shape when reviews empty */}
                      {process.env.NODE_ENV === 'development' && (
                        <pre className="text-xs text-muted-foreground mt-2">{JSON.stringify(data, null, 2)}</pre>
                      )}
                    </>
                  )}
                        {reviews.map((r, ri) => (
                    <div key={ri} className="border rounded p-3 mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {reviewerInitials(r.reviewer)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {reviewerToString(r.reviewer)}
                          </div>
                        </div>
                      </div>
                      {/* For vote-area legacy cards (Technical/Creative/Following) prefer
                          the dedicated per-area comment fields (technical_comment,
                          creative_comment, following_comment). Avoid showing the
                          composite `comment` blob which may contain multiple
                          labelled sections (Suggestions/Final) and looks messy in
                          the compact card view. If the dedicated field is empty,
                          try to extract the specific section from the composite
                          `comment` using existing `pickAreaText` logic; otherwise
                          render the placeholder. */}
                      {(() => {
                        // ✅ Use the card's label to select the per-area field
                        const mapKey = (lbl: 'Technical' | 'Creative' | 'Following') => {
                          switch (lbl) {
                            case 'Technical':
                              return 'technical_comment'
                            case 'Creative':
                              return 'creative_comment'
                            case 'Following':
                              return 'following_comment'
                          }
                        }

                        const label = legacyArea as 'Technical' | 'Creative' | 'Following'
                        const perKey = mapKey(label)
                        const perVal = perKey ? (r as Record<string, unknown>)[perKey] as string | null : null

                        if (perVal && String(perVal).trim()) {
                          return (
                            <div className="mt-2 text-sm text-muted-foreground">
                              {renderCommentValue(perVal)}
                            </div>
                          )
                        }

                        const extracted = pickAreaText(r, normalizeAreaKey(label))
                        return (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {renderCommentValue(extracted)}
                          </div>
                        )
                      })()}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Modalità richiesta: SOLO feedback testuali per la sezione selezionata
            <Card>
            <CardHeader>
              <h4 className="font-medium">{areaLabel(areaKey)}</h4>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No reviews yet
                </div>
              )}
              {/* Dev debug: if area active but no items and no reviews, show top-level keys */}
              {process.env.NODE_ENV === 'development' && !Array.isArray(areaItems) && areaKey && reviews.length === 0 && (
                <pre className="text-xs text-muted-foreground mb-2">{JSON.stringify({ keys: data ? Object.keys((data ?? {}) as Record<string, unknown>) : [] }, null, 2)}</pre>
              )}
              {textualItems.length === 0 ? (
                <div className="text-sm text-muted-foreground">No reviews yet</div>
              ) : (
                textualItems.map((it, idx) => (
                  <div key={idx} className="border rounded p-3 mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {reviewerInitials(it.reviewer)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm font-medium">
                        {reviewerToString(it.reviewer)}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                      {renderCommentValue(it.comment)}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}
