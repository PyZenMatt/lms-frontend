import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
// removed unused UI imports; ReviewInterface owns the form UI
import { Upload, Star, Eye, Award, Users, Sparkles } from "lucide-react"
import { ImageWithFallback } from "./figma/ImageWithFallback"
import { ReviewInterface } from "./ReviewInterface"
import { listAssignedReviews, getSubmission, type AssignedReview, type Submission as ReviewSubmission } from "../../services/reviews"
import React from "react"

interface UISubmission {
  id: string
  studentNote: string
  course: string
  lesson: string
  exerciseTitle: string
  exerciseDescription: string
  image: string
  submittedAt: string
  studentId: string
}

export function PeerReview() {
  const [currentView, setCurrentView] = useState<'list' | 'reviewing'>('list')
  const [selectedSubmission, setSelectedSubmission] = useState<UISubmission | null>(null)

  const [assigned, setAssigned] = React.useState<AssignedReview[]>([])
  const [loadingAssigned, setLoadingAssigned] = React.useState(false)
  const [assignedError, setAssignedError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      setLoadingAssigned(true)
      setAssignedError(null)
      const res = await listAssignedReviews()
      if (!mounted) return
      if (res.ok) setAssigned(res.data)
      else setAssignedError(`Impossibile caricare le revisioni assegnate (HTTP ${res.status})`)
      setLoadingAssigned(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  // when reviewer clicks start, fetch the full submission detail and open review UI
  const handleStartReview = async (it: AssignedReview) => {
    const idToFetch = it.submission_id ?? it.exercise_id
    if (!idToFetch) return
    const res = await getSubmission(Number(idToFetch))
    if (res.ok) {
      const data: ReviewSubmission = res.data
      const ui: UISubmission = {
        id: String(data.id ?? idToFetch),
        studentNote: data.text ?? "",
        course: data.course_id ? String(data.course_id) : (it.course_id ? String(it.course_id) : ""),
        lesson: data.lesson_id ? String(data.lesson_id) : (it.lesson_id ? String(it.lesson_id) : ""),
        exerciseTitle: data.title ?? it.exercise_title ?? `Esercizio #${data.exercise_id ?? it.exercise_id ?? idToFetch}`,
        exerciseDescription: data.text ?? "",
        image: data.files && data.files.length > 0 ? String(data.files[0].url) : "",
        submittedAt: String(it.submitted_at ?? data.created_at ?? ""),
        studentId: String(data.student?.id ?? it.student?.id ?? ""),
      }
      setSelectedSubmission(ui)
      setCurrentView('reviewing')
    } else {
      // fallback: open a minimal synthesised submission when backend detail not available
      const ui: UISubmission = {
        id: String(idToFetch),
        studentNote: "",
        course: it.course_id ? String(it.course_id) : "",
        lesson: it.lesson_id ? String(it.lesson_id) : "",
        exerciseTitle: it.exercise_title ?? `Esercizio #${it.exercise_id ?? idToFetch}`,
        exerciseDescription: "",
        image: "",
        submittedAt: "",
        studentId: "",
      }
      setSelectedSubmission(ui)
      setCurrentView('reviewing')
    }
  }

  const handleCompleteReview = () => {
    setCurrentView('list')
    setSelectedSubmission(null)
  }

  if (currentView === 'reviewing' && selectedSubmission) {
    return (
      <ReviewInterface 
        submission={selectedSubmission}
        onBack={() => setCurrentView('list')}
        onComplete={handleCompleteReview}
      />
    )
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Peer Review Studio</h1>
          <p className="text-muted-foreground">Submit your work and help fellow artists grow through constructive feedback</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 border-blue-200">
            <Eye className="size-3 mr-1" />
            {loadingAssigned ? 'Loading…' : assignedError ? 'Errore caricamento' : `${assigned.length} pending review${assigned.length === 1 ? '' : 's'}`}
          </Badge>
          {/* Submit Exercise button intentionally removed for peer-review page */}
        </div>
      </div>

      <Tabs defaultValue="review-others" className="space-y-6">
        <TabsList>
          <TabsTrigger value="review-others">Review Others</TabsTrigger>
          <TabsTrigger value="my-submissions">My Submissions</TabsTrigger>
          <TabsTrigger value="feedback-received">Feedback Received</TabsTrigger>
        </TabsList>

        <TabsContent value="review-others" className="space-y-4">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Award className="size-5 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Ready to Review</CardTitle>
                  <CardDescription>Help your peers grow while earning Creator Tokens</CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-800">+5 ✨ each</Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {loadingAssigned ? (
              <div className="text-sm text-muted-foreground">Caricamento assegnamenti…</div>
            ) : assignedError ? (
              <div className="text-sm text-rose-600">{assignedError}</div>
            ) : assigned.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nessuna revisione assegnata al momento.</div>
            ) : (
              assigned.map((it, idx) => (
                <Card key={String(it.submission_id ?? it.exercise_id ?? idx)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{(it.student?.name ?? 'AN').slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{it.student?.name ?? 'Studente anonimo'}</p>
                        <p className="text-sm text-muted-foreground">{it.exercise_title ?? `Esercizio ${it.exercise_id}`} • {it.course_id ? `Corso ${it.course_id}` : ''}</p>
                      </div>
                      <Badge variant="outline">{it.submitted_at ? new Date(it.submitted_at).toLocaleString() : 'In attesa'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">{it.exercise_title ?? `Esercizio ${it.exercise_id}`}</p>
                      <ImageWithFallback 
                        src={undefined}
                        alt="Artwork preview"
                        className="w-full h-48 rounded-lg object-cover bg-slate-100"
                      />
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">Student's Note:</p>
                      <p className="text-sm text-muted-foreground">{it.status ?? ''}</p>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => handleStartReview(it)}
                    >
                      Start Review (+5 ✨)
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="feedback-received" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1578228406113-77951bb64eff?w=60&h=60&fit=crop&crop=center"
                  alt="Light and shadow study"
                  className="size-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium">Light & Shadow Study</p>
                  <p className="text-sm text-muted-foreground">Digital Painting Fundamentals • Lesson 2</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`size-3 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">4.2 average</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Review 1 */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback>R1</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Anonymous Reviewer 1</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`size-3 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Technical Skills</p>
                    <p className="font-medium">4/5</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Creativity</p>
                    <p className="font-medium">4/5</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Following Brief</p>
                    <p className="font-medium">5/5</p>
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Feedback:</p>
                  <p className="text-sm text-muted-foreground">"Great work on the shadow casting! Your understanding of light direction is solid. One suggestion: try pushing the contrast more in the darkest shadows to create more dramatic depth. The composition is well thought out."</p>
                </div>
              </div>

              {/* Review 2 */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback>R2</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Anonymous Reviewer 2</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`size-3 ${i < 5 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Technical Skills</p>
                    <p className="font-medium">5/5</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Creativity</p>
                    <p className="font-medium">4/5</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Following Brief</p>
                    <p className="font-medium">5/5</p>
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Feedback:</p>
                  <p className="text-sm text-muted-foreground">"Excellent attention to detail! Your light source is consistent throughout the piece. I love how you handled the reflected light in the shadows. This shows strong foundational understanding."</p>
                </div>
              </div>

              {/* Review 3 */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback>R3</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Anonymous Reviewer 3</p>
                    <div className="flex items-center gap-1">
                      {[...Array(3)].map((_, i) => (
                        <Star key={i} className="size-3 fill-yellow-400 text-yellow-400" />
                      ))}
                      {[...Array(2)].map((_, i) => (
                        <Star key={i + 3} className="size-3 text-muted-foreground" />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Technical Skills</p>
                    <p className="font-medium">3/5</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Creativity</p>
                    <p className="font-medium">3/5</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Following Brief</p>
                    <p className="font-medium">4/5</p>
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Feedback:</p>
                  <p className="text-sm text-muted-foreground">"Good start! The basic light and shadow concepts are there. For improvement, work on smoother gradations between light and shadow areas. Also consider studying more reference photos for realistic shadow behavior."</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Process Guide */}
      <Card>
        <CardHeader>
          <CardTitle>How Peer Review Works</CardTitle>
          <CardDescription>Understanding our collaborative learning system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="size-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Upload className="size-6 text-blue-600" />
              </div>
              <h4>1. Submit Your Work</h4>
              <p className="text-sm text-muted-foreground">Upload your lesson exercise with a brief note about your goals and challenges.</p>
            </div>
            <div className="text-center space-y-2">
              <div className="size-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="size-6 text-green-600" />
              </div>
              <h4>2. Get Reviewed</h4>
              <p className="text-sm text-muted-foreground">Three anonymous peers will provide constructive feedback on your work.</p>
            </div>
            <div className="text-center space-y-2">
              <div className="size-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="size-6 text-purple-600" />
              </div>
              <h4>3. Review Others</h4>
              <p className="text-sm text-muted-foreground">Help fellow students by reviewing their work and earn Creator Tokens.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}