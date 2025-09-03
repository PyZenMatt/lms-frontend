import { useState } from "react"
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
  Target,
  CheckCircle,
  FileText,
  Eye,
  MessageCircle,
  Settings
} from "lucide-react"
import { useAuth } from "./AuthContext"
import { ImageWithFallback } from "./figma/ImageWithFallback"

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
  const [activeTab, setActiveTab] = useState("overview")

  // Mock course data - in real app, this would come from API
  const course = {
    id: courseId,
    title: 'Digital Painting Fundamentals',
    description: 'Master the basics of digital art creation with professional techniques and industry-standard workflows.',
    thumbnail: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=300&fit=crop',
    level: 'beginner',
    duration: '8 weeks',
    students: 42,
    rating: 4.8,
    reviews: 156,
    status: 'published' as 'published' | 'draft',
    createdAt: '2024-01-15',
    lastUpdated: '2024-12-15',
    totalLessons: 12,
    totalExercises: 8,
    avgCompletionTime: '6.2 weeks',
    completionRate: 78
  }

  // Mock student data
  const students: Student[] = [
    {
      id: '1',
      name: 'Maya Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face',
      progress: 85,
      lastActive: '2 hours ago',
      completedLessons: 10,
      totalLessons: 12,
      joinedDate: '2024-11-15'
    },
    {
      id: '2',
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
      progress: 65,
      lastActive: '1 day ago',
      completedLessons: 8,
      totalLessons: 12,
      joinedDate: '2024-11-20'
    },
    {
      id: '3',
      name: 'Emma Thompson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
      progress: 42,
      lastActive: '3 days ago',
      completedLessons: 5,
      totalLessons: 12,
      joinedDate: '2024-12-01'
    }
  ]

  // Mock lesson analytics
  const lessonAnalytics: LessonAnalytics[] = [
    {
      id: '1',
      title: 'Introduction to Digital Art',
      completionRate: 95,
      avgTimeSpent: '18 min',
      exerciseSubmissions: 0,
      studentsCompleted: 40,
      totalStudents: 42
    },
    {
      id: '2',
      title: 'Setting Up Your Workspace',
      completionRate: 88,
      avgTimeSpent: '25 min',
      exerciseSubmissions: 35,
      studentsCompleted: 37,
      totalStudents: 42
    },
    {
      id: '3',
      title: 'Understanding Light and Shadow',
      completionRate: 72,
      avgTimeSpent: '32 min',
      exerciseSubmissions: 28,
      studentsCompleted: 30,
      totalStudents: 42
    }
  ]

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
            <h1>{course.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                {course.status}
              </Badge>
              <span>Created {course.createdAt}</span>
              <span>Last updated {course.lastUpdated}</span>
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
                <p className="text-2xl font-medium">{course.students}</p>
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
                <p className="text-2xl font-medium">{course.completionRate}%</p>
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
                <p className="text-2xl font-medium">{course.rating}</p>
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
                <p className="text-2xl font-medium">{course.avgCompletionTime}</p>
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
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 rounded-lg object-cover"
                />
                <div className="space-y-2">
                  <p className="text-sm">{course.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="capitalize">{course.level}</Badge>
                    <Badge variant="outline">{course.duration}</Badge>
                    <Badge variant="outline">{course.totalLessons} lessons</Badge>
                    <Badge variant="outline">{course.totalExercises} exercises</Badge>
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
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={student.avatar} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{student.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Joined {student.joinedDate} • Last active {student.lastActive}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">{student.progress}% Complete</p>
                          <p className="text-xs text-muted-foreground">
                            {student.completedLessons}/{student.totalLessons} lessons
                          </p>
                        </div>
                        <div className="w-24">
                          <Progress value={student.progress} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                {lessonAnalytics.map((lesson, index) => (
                  <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="size-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <BookOpen className="size-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{index + 1}. {lesson.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{lesson.studentsCompleted}/{lesson.totalStudents} completed</span>
                          <span>Avg: {lesson.avgTimeSpent}</span>
                          {lesson.exerciseSubmissions > 0 && (
                            <span>{lesson.exerciseSubmissions} submissions</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{lesson.completionRate}%</p>
                        <Progress value={lesson.completionRate} className="h-1 w-16" />
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
                ))}
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
