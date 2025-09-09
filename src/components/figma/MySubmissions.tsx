import React from "react"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { ImageWithFallback } from "./figma/ImageWithFallback"
import { listMySubmissions } from "../../services/reviews"
import { FeedbackDetailDrawer } from "./FeedbackDetailDrawer"
import { SubmissionDetailDrawer } from "./SubmissionDetailDrawer"

export function MySubmissions({ onOpenFeedback }: { onOpenFeedback?: (submissionId: number) => void }) {
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [courseFilter, setCourseFilter] = React.useState<number | null>(null)
  const [openSubmission, setOpenSubmission] = React.useState<number | null>(null)
  const [openFeedback, setOpenFeedback] = React.useState<number | null>(null)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      const res = await listMySubmissions()
      if (!mounted) return
      if (res.ok) setItems(res.data)
      else setError(`Impossibile caricare le tue submissions (HTTP ${res.status})`)
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  const courses = React.useMemo(() => {
    const map = new Map<number, string>()
    items.forEach(it => {
      const course = it.course
      if (course && course.id) map.set(course.id, course.title)
    })
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [items])

  const filtered = (courseFilter ? items.filter((it) => it.course?.id === courseFilter) : items)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">My Submissions</h3>
          <span className="text-sm text-muted-foreground">{items.length} total</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="border rounded px-2 py-1 text-sm"
            value={courseFilter ?? ""}
            onChange={(e) => setCourseFilter(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">All courses</option>
            {courses.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : error ? (
        <div className="text-sm text-rose-600">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground">You have not submitted any exercises yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((it) => (
            <Card key={it.submission_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{it.exercise?.title ?? `Exercise ${it.exercise?.id ?? ''}`}</p>
                    <p className="text-sm text-muted-foreground">{it.course?.title ?? ''}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{it.status ?? 'submitted'}</Badge>
                    <div className="text-sm text-muted-foreground mt-1">{it.created_at ? new Date(it.created_at).toLocaleString() : ''}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  {/* preview: use first file if available */}
                  <ImageWithFallback src={(it.files ?? it.attachments ?? [])[0]?.url ?? (it.files ?? it.attachments ?? [])[0] ?? undefined} alt="preview" className="w-28 h-20 rounded object-cover bg-slate-100" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">Feedback</div>
                      <div className="ml-auto text-sm">
                        <Badge>{it.feedback?.received ?? 0}/{it.feedback?.expected ?? 0}</Badge>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">Overall: {it.overall_avg ?? '—'}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => (onOpenFeedback ? onOpenFeedback(it.submission_id) : setOpenFeedback(it.submission_id))}>Open feedback</Button>
                  <Button variant="ghost" onClick={() => setOpenSubmission(it.submission_id)}>View submission</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
  <SubmissionDetailDrawer submissionId={openSubmission} open={Boolean(openSubmission)} onClose={() => setOpenSubmission(null)} />
  <FeedbackDetailDrawer submissionId={openFeedback} open={Boolean(openFeedback)} onClose={() => setOpenFeedback(null)} />
    </div>
  )
}
