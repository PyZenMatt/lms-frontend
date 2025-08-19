import { useState } from "react"
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
import { ImageWithFallback } from "./figma/ImageWithFallback"
import { toast } from "sonner"

interface Course {
  id: string
  title: string
  description: string
  instructor: string
  instructorAvatar: string
  thumbnail: string
  level: 'beginner' | 'intermediate' | 'advanced'
  duration: string
  lessons: number
  students: number
  rating: number
  reviews: number
  price: number
  tokens: number
  category: string
  tags: string[]
  enrolled?: boolean
  progress?: number
  featured?: boolean
}

export function LearningPaths() {
  const { user, updateTokens } = useAuth()
  void user
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeTab, setActiveTab] = useState("browse")

  // Mock courses data
  const allCourses: Course[] = [
    {
      id: '1',
      title: 'Digital Painting Fundamentals',
      description: 'Master the basics of digital art creation with professional techniques and industry-standard workflows.',
      instructor: 'Prof. Sarah Mitchell',
      instructorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
      level: 'beginner',
      duration: '8 weeks',
      lessons: 24,
      students: 1247,
      rating: 4.8,
      reviews: 156,
      price: 0,
      tokens: 120,
      category: 'Digital Art',
      tags: ['Digital Painting', 'Fundamentals', 'Beginner-friendly'],
      enrolled: true,
      progress: 65,
      featured: true
    },
    {
      id: '2',
      title: 'Character Design Workshop',
      description: 'Create compelling characters from concept to final render with professional character design techniques.',
      instructor: 'Maya Rodriguez',
      instructorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      level: 'intermediate',
      duration: '6 weeks',
      lessons: 18,
      students: 892,
      rating: 4.9,
      reviews: 124,
      price: 0,
      tokens: 150,
      category: 'Character Design',
      tags: ['Character Design', 'Storytelling', 'Intermediate'],
      enrolled: true,
      progress: 30
    },
    {
      id: '3',
      title: 'Advanced Color Theory',
      description: 'Deep dive into color psychology and advanced color techniques for professional artwork.',
      instructor: 'Dr. James Park',
      instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
      level: 'advanced',
      duration: '4 weeks',
      lessons: 12,
      students: 567,
      rating: 4.7,
      reviews: 89,
      price: 0,
      tokens: 100,
      category: 'Color Theory',
      tags: ['Color Theory', 'Advanced', 'Psychology'],
      featured: true
    },
    {
      id: '4',
      title: 'Environment Art Masterclass',
      description: 'Learn to create stunning environments and landscapes for games, films, and concept art.',
      instructor: 'Alex Chen',
      instructorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      level: 'intermediate',
      duration: '10 weeks',
      lessons: 30,
      students: 623,
      rating: 4.6,
      reviews: 78,
      price: 0,
      tokens: 200,
      category: 'Environment Art',
      tags: ['Environment', 'Landscapes', 'Concept Art']
    },
    {
      id: '5',
      title: 'Portrait Drawing Basics',
      description: 'Master the fundamentals of portrait drawing with traditional and digital techniques.',
      instructor: 'Emma Thompson',
      instructorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      level: 'beginner',
      duration: '5 weeks',
      lessons: 15,
      students: 934,
      rating: 4.5,
      reviews: 112,
      price: 0,
      tokens: 80,
      category: 'Drawing',
      tags: ['Portrait', 'Drawing', 'Traditional']
    },
    {
      id: '6',
      title: 'Animation Principles',
      description: 'Learn the 12 principles of animation and create your first animated sequences.',
      instructor: 'Carlos Rivera',
      instructorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop',
      level: 'intermediate',
      duration: '8 weeks',
      lessons: 22,
      students: 445,
      rating: 4.8,
      reviews: 67,
      price: 0,
      tokens: 180,
      category: 'Animation',
      tags: ['Animation', 'Motion', 'Principles']
    }
  ]

  const enrolledCourses = allCourses.filter(course => course.enrolled)
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

  const handleEnrollCourse = (courseId: string) => {
    const course = allCourses.find(c => c.id === courseId)
    if (course && user) {
      updateTokens(-course.tokens)
      toast(`Enrolled in ${course.title}!`, {
        description: `You've spent ${course.tokens} ✨ tokens. Start learning now!`
      })
    }
  }

  const handleContinueCourse = (courseId: string) => {
    void courseId
    toast("Continuing course...", {
      description: "Taking you to your next lesson"
    })
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

  const CourseCard = ({ course, showProgress = false }: { course: Course, showProgress?: boolean }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <ImageWithFallback
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-48 object-cover"
        />
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
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-800">
              {course.tokens} ✨
            </Badge>
            <span className="text-xs text-muted-foreground">tokens</span>
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
                <CourseCard key={course.id} course={course} showProgress />
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