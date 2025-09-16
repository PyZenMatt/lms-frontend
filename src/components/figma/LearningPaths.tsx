import { useState, useEffect } from "react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Search,
  Play,
  Lock,
  Award,
  GraduationCap
} from "lucide-react"
import { useAuth } from "./AuthContext"
import { useNavigate } from "react-router-dom"
import { ImageWithFallback } from "./figma/ImageWithFallback"
import { toast } from "sonner"
import { useCourses } from '@/hooks/useCourses'
import { toCourseCardVM, CourseCardVM } from '@/adapters/courses'
// removed unused useQuery import
import { getEnrolledCourses } from "@/services/student"

type Course = CourseCardVM & { enrolled?: boolean; progress?: number; featured?: boolean; tokens?: number; }

interface LearningPathsProps {
  onContinueCourse?: (courseId: string) => void
}

export function LearningPaths({ onContinueCourse }: LearningPathsProps) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeTab, setActiveTab] = useState("browse")

  // stateful lists populated from API
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  // local UI state
  // (no local loading state required here)

  // use adapter to normalize DTOs into VMs consumed by UI

  // load courses from API via hook
  const coursesQuery = useCourses({ page: 1, page_size: 100 })
  useEffect(() => {
    if (coursesQuery.data) {
      const dtoList = coursesQuery.data as any[]
      const mapped = dtoList.map((d) => ({ ...toCourseCardVM(d), tokens: (d as any).tokens ?? (d as any).price_tokens ?? 0 }))
      setAllCourses(mapped)
    }
  }, [coursesQuery.data])

  // still use getEnrolledCourses for enrolled list (could be wrapped in a hook similarly)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const enrolledRes = await getEnrolledCourses(1, 100)
        if (!mounted) return
        if (enrolledRes.ok) {
          const mappedEnrolled = (enrolledRes.data.items as any[]).map((d) => ({ ...toCourseCardVM(d), tokens: (d as any).tokens ?? (d as any).price_tokens ?? 0, enrolled: true }))
          setEnrolledCourses(mappedEnrolled)
          setAllCourses(prev => {
            const byId = new Map(prev.map(p => [p.id, p]))
            mappedEnrolled.forEach(e => byId.set(e.id, { ...(byId.get(e.id) ?? e), enrolled: true, progress: e.progress }))
            return Array.from(byId.values())
          })
        }
      } catch (err: unknown) {
        console.debug('Error loading enrolled', err)
      }
    })()
    return () => { mounted = false }
  }, [])

  const availableCourses = allCourses.filter(course => !course.enrolled)
  const featuredCourses = allCourses.filter(course => course.featured)

  const categories = [...new Set(allCourses.map(course => course.category))]

  const filteredCourses = availableCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = selectedLevel === "all" || course.level === selectedLevel
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory
    
    return matchesSearch && matchesLevel && matchesCategory
  })

  const navigate = useNavigate()

  const handleEnrollCourse = (courseId: string) => {
    const course = allCourses.find(c => c.id === courseId)
    if (!course) return
    if (!user) {
      toast.error("You must be logged in to enroll in a course")
      return
    }

    // If already enrolled, go to the course player/detail instead of checkout
    if (course.enrolled) {
      // If already enrolled, send students to the learning player
      navigate(`/learn/${courseId}`)
      return
    }

    // Redirect to the Course checkout page implemented in the app
    navigate(`/courses/${courseId}/checkout`)
  }

  const handleContinueCourse = (courseId: string) => {
    if (onContinueCourse) {
      onContinueCourse(courseId)
    } else {
      // Default student path: learning player
      navigate(`/learn/${courseId}`)
    }
  }

  const LevelBadge = ({ level }: { level: string }) => {
    const colors = {
      beginner: "bg-green-100 text-green-800",
      intermediate: "bg-blue-100 text-blue-800", 
      advanced: "bg-purple-100 text-purple-800"
    }
    return (
      <Badge variant="secondary" className={colors[level as keyof typeof colors]}>
        {level}
      </Badge>
    )
  }

  const CourseCard = ({ course, showProgress = false, showPrice = true }: { course: Course, showProgress?: boolean, showPrice?: boolean }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <ImageWithFallback
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-48 object-cover"
          showPlaceholder={true}
        />
        {/* price badge overlay (visible even when image is fallback) - hide for enrolled courses */}
  {!course.enrolled && showPrice && typeof course.price === 'number' && course.price > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/80 px-2 py-1 rounded-md text-sm font-semibold">
            {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(course.price)}
          </div>
        )}
        {course.featured && (
          <Badge className="absolute top-3 left-3 bg-yellow-500">
            <Award className="size-3 mr-1" />
            Featured
          </Badge>
        )}
        <LevelBadge level={course.level} />
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <h3 className="font-medium line-clamp-2">{course.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <ImageWithFallback
            src={course.instructorAvatar}
            alt={course.instructor}
            className="size-6 rounded-full"
          />
          <span className="text-sm text-muted-foreground">{course.instructor}</span>
        </div>

        {showProgress && course.progress !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Progress</span>
              <span className="text-sm">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <BookOpen className="size-3" />
              <span>{course.lessons}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="size-3" />
              <span>{course.students}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="size-3 fill-yellow-400 text-yellow-400" />
            <span>{course.rating}</span>
            <span>({course.reviews})</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* show price in EUR when available; hide for enrolled courses */}
            {!course.enrolled && showPrice && typeof course.price === 'number' && course.price > 0 && (
              <div className="text-sm font-semibold">{new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(course.price)}</div>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-800">
                {course.tokens} ✨
              </Badge>
              <span className="text-xs text-muted-foreground">tokens</span>
            </div>
          </div>
          
          {course.enrolled ? (
            <Button size="sm" onClick={() => handleContinueCourse(course.id)}>
              <Play className="size-3 mr-1" />
              Continue
            </Button>
          ) : (
            <Button 
              size="sm" 
              onClick={() => handleEnrollCourse(course.id)}
              disabled={(user?.tokens || 0) < course.tokens}
            >
              {(user?.tokens || 0) < course.tokens ? (
                <>
                  <Lock className="size-3 mr-1" />
                  Need {course.tokens - (user?.tokens || 0)} more ✨
                </>
              ) : (
                <>
                  Enroll
                </>
              )}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {course.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Learning Paths</h1>
          <p className="text-muted-foreground">Discover courses and advance your artistic skills</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            {user?.tokens || 0} ✨ Available
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse Courses</TabsTrigger>
          <TabsTrigger value="enrolled">My Courses ({enrolledCourses.length})</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses, instructors, or topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="size-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm("")
                  setSelectedLevel("all")
                  setSelectedCategory("all")
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="enrolled" className="space-y-4">
          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map(course => (
                <CourseCard key={course.id} course={course} showProgress showPrice={false} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <GraduationCap className="size-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No enrolled courses yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start your learning journey by enrolling in a course
                </p>
                <Button onClick={() => setActiveTab("browse")}>
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          {/* "Pensati per te" — recommendations planned; placeholder for now */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Pensati per te</h3>
                  <p className="text-sm text-muted-foreground">In arrivo — mostreremo suggerimenti personalizzati in base ai tuoi corsi</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map(course => (
              <CourseCard key={course.id} course={course} showProgress={course.enrolled} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}