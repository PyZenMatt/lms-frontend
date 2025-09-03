import React, { useState, useEffect, useRef, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
// Avatar not used in this file
import { Textarea } from "./ui/textarea"

// Stable wrapper around Textarea that logs mount/unmount and forwards ref.
const TextareaWithMountLogger = (function () {
  const Component = (props: React.ComponentProps<typeof Textarea> & { ref?: React.Ref<HTMLTextAreaElement> }, ref: React.Ref<HTMLTextAreaElement> | null) => {
    const localRef = useRef<HTMLTextAreaElement | null>(null)
    useEffect(() => {
      console.debug('[CourseViewer] TextareaWithMountLogger mounted', { localRef: localRef.current })
      return () => { console.debug('[CourseViewer] TextareaWithMountLogger unmounted') }
    }, [])
    return (
      <Textarea
        {...props}
        ref={(el: HTMLTextAreaElement | null) => {
          localRef.current = el
          if (!ref) return
          if (typeof ref === 'function') {
            try { (ref as (el: HTMLTextAreaElement | null) => void)(el) } catch (e) { console.debug('ref function call failed', e) }
          } else {
            try { (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el } catch (e) { console.debug('ref assignment failed', e) }
          }
        }}
      />
    )
  }
  return React.forwardRef(Component) as unknown as React.FC<React.ComponentProps<typeof Textarea>> & { displayName?: string }
})()
TextareaWithMountLogger.displayName = 'TextareaWithMountLogger'
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Lock, 
  Clock, 
  FileText, 
  Upload,
  BookOpen,
  Target,
  // Award,
  Users,
  Star
} from "lucide-react"
import { useAuth } from "./AuthContext"
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markLessonComplete } from '@/services/lessons'
import { submitExercise, listMyExercises, getMySubmission } from '@/services/exercises'
import { useCourseOutline } from '@/hooks/useCourseOutline'
import { ImageWithFallback } from "./figma/ImageWithFallback"
import { toast } from "sonner"

interface Lesson {
  id: string
  title: string
  description: string
  duration: string
  videoUrl?: string
  content: string
  exercise?: {
  id?: number
  title: string
  description?: string | null
  timeEstimate?: string
  completed?: boolean
  unlocked?: boolean
  submission?: string | null
  submissionFiles?: { name: string; url: string | null; mime?: string | null }[]
  }
  completed: boolean
  locked: boolean
  order: number
}

interface Course {
  id: string
  title: string
  description: string
  instructor: string
  instructorAvatar: string
  thumbnail: string
  level: 'beginner' | 'intermediate' | 'advanced'
  duration: string
  students: number
  rating: number
  reviews: number
  progress: number
  lessons: Lesson[]
}

interface CourseViewerProps {
  courseId: string
  onBack: () => void
  onNavigateToPage?: (page: string) => void
}

