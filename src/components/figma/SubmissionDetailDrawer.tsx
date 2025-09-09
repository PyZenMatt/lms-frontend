import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { getSubmission } from "../../services/reviews"

export function SubmissionDetailDrawer({ submissionId, open, onClose }: { submissionId: number | null; open: boolean; onClose: () => void }) {
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<any | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      if (!submissionId) return
      setLoading(true)
      setError(null)
      const res = await getSubmission(submissionId)
      if (!mounted) return
      if (res.ok) setData(res.data)
      else setError(`Errore caricamento submission (HTTP ${res.status})`)
      setLoading(false)
    }
    if (open) load()
    return () => { mounted = false }
  }, [submissionId, open])

  // helper: submission payload fields (normalize common variants)
  const submissionText = data?.text ?? data?.content ?? data?.student_note ?? ""
  const exerciseTitle = data?.exercise?.title ?? data?.title ?? data?.exercise_title ?? "Submission"
  const courseTitle = data?.course?.title ?? data?.course_title ?? data?.course ?? null
  const files = data?.files ?? data?.attachments ?? []

  const renderFilePreview = (f: any, i: number) => {
    const url = f?.url ?? f
    const name = f?.name ?? `attachment-${i}`
    const lower = String(url ?? '').toLowerCase()
    if (!url) return null
    // image
    if (lower.match(/\.(png|jpg|jpeg|gif|webp)$/) || lower.includes('image/')) {
      return (
        <a key={i} href={url} target="_blank" rel="noreferrer" className="block w-full h-48 bg-slate-100 rounded overflow-hidden">
          <img src={url} alt={name} className="w-full h-full object-contain" />
        </a>
      )
    }
    // pdf
    if (lower.endsWith('.pdf')) {
      return (
        <a key={i} href={url} target="_blank" rel="noreferrer" className="block w-full h-48 bg-slate-100 rounded overflow-hidden p-2">
          <object data={url} type="application/pdf" className="w-full h-full">PDF: {name}</object>
        </a>
      )
    }
    // fallback: link
    return (
      <a key={i} href={url} target="_blank" rel="noreferrer" className="block w-full h-12 bg-slate-100 rounded overflow-hidden p-2 text-sm">
        {name}
      </a>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent aria-describedby="submission-drawer-desc">
        <DialogHeader>
          <DialogTitle>
            {exerciseTitle ? `${exerciseTitle}${courseTitle ? ` — ${courseTitle}` : ''}` : `Submission`}
          </DialogTitle>
          <DialogDescription id="submission-drawer-desc">Submission details and attachments.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div>Loading…</div>
        ) : error ? (
          <div className="text-rose-600">{error}</div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded p-4">
              <h3 className="text-lg font-medium">{exerciseTitle}</h3>
              {courseTitle && <div className="text-sm text-muted-foreground">{courseTitle}</div>}
              {submissionText ? (
                <div className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{submissionText}</div>
              ) : (
                <div className="mt-3 text-sm text-muted-foreground">No submission text available.</div>
              )}
              {Array.isArray(files) && files.length > 0 && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {files.map((f: any, i: number) => renderFilePreview(f, i))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
