import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Progress } from "./ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Sparkles, Users, BookOpen, Trophy, MessageCircle, Star, UserCheck, Clock, Eye } from "lucide-react"
import { ImageWithFallback } from "./figma/ImageWithFallback"

interface DashboardProps {
  onContinueCourse?: (courseId: string) => void
  onNavigateToPage?: (page: string) => void
}

import useDashboardStats from "@/hooks/useDashboardStats";
import { useNavigate } from "react-router-dom";

export function Dashboard({ onContinueCourse, onNavigateToPage }: DashboardProps) {
  const { stats, loading } = useDashboardStats();
  const navigate = useNavigate();

  const activeCourses = stats?.activeCourses ?? 0;
  const pendingReviews = stats?.pendingReviews ?? 0;
  const reviewsGiven = stats?.reviewsGiven ?? 0;
  const creatorTokensLabel = stats?.creatorTokensLabel ?? "—";

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Welcome back, Maya!</h1>
          <p className="text-muted-foreground">Continue your artistic journey and connect with the community</p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-lg border">
          <Sparkles className="size-4 text-purple-600" />
          <span className="font-medium">{loading ? '—' : creatorTokensLabel}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Courses</p>
                <p className="text-xl font-medium whitespace-nowrap h-6 flex items-center">{loading ? '—' : activeCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-orange-500 rounded-full flex items-center justify-center">
                <UserCheck className="size-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
                <p className="text-xl font-medium whitespace-nowrap h-6 flex items-center">{loading ? '—' : pendingReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Community Rank</p>
                <p className="text-xl font-medium truncate max-w-[9rem]" title={"Coming soon"}>Coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-green-100 rounded-full flex items-center justify-center">
                <MessageCircle className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reviews Given</p>
                <p className="text-xl font-medium whitespace-nowrap h-6 flex items-center">{loading ? '—' : reviewsGiven}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2 space-y-4">
          <h3>Continue Learning</h3>
            <div className="space-y-3">
              {loading ? (
                // show skeleton placeholders while loading
                [1,2].map((n) => (
                  <Card key={n} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex gap-4 items-center">
                        <div className="w-20 h-12 bg-muted/30 rounded-md" />
                        <div className="flex-1">
                          <div className="h-4 bg-muted/30 rounded w-3/4 mb-2" />
                          <div className="h-3 bg-muted/20 rounded w-1/2 mb-3" />
                          <div className="h-2 bg-muted/20 rounded w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : stats?.enrolledCourses && stats.enrolledCourses.length > 0 ? (
                stats.enrolledCourses.slice(0, 4).map(course => (
                  <Card key={course.id} className="cursor-pointer hover:shadow-2xl transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <ImageWithFallback 
                          src={course.thumbnail || 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=80&h=80&fit=crop&crop=center'}
                          alt={course.title}
                          className="size-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium line-clamp-2">{course.title}</h4>
                          {course.description && <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>}
                          <div className="mt-2 flex items-center gap-4">
                            <div className="flex-1">
                                {(() => {
                                  const total = Number.isFinite(course.lessonsTotal) && course.lessonsTotal > 0 ? course.lessonsTotal : 10;
                                  const completed = Number.isFinite(course.lessonsCompleted) ? course.lessonsCompleted : 0;
                                  const percent = total > 0 ? Math.round((completed / total) * 100) : (typeof course.progressPercent === 'number' ? Math.max(0, Math.min(100, course.progressPercent)) : 0);
                                  return (
                                    <>
                                      <Progress value={percent} className="h-2" aria-label={`Progresso corso ${course.title}: ${percent}%`} />
                                      <p className="text-xs text-muted-foreground mt-1">{completed}/{total} lezioni</p>
                                    </>
                                  )
                                })()}
                              </div>
                            <Button 
                              size="sm"
                              onClick={() => {
                                  if (onContinueCourse) return onContinueCourse(String(course.id));
                                  navigate(`/learn/${course.id}`);
                                }}
                            >
                              Continue
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                // neutral empty state when the user has no enrolled courses
                <Card>
                  <CardContent className="p-6 text-center">
                    <h4 className="text-lg font-medium">Non hai corsi attivi</h4>
                    <p className="text-sm text-muted-foreground mt-2">Sembra che tu non abbia ancora corsi attivi. Esplora il catalogo per trovare qualcosa di interessante.</p>
                    <div className="mt-4 flex justify-center">
                      <Button size="sm" onClick={() => onNavigateToPage ? onNavigateToPage('catalog') : navigate('/catalog') }>
                        Vai al catalogo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

          {/* Peer Review Call-to-Action */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <UserCheck className="size-5 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Peer Reviews Available</CardTitle>
                  <CardDescription>Help fellow students and earn Creator Tokens</CardDescription>
                </div>
                <Badge className="bg-blue-100 text-blue-800">+15 ✨ available</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => onNavigateToPage?.('peer-review')}
              >
                Review Student Work
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Community Highlights */}
        <div className="space-y-4">
          <h3>Community Highlights</h3>
          
          {/* Your Submission Status */}
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Latest Submission</CardTitle>
              <CardDescription>Color Temperature Study</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=200&fit=crop&crop=center"
                alt="Your color temperature study"
                className="w-full h-24 rounded-lg object-cover"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-amber-600" />
                  <span className="text-sm">2/3 reviews received</span>
                </div>
                <Badge variant="outline" className="bg-amber-100 border-amber-200">
                  <Eye className="size-3 mr-1" />
                  Reviewing
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Weekly Challenge</CardTitle>
              <CardDescription>Draw inspiration from nature</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=300&h=200&fit=crop&crop=center"
                alt="Nature art challenge"
                className="w-full h-32 rounded-lg object-cover"
              />
              <div className="flex items-center gap-2">
                <Avatar className="size-6">
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face" />
                  <AvatarFallback>AL</AvatarFallback>
                </Avatar>
                <p className="text-sm">Alex L. earned 15 ✨ for this submission</p>
              </div>
              <Button className="w-full" variant="outline">Join Challenge</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="size-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">First Feedback</p>
                  <p className="text-xs text-muted-foreground">Gave helpful critique to a peer</p>
                </div>
                <Badge variant="secondary">+3 ✨</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Trophy className="size-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Week Streak</p>
                  <p className="text-xs text-muted-foreground">7 days of consistent practice</p>
                </div>
                <Badge variant="secondary">+10 ✨</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserCheck className="size-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Helpful Reviewer</p>
                  <p className="text-xs text-muted-foreground">Completed 5 peer reviews this week</p>
                </div>
                <Badge variant="secondary">+8 ✨</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}