export function CourseViewer({ courseId, onBack, onNavigateToPage }: CourseViewerProps) {
  const { updateTokens } = useAuth()
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'exercise'>('content')
  // Use a ref for the exercise text to avoid parent re-renders on each keystroke
  const exerciseSubmissionRef = useRef<string>("")
  const renderCount = useRef(0)
  renderCount.current += 1

  // Fetch real data via hook
  const { data, isLoading, isError, error } = useCourseOutline(courseId)

  // Map API lessons into local shape and memoize to avoid remounting children on every render
  const course: Course = useMemo(() => {
    const apiLessons = data?.lessons ?? []
    return {
      id: String(courseId),
      title: data?.course?.title ?? "Caricamento...",
      description: "",
      instructor: data?.course?.teacher?.username ?? "",
      instructorAvatar: data?.course?.cover ?? "",
      thumbnail: data?.course?.cover ?? "",
      level: 'beginner',
      duration: '',
      students: 0,
      rating: 0,
      reviews: 0,
      progress: data?.progress?.percent ?? 0,
      lessons: apiLessons.map((l, idx) => ({
        id: String(l.id ?? idx),
        title: l.title ?? `Lezione ${idx + 1}`,
        description: "",
        duration: l.duration_sec ? `${Math.round((l.duration_sec || 0) / 60)} min` : "",
        content: "",
        completed: !!data?.progress?.completed_lesson_ids?.includes(l.id),
        locked: data?.course?.enrollment_status !== 'enrolled' && !l.is_free_preview,
        order: l.position ?? idx + 1,
        exercise: l.exercise
          ? (() => {
              const ex = l.exercise as unknown as Record<string, unknown>
              const submission = (ex['submission'] as string) ?? null
              const maybeFiles = (ex['submission_files'] as unknown) ?? (ex['files'] as unknown) ?? null
              const submissionFiles: { name: string; url: string | null; mime?: string | null }[] = []
              if (Array.isArray(maybeFiles)) {
                for (const f of maybeFiles as unknown[]) {
                  const rf = f as Record<string, unknown>
                  submissionFiles.push({
                    name: String(rf['name'] ?? rf['filename'] ?? 'file'),
                    url: (rf['url'] as string) ?? (rf['file_url'] as string) ?? null,
                    mime: (rf['mime'] as string) ?? (rf['type'] as string) ?? null,
                  })
                }
              }
              return {
                id: (ex['id'] as number) ?? l.id,
                title: String(ex['title'] ?? ex['name'] ?? `Esercizio ${l.position ?? idx + 1}`),
                description: (ex['description'] as string) ?? null,
                timeEstimate: ex['time_estimate'] ? String(ex['time_estimate']) : "--",
                completed: !!ex['completed'],
                unlocked: !!ex['unlocked'],
                submission,
                submissionFiles,
              }
            })()
          : undefined,
      }))
    }
  }, [data, courseId])

  // Seed submittedExercises from server data so the submitted state survives refresh
  useEffect(() => {
    try {
      const map: Record<number, boolean> = {}
      for (const l of course.lessons) {
        const ex = l.exercise
        if (!ex || !ex.id) continue
        if (ex.submission || (ex.submissionFiles && ex.submissionFiles.length > 0) || ex.completed) {
          map[Number(ex.id)] = true
        }
      }
      setSubmittedExercises(map)
    } catch (e) {
      console.debug('[CourseViewer] seed submittedExercises failed', e)
    }
  }, [course])

  // Retroactive fetch: load my submissions list once and seed submittedData/submittedExercises
  useEffect(() => {
    (async () => {
      try {
        const res = await listMyExercises()
        if (res.ok) {
          const map: Record<number, boolean> = {}
          const dataMap: Record<number, { text?: string; files?: { name: string; url: string | null; mime?: string | null }[] }> = {}
          for (const item of res.data) {
            const exId = Number(item.id)
            map[exId] = true
            dataMap[exId] = { text: item.description ?? undefined, files: [] }
          }
          setSubmittedExercises((s) => ({ ...(s ?? {}), ...map }))
          setSubmittedData((s) => ({ ...(s ?? {}), ...dataMap }))
        }
      } catch (e) { console.debug('[CourseViewer] listMyExercises failed', e) }
    })()
  }, [])

  // When selecting a lesson with an exercise, fetch detailed submission if we don't have it yet
  useEffect(() => {
    (async () => {
      try {
        const lesson = selectedLesson ? course.lessons.find(l => l.id === selectedLesson) : null
        const exId = lesson?.exercise?.id
        if (!exId) return
        setSubmittedData((s) => {
          if (s && s[Number(exId)]) return s
          return s
        })
        // fetch details
        const res = await getMySubmission(Number(exId))
        if (res.ok && res.data) {
          const s = res.data as Record<string, unknown>
          const text = (s['text'] as string) ?? (s['submission_text'] as string) ?? undefined
          const filesRaw = (s['files'] as unknown) ?? (s['submission_files'] as unknown) ?? null
          const files: { name: string; url: string | null; mime?: string | null }[] = []
          if (Array.isArray(filesRaw)) {
            for (const f of filesRaw as unknown[]) {
              const rf = f as Record<string, unknown>
              files.push({ name: String(rf['name'] ?? rf['filename'] ?? 'file'), url: (rf['url'] as string) ?? (rf['file_url'] as string) ?? null, mime: (rf['mime'] as string) ?? (rf['type'] as string) ?? null })
            }
          }
          setSubmittedData((s) => ({ ...(s ?? {}), [Number(exId)]: { text, files } }))
        }
      } catch (e) { console.debug('[CourseViewer] getMySubmission failed', e) }
    })()
  }, [selectedLesson, course.lessons])

  useEffect(() => {
    if (isError) {
      toast(String((error as unknown as Error)?.message ?? String(error)))
    }
  }, [isError, error])

  const currentLesson = selectedLesson ? course.lessons.find(l => l.id === selectedLesson) : null
  const completedLessons = course.lessons.filter(l => l.completed).length
  const totalLessons = course.lessons.length

  const handleCompleteLesson = (lessonId: string) => {
    // use mutation instead of local mock
  void markCompleteMutation.mutateAsync(Number(lessonId))
  }

  const qc = useQueryClient()
  const markCompleteMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const res = await markLessonComplete(lessonId)
      if (!res.ok) throw res.error || new Error('Failed to mark complete')
      return res.data
    },
  onSuccess: () => {
      updateTokens(5)
      toast("Lesson completed! ✨", {
        description: "You earned 5 tokens. Next lesson unlocked!"
      })
      const key = ['courseOutline', Number(courseId ?? '')]
      try {
        qc.invalidateQueries({ queryKey: key })
      } catch {
        // ignore
      }
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as Record<string, unknown>)['message'] ?? String(err)) : String(err)
      toast(String(msg))
    }
  })

  // track locally which exercise submissions we already sent so the UI is disabled after submit
  const [submittedExercises, setSubmittedExercises] = useState<Record<number, boolean>>({})
  // detailed submission data retrieved from server (retroactive submissions)
  const [submittedData, setSubmittedData] = useState<Record<number, { text?: string; files?: { name: string; url: string | null; mime?: string | null }[] }>>({})

  // current exercise id and any server-provided submission data for the selected lesson
  const currentExId = currentLesson?.exercise?.id ? Number(currentLesson.exercise.id) : undefined
  const currentSubmittedData = currentExId ? (submittedData[Number(currentExId)] ?? undefined) : undefined
  const isSubmitted = !!(currentLesson?.exercise?.completed || (currentExId && (submittedExercises[Number(currentExId)] || !!currentSubmittedData)))

  const submitMutation = useMutation({
    mutationFn: async ({ exerciseId, payload }: { exerciseId: number; payload: { text?: string; files?: File[] } }) => {
      const res = await submitExercise(exerciseId, { text: payload.text, files: payload.files })
      if (!res.ok) throw res.error || new Error('Failed to submit exercise')
      return res.data
    },
    onSuccess: (_data, vars) => {
      updateTokens(10)
      // reset uncontrolled ref and clear the DOM value
      exerciseSubmissionRef.current = ""
      try { if (textareaRef.current) textareaRef.current.value = '' } catch (e) { console.debug('[CourseViewer] reset textarea value failed', e) }
      // mark as submitted locally to disable further submissions and show submitted content
      if (vars && typeof vars.exerciseId === 'number') {
        setSubmittedExercises((s) => ({ ...(s ?? {}), [vars.exerciseId]: true }))
      }
      toast("Esercizio caricato correttamente ✨")
      const key = ['courseOutline', Number(courseId ?? '')]
      try {
        qc.invalidateQueries({ queryKey: key })
      } catch {
        // ignore
      }
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as Record<string, unknown>)['message'] ?? String(err)) : String(err)
      toast(String(msg))
    },
  })

  const handleSubmitExercise = () => {
    if (!exerciseSubmissionRef.current.trim()) {
      toast("Please add your submission before submitting")
      return
    }
    const exId = currentLesson?.exercise?.id
    if (!exId) {
      toast("No exercise available for this lesson")
      return
    }
    if (!currentLesson?.exercise?.unlocked) {
      toast("Exercise is locked. Complete the lesson first.")
      return
    }
  submitMutation.mutate({ exerciseId: Number(exId), payload: { text: exerciseSubmissionRef.current, files: attachedFiles ?? undefined } })
  }

  // File attach handling
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [attachedFiles, setAttachedFiles] = useState<File[] | null>(null)
  const onAttachClick = () => {
    fileInputRef.current?.click()
  }
  const onFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    // accept only PDFs
    const pdfs = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    if (pdfs.length !== files.length) {
      toast("Only PDF files are accepted. Non-PDF files were ignored.")
    }
    setAttachedFiles(pdfs.length ? pdfs : null)
  }

  // Autofocus textarea when opening exercise tab to avoid losing focus
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  useEffect(() => {
    if (activeTab === 'exercise') {
      // small timeout to ensure the element is mounted
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [activeTab, selectedLesson])

  // Track textarea mount/unmount and log exerciseSubmission changes to debug focus loss
  useEffect(() => {
    console.debug('[CourseViewer] textarea ref at effect', { textareaRef: textareaRef.current, activeElement: document.activeElement?.tagName })
  }, [activeTab, selectedLesson])

  // keep a light debug of the ref value when needed
  useEffect(() => {
    console.debug('[CourseViewer] exerciseSubmissionRef at mount', { value: exerciseSubmissionRef.current, activeElement: document.activeElement?.tagName })
  }, [])

  const LessonSidebar = () => (
    <div className="w-80 border-r bg-muted/20 p-4 space-y-4 overflow-y-auto">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <ImageWithFallback
            src={course.instructorAvatar}
            alt={course.instructor}
            className="size-10 rounded-full"
          />
          <div>
            <h4 className="font-medium">{course.instructor}</h4>
            <p className="text-sm text-muted-foreground">Course Instructor</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Course Progress</span>
            <span>{Math.round((completedLessons / totalLessons) * 100)}%</span>
          </div>
          <Progress value={(completedLessons / totalLessons) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {completedLessons} of {totalLessons} lessons completed
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Course Content</h4>
        <div className="space-y-1">
          {isLoading ? (
            <div className="p-4">Caricamento lezioni…</div>
          ) : (
            course.lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => {
                  if (!lesson.locked) {
                    setSelectedLesson(lesson.id)
                    setActiveTab('content')
                  }
                }}
                disabled={lesson.locked}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedLesson === lesson.id 
                    ? 'bg-primary text-primary-foreground' 
                    : lesson.locked 
                      ? 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                      : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {lesson.completed ? (
                      <CheckCircle className="size-5 text-green-600" />
                    ) : lesson.locked ? (
                      <Lock className="size-5" />
                    ) : (
                      <Play className="size-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-sm truncate">
                      {lesson.order}. {lesson.title}
                    </h5>
                    <div className="flex items-center gap-2 text-xs opacity-80">
                      <Clock className="size-3" />
                      <span>{lesson.duration}</span>
                      {lesson.exercise && (
                        <>
                          <Target className="size-3" />
                          <span>Exercise</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )

  const LessonContent = () => {
    if (!currentLesson) {
      return (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div>
            <BookOpen className="size-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Select a Lesson</h3>
            <p className="text-muted-foreground">
              Choose a lesson from the sidebar to start learning
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2>{currentLesson.title}</h2>
              <p className="text-muted-foreground">{currentLesson.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="size-4" />
                <span>{currentLesson.duration}</span>
              </div>
              {!currentLesson.completed && !currentLesson.locked && (
                <Button onClick={() => handleCompleteLesson(currentLesson.id)}>
                  <CheckCircle className="size-4 mr-2" />
                  Mark Complete
                </Button>
              )}
              {currentLesson.exercise && (
                <Button
                  variant="outline"
                  onClick={() => currentLesson.exercise && (currentLesson.exercise.unlocked || currentLesson.completed) && setActiveTab('exercise')}
                  className="ml-2"
                  disabled={!currentLesson.exercise.unlocked && !currentLesson.completed}
                >
                  {!currentLesson.exercise.unlocked && !currentLesson.completed ? (
                    <span className="flex items-center gap-2">
                      <Lock className="size-4" />
                      Exercise (locked)
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Target className="size-4 mr-2" />
                      Open Exercise
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>

          {currentLesson.completed && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="size-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Lesson Completed ✨
              </span>
            </div>
          )}
        </div>

  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'content' | 'exercise')} className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Lesson Content</TabsTrigger>
            {currentLesson.exercise && (currentLesson.exercise.unlocked || currentLesson.exercise.completed) && (
              <TabsTrigger value="exercise">Exercise</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="prose max-w-none">
                  <p>{currentLesson.content}</p>
                  
                  {/* Mock video player */}
                  <div className="mt-6 bg-black rounded-lg aspect-video flex items-center justify-center">
                    <div className="text-center text-white">
                      <Play className="size-16 mx-auto mb-4 opacity-80" />
                      <p className="text-lg font-medium">Video Lesson</p>
                      <p className="text-sm opacity-80">Click to play lesson video</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {currentLesson.exercise && (currentLesson.exercise.unlocked || currentLesson.exercise.completed) && (
            <TabsContent value="exercise" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="size-5" />
                    {currentLesson.exercise.title}
                  </CardTitle>
                  <CardDescription>{currentLesson.exercise.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Instructions</h4>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">{currentLesson.exercise.description ?? ''}</pre>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Time Estimate</h4>
                        <Badge variant="outline">{currentLesson.exercise.timeEstimate}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Reward</h4>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          +10 ✨
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {isSubmitted ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="size-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Exercise Completed ✨
                        </span>
                      </div>
                      {(currentSubmittedData?.text ?? currentLesson.exercise.submission) && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Your Submission</h4>
                          <div className="p-4 border rounded-lg bg-muted/50">
                            <p className="text-sm">{currentSubmittedData?.text ?? currentLesson.exercise.submission}</p>
                            {(currentSubmittedData?.files ?? currentLesson.exercise.submissionFiles ?? []).length > 0 && (
                              <div className="mt-2 text-sm">
                                <h5 className="font-medium">Attached files</h5>
                                <ul className="list-disc pl-5">
                                  {(currentSubmittedData?.files ?? currentLesson.exercise.submissionFiles ?? []).map((f, i) => (
                                    <li key={i}>
                                      {f.url ? (
                                        <a href={f.url} target="_blank" rel="noreferrer" className="text-primary underline">{f.name}</a>
                                      ) : (
                                        <span>{f.name}</span>
                                      )} {f.mime && <span className="text-muted-foreground">({f.mime})</span>}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Submit Your Work</h4>
                        <TextareaWithMountLogger
                          ref={textareaRef}
                          placeholder="Describe your exercise completion, attach images, or share your process..."
                          defaultValue={exerciseSubmissionRef.current}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            // update ref only, avoid setState to prevent re-renders
                            exerciseSubmissionRef.current = e.target.value
                            console.debug('[CourseViewer] textarea onChange (ref only)', { value: e.target.value })
                          }}
                          onFocus={() => { console.debug('[CourseViewer] textarea onFocus') }}
                          onBlur={() => { console.debug('[CourseViewer] textarea onBlur'); console.trace('[CourseViewer] textarea blur trace') }}
                          className="min-h-24"
                        />
                      </div>
                        <div className="flex items-center gap-3">
                        <Button type="button" onClick={() => handleSubmitExercise()} disabled={!!isSubmitted}>
                          <Upload className="size-4 mr-2" />
                          Submit Exercise
                        </Button>
                        <Button type="button" variant="outline" onClick={onAttachClick} disabled={!!isSubmitted}>
                          <FileText className="size-4 mr-2" />
                          Attach Files
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".pdf,application/pdf"
                          onChange={onFilesChange}
                          className="hidden"
                        />
                      </div>
                      {attachedFiles && attachedFiles.length > 0 && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Attached: {attachedFiles.map(f => f.name).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="size-4 mr-2" />
            Back to Courses
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-medium">{course.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="size-3" />
                <span>{course.students} students</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="size-3" />
                <span>{course.rating} ({course.reviews} reviews)</span>
              </div>
              <Badge variant="outline" className="capitalize">
                {course.level}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <LessonSidebar />
        <LessonContent />
      </div>
    </div>
  )
}
