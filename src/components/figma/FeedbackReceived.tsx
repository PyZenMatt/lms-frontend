import React from "react"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Badge } from "./ui/badge"
import { Star } from "lucide-react"
import { listMySubmissions } from "../../services/reviews"
import { FeedbackDetailDrawer } from "./FeedbackDetailDrawer"
import { SubmissionDetailDrawer } from "./SubmissionDetailDrawer"

function mapAreaField(key: string): string {
  const k = String(key).toLowerCase()
  if (k === "technique" || k === "technical") return "technical"
  if (k.startsWith("creat")) return "creative"
  if (k.startsWith("follow")) return "following"
  return k
}

function getScoreForArea(item: any, key: string): number {
  const field = mapAreaField(key)
  const raw = item?.[field] ?? item?.score ?? item?.value ?? 0
  const n = Number(raw)
  return Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : 0
}

export function FeedbackReceived({ selectedSubmissionId }: { selectedSubmissionId?: number | null }) {
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [openSubmission, setOpenSubmission] = React.useState<number | null>(null)
  const [openDetail, setOpenDetail] = React.useState<{ submissionId: number; area?: string } | null>(null)

  React.useEffect(() => {
    if (selectedSubmissionId) setOpenSubmission(selectedSubmissionId)
  }, [selectedSubmissionId])

  React.useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const res = await listMySubmissions()
      if (!mounted) return
      if (res.ok) setItems(res.data)
      else setError(`Impossibile caricare feedback (HTTP ${res.status})`)
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="space-y-4">
      {loading ? <div>Loading…</div> : error ? <div className="text-rose-600">{error}</div> : (
        <div className="space-y-4">
          {items.map(it => (
            <Card key={it.submission_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{it.exercise?.title}</p>
                    <p className="text-sm text-muted-foreground">{it.course?.title}</p>
                  </div>
                  <Badge>{it.feedback?.received ?? 0}/{it.feedback?.expected ?? 0}</Badge>
                </div>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(it.areas ?? []).map((area: any) => (
                  <div key={area.key} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{area.label ?? area.key}</p>
                        {/* media come numero (resta compatibile) */}
                        <p className="font-medium">{area.avg ?? "—"}</p>
                      </div>
                      <div className="text-sm">{area.received}/{area.expected}</div>
                    </div>

                    {/* elenco dei PRIMI 3 reviewer con VOTO (stelle) per l'area */}
                    <div className="mt-2 text-sm">
                      {(area.items ?? []).slice(0,3).map((it2: any, i: number) => {
                        const score = getScoreForArea(it2, area.key)
                        const name = it2.reviewer?.name ?? it2.reviewer?.username ?? "Reviewer"
                        return (
                          <div key={i} className="mb-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{name}</div>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, sIdx) => (
                                  <Star
                                    key={sIdx}
                                    className={`size-3 ${sIdx < score ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Per-area CTA: opens single-area feedback drawer */}
                    <div className="mt-3 flex justify-end">
                      <button
                        className="text-sm underline"
                        onClick={() => setOpenDetail({ submissionId: it.submission_id, area: String(mapAreaField(area.key)) })}
                      >
                        View all
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
              <div className="p-3 border-t flex justify-end">
                <button
                  className="text-sm underline"
                  onClick={() => setOpenDetail({ submissionId: it.submission_id })}
                >
                  View feedback
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dettaglio submission (generico) */}
      <SubmissionDetailDrawer submissionId={openSubmission} open={Boolean(openSubmission)} onClose={() => setOpenSubmission(null)} />

      {/* Dettaglio area: SOLO feedback testuali per l'area selezionata */}
      {openDetail && (
        <FeedbackDetailDrawer
          submissionId={openDetail.submissionId}
          open={true}
          area={openDetail.area}
          onClose={() => setOpenDetail(null)}
        />
      )}
    </div>
  )
}
