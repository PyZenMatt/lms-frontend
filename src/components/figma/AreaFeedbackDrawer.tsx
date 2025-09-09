import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { getAreaFeedback } from "../../services/reviews"

export function AreaFeedbackDrawer({ submissionId, area, initialItems, open, onClose }: { submissionId: number | null; area: string; initialItems?: any[]; open: boolean; onClose: () => void }) {
  const [loading, setLoading] = React.useState(false)
  const [items, setItems] = React.useState<any[]>(initialItems ?? [])
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      if (!submissionId) return
      setLoading(true)
      setError(null)
      try {
        // Map legacy frontend keys to canonical backend areas
        const keyMap: Record<string, string> = {
          technique: 'highlights',
          composition: 'suggestions',
          creativity: 'final',
        }
        const backendArea = keyMap[area] ?? area
        const res = await getAreaFeedback(submissionId, backendArea)
        if (!mounted) return
        if (res.ok) setItems(res.data.items ?? initialItems ?? [])
        else setError(`HTTP ${res.status}`)
      } catch {
        // fallback: keep initialItems
      }
      setLoading(false)
    }
    if (open) load()
    return () => { mounted = false }
  }, [submissionId, area, open, initialItems])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent aria-describedby="area-drawer-desc">
        <DialogHeader>
          <DialogTitle>{`${(area === 'technique' ? 'Technique' : area === 'composition' ? 'Composition' : area === 'creativity' ? 'Creativity' : area).replace(/\b\w/g, c => c.toUpperCase())} Feedback`}</DialogTitle>
          <DialogDescription id="area-drawer-desc">List of reviewer comments for the selected section.</DialogDescription>
        </DialogHeader>
        {loading ? <div>Loading…</div> : error ? <div className="text-rose-600">{error}</div> : (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => {
              const it = items[i]
              if (!it) return (
                <Card key={i}>
                  <CardContent className="text-sm text-muted-foreground">Empty slot — waiting for reviewer</CardContent>
                </Card>
              )
              return (
                    <Card key={it.review_id ?? i}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar><AvatarFallback>{(it.reviewer?.name ?? 'R').slice(0,2)}</AvatarFallback></Avatar>
                      <div>
                        <div className="font-medium">{it.reviewer?.name ?? it.reviewer?.username ?? 'Reviewer'}</div>
                        <div className="text-xs text-muted-foreground">{new Date(it.created_at ?? '').toLocaleString()}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{it.content ?? it.comment ?? it.comment_text ?? ''}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
