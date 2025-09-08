import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Progress } from "./ui/progress"
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  Users, 
  BookOpen, 
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  Eye,
  Settings
} from "lucide-react"
import { useAuth } from "./AuthContext"
import { useLocation, useNavigate } from "react-router-dom"
import { approveCourse } from "@/services/admin"
import { showToast } from "@/lib/toast"
import { ImageWithFallback } from "./figma/ImageWithFallback"
import { api } from "@/lib/api"
import { listLessons } from "@/services/studio"

interface Student {
  id: string
  name: string
  avatar: string
  progress: number
  lastActive: string
  completedLessons: number
  totalLessons: number
  joinedDate: string
}

interface LessonAnalytics {
  id: string
  title: string
  completionRate: number
  avgTimeSpent: string
  exerciseSubmissions: number
  studentsCompleted: number
  totalStudents: number
}

interface CourseDetailsProps {
  courseId: string
  onBack: () => void
  onEdit?: () => void
}

export function CourseDetails({ courseId, onBack, onEdit }: CourseDetailsProps) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("overview")

  const params = new URLSearchParams(location.search)
  const reviewMode = params.get("review") === "1"
  // safe runtime check for admin privileges without tight TS types
  function isUserAdmin(u: unknown) {
    if (!u || typeof u !== 'object') return false
    const o = u as Record<string, unknown>
    if (o.is_staff === true || o.is_superuser === true) return true
    if (typeof o.role === 'string' && o.role.toLowerCase() === 'admin') return true
    return false
  }
  const isAdmin = isUserAdmin(user)

  // Real course data fetched from API
  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const cRes = await api.get(`/v1/courses/${courseId}/`)
        if (mounted && cRes.ok) setCourse(cRes.data)
        // attempt to load lessons using studio helper (normalizes payload)
        try {
          const ll = await listLessons(Number(courseId))
          if (mounted && ll.ok) setLessons(ll.data)
        } catch (err) {
            // ignore lesson errors
        }
      } catch (e) {
        // ignore; keep mock-free
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [courseId])

  // Students fetched for teacher/admin view; fallback to course.student_count or course.students
  const [students, setStudents] = useState<Student[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    async function loadStudents() {
      setStudentsLoading(true)
      try {
        const res = await api.get(`/v1/teacher/courses/students/`, { params: { course_id: courseId } })
        if (mounted && res.ok) {
          const payload: unknown = res.data
          const arr = Array.isArray(payload) ? (payload as any[]) : ((payload as any)?.results ?? []) as any[]
          setStudents(arr.map((item: any) => ({
            id: String(item.id ?? item.pk ?? item.user_id ?? item.user?.id ?? item.student_id ?? (item.email ?? item.name ?? '')),
            name: item.name ?? item.full_name ?? item.username ?? item.user?.name ?? item.user?.email ?? 'Studente',
            avatar: item.avatar ?? item.profile_image ?? item.user?.avatar ?? '',
            progress: item.progress ?? item.completion_percent ?? 0,
            lastActive: item.last_active ?? item.lastActive ?? '',
            completedLessons: item.completed_lessons ?? item.completed ?? 0,
            totalLessons: item.total_lessons ?? item.totalLessons ?? lessons.length,
            joinedDate: item.joined_at ?? item.joinedDate ?? item.created_at ?? ''
          })))
        }
      } catch (_) {
        // ignore student fetch errors
      } finally {
        if (mounted) setStudentsLoading(false)
      }
    }
    loadStudents()
    return () => { mounted = false }
  }, [courseId, lessons.length])

  const recentActivity = [
    {
      type: 'enrollment',
      student: 'Emma Thompson',
      action: 'enrolled in course',
      time: '2 hours ago'
    },
    {
      type: 'completion',
      student: 'Maya Chen',
      action: 'completed "Understanding Light and Shadow"',
      time: '4 hours ago'
    },
    {
      type: 'submission',
      student: 'Alex Rivera',
      action: 'submitted exercise "Workspace Setup"',
      time: '1 day ago'
    }
  ]

  // Show a lightweight loading / empty state while the course is being fetched
  if (loading || !course) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="size-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1>Caricamento corso…</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="secondary">—</Badge>
                <span>Created —</span>
                <span>Last updated —</span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><div className="h-12 bg-muted rounded" /></CardContent></Card>
          <Card><CardContent className="p-4"><div className="h-12 bg-muted rounded" /></CardContent></Card>
          <Card><CardContent className="p-4"><div className="h-12 bg-muted rounded" /></CardContent></Card>
          <Card><CardContent className="p-4"><div className="h-12 bg-muted rounded" /></CardContent></Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1>{loading ? 'Caricamento corso…' : (course?.title ?? 'Corso')}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant={(course?.status) === 'published' ? 'default' : 'secondary'}>
                {course?.status ?? '—'}
              </Badge>
              <span>Created {course?.created_at ?? course?.createdAt ?? '—'}</span>
              <span>Last updated {course?.updated_at ?? course?.lastUpdated ?? '—'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="size-4 mr-2" />
            Edit Course
          </Button>
          <Button variant="outline">
            <Settings className="size-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Admin review banner + Approve CTA */}
      {isAdmin && reviewMode && (
        <div className="p-4 border-l-4 border-amber-400 bg-amber-50 rounded mb-4 flex items-center justify-between">
          <div>
            <div className="font-medium">Review mode</div>
            <div className="text-sm text-muted-foreground">You are previewing as an admin. Use the Approva button to approve this course.</div>
          </div>
          <div>
            <Button
              onClick={async () => {
                try {
                  const res = await approveCourse(Number(courseId))
                  if (res.ok) {
                    showToast({ variant: "success", message: "Course approved" })
                    navigate(-1)
                  } else if (res.status === 412) {
                    showToast({ variant: "error", message: "Teacher not approved" })
                  } else if (res.status === 409) {
                    showToast({ variant: "error", message: "Course already approved" })
                  } else {
                    showToast({ variant: "error", message: String(res.error ?? res.status) })
                  }
                } catch (e) {
                  showToast({ variant: "error", message: String(e) })
                }
              }}
            >
              Approva
            </Button>
          </div>
        </div>
      )}
      

      {/* Course Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enrolled Students</p>
                <p className="text-2xl font-medium">{course?.students ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-medium">{(course?.completionRate ?? 0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Star className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-medium">{course?.rating ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Completion</p>
                <p className="text-2xl font-medium">{course?.avgCompletionTime ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course Info */}
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageWithFallback
                    src={course?.thumbnail || course?.cover_url || course?.cover}
                    alt={course?.title ?? ''}
                    className="w-full h-48 rounded-lg object-cover"
                  />
                <div className="space-y-2">
                    <p className="text-sm">{course?.description ?? course?.short_description}</p>
                  <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="capitalize">{course?.level ?? ''}</Badge>
                      <Badge variant="outline">{course?.duration ?? ''}</Badge>
                      <Badge variant="outline">{course?.total_lessons ?? course?.totalLessons ?? lessons.length} lessons</Badge>
                      <Badge variant="outline">{course?.total_exercises ?? course?.totalExercises ?? ''} exercises</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest student interactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`size-8 rounded-full flex items-center justify-center ${
                      activity.type === 'enrollment' ? 'bg-blue-100' :
                      activity.type === 'completion' ? 'bg-green-100' : 'bg-purple-100'
                    }`}>
                      {activity.type === 'enrollment' ? (
                        <Users className={`size-4 ${
                          activity.type === 'enrollment' ? 'text-blue-600' : ''
                        }`} />
                      ) : activity.type === 'completion' ? (
                        <CheckCircle className="size-4 text-green-600" />
                      ) : (
                        <FileText className="size-4 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {activity.student} {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
              <CardDescription>Track student progress and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentsLoading && <div className="p-4 text-sm text-muted-foreground">Loading students…</div>}
                {!studentsLoading && students.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">No enrolled students found. Count: {course?.student_count ?? course?.students ?? 0}</div>
                )}
                {students.map((student, i) => {
                  // prefer stable identifiers; fall back to username/email/index
                  const rawKey = student?.id ?? (student as any)?.username ?? (student as any)?.email ?? ''
                  const safeKey = rawKey === '' ? `student-${i}` : String(rawKey)
                  return (
                    <div key={safeKey} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarImage src={student.avatar} alt={student.name} />
                          <AvatarFallback>{(student.name ?? 'S').charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{student.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Joined {student.joinedDate ?? '—'} • Last active {student.lastActive ?? '—'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium">{student.progress ?? 0}% Complete</p>
                            <p className="text-xs text-muted-foreground">
                              {student.completedLessons ?? 0}/{student.totalLessons ?? 0} lessons
                            </p>
                          </div>
                          <div className="w-24">
                            <Progress value={student.progress ?? 0} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Course Lessons</CardTitle>
                  <CardDescription>Manage lesson content and exercises</CardDescription>
                </div>
                <Button>
                  <Plus className="size-4 mr-2" />
                  Add Lesson
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lessons.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">No lessons found for this course.</div>
                )}
                {lessons.map((lesson: any, index: number) => {
                  const rawKey = lesson?.id ?? lesson?.slug ?? lesson?.title ?? ''
                  const safeKey = rawKey === '' ? `lesson-${index}` : String(rawKey)
                  return (
                    <div key={safeKey} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="size-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <BookOpen className="size-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{index + 1}. {lesson.title ?? lesson.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{lesson.completed_count ?? lesson.studentsCompleted ?? 0}/{lesson.total_students ?? lesson.totalStudents ?? course?.student_count ?? course?.students ?? 0} completed</span>
                            <span>Duration: {lesson.duration_min ?? lesson.duration ?? '—'} min</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{lesson.completion_rate ?? lesson.completionRate ?? 0}%</p>
                          <Progress value={lesson.completion_rate ?? lesson.completionRate ?? 0} className="h-1 w-16" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Engagement</CardTitle>
                <CardDescription>How students interact with your course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Session Time</span>
                    <span className="font-medium">24 minutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Course Completion Rate</span>
                    <span className="font-medium">{course.completionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Exercise Submission Rate</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Peer Review Participation</span>
                    <span className="font-medium">72%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Course success indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Student Satisfaction</span>
                    <div className="flex items-center gap-1">
                      <Star className="size-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{course.rating}/5</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enrollment Growth</span>
                    <span className="font-medium text-green-600">+15% this month</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Community Engagement</span>
                    <span className="font-medium">High</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tokens Distributed</span>
                    <span className="font-medium">2,847 ✨</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
