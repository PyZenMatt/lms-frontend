import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Progress } from "./ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { 
  Calendar,
  MapPin, 
  Link as LinkIcon, 
  Edit, 
  Save, 
  Palette,
  Trophy,
  BookOpen,
  Users,
  Star,
  Target
} from "lucide-react"
import { useAuth } from "./AuthContext"
import { ImageWithFallback } from "./figma/ImageWithFallback"

export function Profile() {
  const { user, updateTokens } = useAuth()
  void updateTokens
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    bio: '',
    location: '',
    website: '',
    skills: ['Digital Art', 'Character Design', 'Color Theory']
  })

  // Mock user stats and data
  const stats = {
    coursesCompleted: 8,
    reviewsGiven: 24,
    reviewsReceived: 18,
    communityRank: 42,
    joinDate: 'January 2024',
    currentStreak: 7
  }

  const portfolio = [
    {
      id: '1',
      title: 'Forest Landscape Study',
      course: 'Digital Painting Fundamentals',
      rating: 4.8,
      reviews: 12,
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop',
      date: '2 days ago'
    },
    {
      id: '2', 
      title: 'Character Portrait',
      course: 'Character Design Workshop',
      rating: 4.5,
      reviews: 8,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
      date: '1 week ago'
    },
    {
      id: '3',
      title: 'Color Harmony Exercise',
      course: 'Advanced Color Theory',
      rating: 4.9,
      reviews: 15,
      image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=300&fit=crop',
      date: '2 weeks ago'
    }
  ]

  const achievements = [
    { name: 'First Steps', description: 'Completed first lesson', icon: '🎯', earned: true },
    { name: 'Peer Helper', description: 'Gave 10 helpful reviews', icon: '🤝', earned: true },
    { name: 'Art Explorer', description: 'Tried 3 different art styles', icon: '🎨', earned: true },
    { name: 'Community Star', description: 'Earned 100+ tokens from peers', icon: '⭐', earned: false },
    { name: 'Master Critic', description: 'Gave 50 peer reviews', icon: '👁️', earned: false },
    { name: 'Course Champion', description: 'Completed 10 courses', icon: '🏆', earned: false }
  ]

  const currentCourses = [
    {
      id: '1',
      title: 'Advanced Digital Painting',
      progress: 65,
      instructor: 'Prof. Sarah Mitchell',
      nextLesson: 'Light and Shadow Techniques'
    },
    {
      id: '2', 
      title: 'Portfolio Development',
      progress: 30,
      instructor: 'Maya Rodriguez',
      nextLesson: 'Curating Your Best Work'
    }
  ]

  const handleSaveProfile = () => {
    setIsEditing(false)
    // In real app, this would save to backend
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Profile</h1>
          <p className="text-muted-foreground">Manage your profile and track your artistic journey</p>
        </div>
        <Button 
          variant={isEditing ? "outline" : "default"}
          onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
        >
          {isEditing ? (
            <>
              <Save className="size-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Edit className="size-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center md:items-start">
              <Avatar className="size-24 mb-4">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="text-xl">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <Badge variant="outline" className="capitalize">
                {user?.role}
              </Badge>
            </div>
            
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about your artistic journey..."
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      className="min-h-20"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="City, Country"
                        value={editForm.location}
                        onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        placeholder="https://your-portfolio.com"
                        value={editForm.website}
                        onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl">{user?.name}</h2>
                    <p className="text-muted-foreground">
                      {editForm.bio || "Passionate digital artist exploring new techniques and styles through community learning."}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="size-4" />
                      <span>Joined {stats.joinDate}</span>
                    </div>
                    {editForm.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="size-4" />
                        <span>{editForm.location}</span>
                      </div>
                    )}
                    {editForm.website && (
                      <div className="flex items-center gap-1">
                        <LinkIcon className="size-4" />
                        <a href={editForm.website} className="hover:underline">Portfolio</a>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {editForm.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center size-12 bg-purple-100 rounded-full mb-2 mx-auto">
              <Trophy className="size-6 text-purple-600" />
            </div>
            <p className="text-2xl font-medium">{user?.tokens || 0}</p>
            <p className="text-sm text-muted-foreground">Creator Tokens ✨</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center size-12 bg-green-100 rounded-full mb-2 mx-auto">
              <BookOpen className="size-6 text-green-600" />
            </div>
            <p className="text-2xl font-medium">{stats.coursesCompleted}</p>
            <p className="text-sm text-muted-foreground">Courses Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center size-12 bg-blue-100 rounded-full mb-2 mx-auto">
              <Users className="size-6 text-blue-600" />
            </div>
            <p className="text-2xl font-medium">{stats.reviewsGiven}</p>
            <p className="text-sm text-muted-foreground">Reviews Given</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center size-12 bg-amber-100 rounded-full mb-2 mx-auto">
              <Target className="size-6 text-amber-600" />
            </div>
            <p className="text-2xl font-medium">#{stats.communityRank}</p>
            <p className="text-sm text-muted-foreground">Community Rank</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="portfolio" className="space-y-4">
        <TabsList>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="progress">Learning Progress</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Artwork</CardTitle>
              <CardDescription>Submissions from your learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolio.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="aspect-square">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{item.course}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="size-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{item.rating}</span>
                          <span className="text-xs text-muted-foreground">({item.reviews})</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.date}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Courses</CardTitle>
              <CardDescription>Your active learning paths</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentCourses.map((course) => (
                <div key={course.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{course.title}</h4>
                    <Badge variant="outline">{course.progress}% Complete</Badge>
                  </div>
                  <Progress value={course.progress} className="mb-3" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Instructor: {course.instructor}
                    </span>
                    <span className="text-muted-foreground">
                      Next: {course.nextLesson}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Milestones in your learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement, index) => (
                  <div 
                    key={index} 
                    className={`p-4 border rounded-lg ${achievement.earned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div>
                        <h4 className={`font-medium ${achievement.earned ? 'text-green-800' : 'text-gray-600'}`}>
                          {achievement.name}
                        </h4>
                        <p className={`text-sm ${achievement.earned ? 'text-green-600' : 'text-gray-500'}`}>
                          {achievement.description}
                        </p>
                      </div>
                      {achievement.earned && (
                        <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">
                          Earned
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest interactions and milestones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="size-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="size-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Completed peer review</p>
                  <p className="text-xs text-muted-foreground">2 hours ago • Earned 5 ✨</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="size-8 bg-green-100 rounded-full flex items-center justify-center">
                  <BookOpen className="size-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Finished lesson: "Light and Shadow"</p>
                  <p className="text-xs text-muted-foreground">1 day ago • Earned 10 ✨</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="size-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Palette className="size-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Submitted artwork for review</p>
                  <p className="text-xs text-muted-foreground">2 days ago • "Forest Landscape Study"</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}