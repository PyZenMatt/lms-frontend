import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { 
  Plus, 
  BookOpen, 
  Users, 
  Star, 
  Eye, 
  Edit3, 
  Trash2,
  GraduationCap,
  Clock,
  Target,
  FileText,
  Upload
} from "lucide-react"
import { useAuth } from "./AuthContext"
import { getTeacherDashboard, type TeacherStats } from "../../services/teacher"
import { ImageWithFallback } from "./figma/ImageWithFallback"

interface Course {
  id: string
  title: string
  description: string
  level: 'beginner' | 'intermediate' | 'advanced'
  thumbnail: string
  students: number
  lessons: number
  status: 'draft' | 'published'
  createdAt: string
}

interface Lesson {
  id: string
  courseId: string
  title: string
  description: string
  order: number
  exercise?: {
    title: string
    description: string
    instructions: string
    timeEstimate: string
  }
}

interface TeacherDashboardProps {
  onViewCourse?: (courseId: string) => void
}

export function TeacherDashboard({ onViewCourse }: TeacherDashboardProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false)
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  // Courses populated from teacher dashboard API
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced'
  })

  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    exerciseTitle: '',
    exerciseDescription: '',
    exerciseInstructions: '',
    timeEstimate: ''
  })

  const handleCreateCourse = () => {
    const course: Course = {
      id: Date.now().toString(),
      title: newCourse.title,
      description: newCourse.description,
      level: newCourse.level,
      thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=300&h=200&fit=crop&crop=center',
      students: 0,
      lessons: 0,
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0]
    }
    
    setCourses([...courses, course])
    setNewCourse({ title: '', description: '', level: 'beginner' })
    setIsCreateCourseOpen(false)
  }

  const publishedCourses = courses.filter(c => c.status === 'published')
  const draftCourses = courses.filter(c => c.status === 'draft')
  const totalStudents = courses.reduce((sum, course) => sum + course.students, 0)

  const [loadingStats, setLoadingStats] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [stats, setStats] = useState<TeacherStats | undefined>(undefined)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoadingStats(true)
      setStatsError(null)
      const res = await getTeacherDashboard(1, 10)
      if (!mounted) return
      if (res.ok) {
        setStats(res.data.stats)
        // normalize courses shape if present
        try {
          const c = res.data.courses ?? []
          // map minimal fields expected by this component when necessary
          const mapped = Array.isArray(c)
            ? c.map((x: any) => ({
                id: String(x.id),
                title: x.title ?? x.name ?? "Untitled",
                description: x.description ?? "",
                level: (x.level as any) ?? 'beginner',
                thumbnail: x.cover_url ?? x.cover_image ?? x.thumbnail ?? '',
                students: typeof x.students_count === 'number' ? x.students_count : (x.students ?? 0),
                lessons: typeof x.lessons_count === 'number' ? x.lessons_count : (x.lessons?.length ?? 0),
                status: x.published || x.is_approved ? 'published' : 'draft',
                createdAt: x.created_at ?? x.createdAt ?? '',
              }))
            : []
          setCourses(mapped)
        } catch (e) {
          console.debug('Failed to map teacher courses', e)
        }
      }
      else setStatsError(`Unable to load teacher dashboard (HTTP ${res.status})`)
      setLoadingStats(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses, lessons, and student progress</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-purple-50 border-purple-200">
            <GraduationCap className="size-3 mr-1" />
            Educator
          </Badge>
          <Dialog open={isCreateCourseOpen} onOpenChange={setIsCreateCourseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-2" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Set up a new course with lessons and exercises for your students
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course-title">Course Title</Label>
                  <Input
                    id="course-title"
                    placeholder="e.g., Digital Painting Fundamentals"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-description">Description</Label>
                  <Textarea
                    id="course-description"
                    placeholder="Describe what students will learn in this course..."
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                    className="min-h-20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select 
                    value={newCourse.level} 
                    onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                      setNewCourse({...newCourse, level: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateCourseOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCourse} disabled={!newCourse.title}>
                    Create Course
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-xl font-medium">{loadingStats ? '…' : (stats?.total_courses ?? courses.length)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-xl font-medium">{loadingStats ? '…' : (stats?.total_students ?? totalStudents)}</p>
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
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-xl font-medium">{loadingStats ? '…' : (stats?.pending_courses !== undefined ? (stats?.total_courses ?? publishedCourses.length) : publishedCourses.length)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Edit3 className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-xl font-medium">{loadingStats ? '…' : (stats?.pending_courses ?? draftCourses.length)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from your courses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="size-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="size-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">3 new students enrolled</p>
                    <p className="text-xs text-muted-foreground">Digital Painting Fundamentals</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="size-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="size-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">12 new submissions</p>
                    <p className="text-xs text-muted-foreground">Character Design Workshop</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="size-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Star className="size-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">4.8 star rating received</p>
                    <p className="text-xs text-muted-foreground">From recent course feedback</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="size-4 mr-2" />
                  Add lesson to existing course
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="size-4 mr-2" />
                  Review pending submissions
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="size-4 mr-2" />
                  Upload course materials
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Target className="size-4 mr-2" />
                  Create new exercise
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card key={course.id} className={course.status === 'draft' ? 'border-amber-200 bg-amber-50/50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                      {course.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit3 className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ImageWithFallback 
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-32 rounded-lg object-cover"
                  />
                  <div>
                    <h4>{course.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="size-3" />
                        <span>{course.students}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="size-3" />
                        <span>{course.lessons}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {course.level}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => onViewCourse?.(course.id)}
                    >
                      <Eye className="size-3 mr-1" />
                      View
                    </Button>
                    <Dialog open={isCreateLessonOpen} onOpenChange={setIsCreateLessonOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setSelectedCourse(course.id)}
                        >
                          <Plus className="size-3 mr-1" />
                          Add Lesson
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Add New Lesson</DialogTitle>
                          <DialogDescription>
                            Create a lesson with an exercise for {course.title}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="lesson-title">Lesson Title</Label>
                              <Input
                                id="lesson-title"
                                placeholder="e.g., Understanding Light and Shadow"
                                value={newLesson.title}
                                onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="time-estimate">Time Estimate</Label>
                              <Input
                                id="time-estimate"
                                placeholder="e.g., 45 minutes"
                                value={newLesson.timeEstimate}
                                onChange={(e) => setNewLesson({...newLesson, timeEstimate: e.target.value})}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lesson-description">Lesson Description</Label>
                            <Textarea
                              id="lesson-description"
                              placeholder="What will students learn in this lesson?"
                              value={newLesson.description}
                              onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                            />
                          </div>
                          <div className="border-t pt-4">
                            <h4 className="mb-3">Exercise</h4>
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label htmlFor="exercise-title">Exercise Title</Label>
                                <Input
                                  id="exercise-title"
                                  placeholder="e.g., Create a Light Study"
                                  value={newLesson.exerciseTitle}
                                  onChange={(e) => setNewLesson({...newLesson, exerciseTitle: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="exercise-description">Exercise Description</Label>
                                <Textarea
                                  id="exercise-description"
                                  placeholder="What should students create or practice?"
                                  value={newLesson.exerciseDescription}
                                  onChange={(e) => setNewLesson({...newLesson, exerciseDescription: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="exercise-instructions">Detailed Instructions</Label>
                                <Textarea
                                  id="exercise-instructions"
                                  placeholder="Step-by-step instructions for completing the exercise..."
                                  value={newLesson.exerciseInstructions}
                                  onChange={(e) => setNewLesson({...newLesson, exerciseInstructions: e.target.value})}
                                  className="min-h-24"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setIsCreateLessonOpen(false)}>
                              Cancel
                            </Button>
                            <Button disabled={!newLesson.title || !newLesson.exerciseTitle}>
                              Create Lesson
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Management</CardTitle>
              <CardDescription>Track student progress and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Student management features coming soon!</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Analytics</CardTitle>
              <CardDescription>Insights into course performance and student engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics dashboard coming soon!</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}