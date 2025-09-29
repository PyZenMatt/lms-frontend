import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Progress } from "./ui/progress"
import { ImageWithFallback } from "./figma/ImageWithFallback"

interface DashboardProps {
  onContinueCourse?: (courseId: string) => void
  onNavigateToPage?: (page: string) => void
}

import useDashboardStats from "@/hooks/useDashboardStats";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function Dashboard({ onContinueCourse, onNavigateToPage }: DashboardProps) {
  const { stats, loading } = useDashboardStats();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  // stats used only for enrolled courses listing

  return (
    <div className="space-y-6">
      {/* Welcome Section (simplified) */}
      <div>
        <h1>Welcome back, {currentUser?.name || 'User'}!</h1>
        <p className="text-muted-foreground">Continue your web developer journey and connect with me and other developers!</p>
      </div>

      {/* Continue Learning (keep the course list area) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3>Continue Learning</h3>
        </div>
        <div className="space-y-3">
          {loading ? (
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
      </div>
    </div>
  )
}