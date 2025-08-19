import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  Trophy,
  Star,
  Users,
  Heart,
  BookOpen,
  Sparkles,
  Award,
  Target,
} from 'lucide-react'

export function Achievements() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Achievements & Recognition</h1>
        <p className="text-muted-foreground">
          Track your artistic journey and community contributions
        </p>
      </div>

      {/* Token Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-12 bg-purple-500 rounded-full flex items-center justify-center">
                <Sparkles className="size-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-medium">247</p>
                <p className="text-sm text-muted-foreground">Creator Tokens</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-12 bg-green-100 rounded-full flex items-center justify-center">
                <Trophy className="size-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-medium">12</p>
                <p className="text-sm text-muted-foreground">
                  Achievements Unlocked
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Award className="size-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-medium">Elite</p>
                <p className="text-sm text-muted-foreground">Community Rank</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="earned" className="space-y-6">
        <TabsList>
          <TabsTrigger value="earned">Earned</TabsTrigger>
          <TabsTrigger value="progress">In Progress</TabsTrigger>
          <TabsTrigger value="all">All Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="earned" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-amber-500 rounded-full flex items-center justify-center">
                    <Star className="size-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      First Masterpiece
                    </CardTitle>
                    <CardDescription>
                      Completed your first major artwork
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Earned 3 days ago
                  </p>
                  <Badge className="bg-amber-100 text-amber-800">+15 ✨</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Heart className="size-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      Community Helper
                    </CardTitle>
                    <CardDescription>
                      Provided helpful feedback to 10 peers
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Earned 1 week ago
                  </p>
                  <Badge className="bg-green-100 text-green-800">+20 ✨</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <BookOpen className="size-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Learning Streak</CardTitle>
                    <CardDescription>
                      Practiced art for 7 consecutive days
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Earned 2 weeks ago
                  </p>
                  <Badge className="bg-blue-100 text-blue-800">+10 ✨</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <Users className="size-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Collaborator</CardTitle>
                    <CardDescription>
                      Participated in a community project
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Earned 3 weeks ago
                  </p>
                  <Badge className="bg-purple-100 text-purple-800">
                    +25 ✨
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-muted rounded-full flex items-center justify-center">
                    <Target className="size-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Mentor</CardTitle>
                    <CardDescription>
                      Help 25 community members (18/25)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={72} className="h-2" />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">7 more to go!</p>
                  <Badge variant="outline">+50 ✨</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-muted rounded-full flex items-center justify-center">
                    <BookOpen className="size-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Course Master</CardTitle>
                    <CardDescription>
                      Complete 5 learning paths (2/5)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={40} className="h-2" />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    3 more courses
                  </p>
                  <Badge variant="outline">+75 ✨</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-muted rounded-full flex items-center justify-center">
                    <Star className="size-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      Gallery Featured
                    </CardTitle>
                    <CardDescription>
                      Get artwork featured in community gallery
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Submit high-quality artwork for review
                </p>
                <Badge variant="outline">+30 ✨</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-muted rounded-full flex items-center justify-center">
                    <Users className="size-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      Community Leader
                    </CardTitle>
                    <CardDescription>
                      Organize a community event or challenge
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Reach out to moderators to propose an event
                </p>
                <Badge variant="outline">+100 ✨</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Token Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>How Creator Tokens Work</CardTitle>
          <CardDescription>
            Understanding our community recognition system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4>Earn Tokens By:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Completing learning modules</li>
                <li>• Providing helpful feedback</li>
                <li>• Participating in challenges</li>
                <li>• Contributing to community projects</li>
                <li>• Mentoring other artists</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4>Recognition Benefits:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Unlock advanced tutorials</li>
                <li>• Access exclusive community events</li>
                <li>• Priority mentor matching</li>
                <li>• Featured gallery placement</li>
                <li>• Community leadership opportunities</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
