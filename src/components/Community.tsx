import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  Heart,
  MessageCircle,
  Share2,
  Award,
  Users,
  Sparkles,
} from 'lucide-react'
import { ImageWithFallback } from './figma/ImageWithFallback'

export function Community() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Community</h1>
          <p className="text-muted-foreground">
            Connect, share, and grow together as artists
          </p>
        </div>
        <Button>
          <Share2 className="size-4 mr-2" />
          Share Your Work
        </Button>
      </div>

      <Tabs defaultValue="feed" className="space-y-6">
        <TabsList>
          <TabsTrigger value="feed">Community Feed</TabsTrigger>
          <TabsTrigger value="mentors">Mentors</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="leaderboard">Recognition Board</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          {/* Community Post */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">Jake Davis</p>
                  <p className="text-sm text-muted-foreground">
                    Shared a digital painting • 2 hours ago
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-purple-50 border-purple-200"
                >
                  <Sparkles className="size-3 mr-1" />
                  Creator
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                Just finished this landscape study! The lighting was really
                challenging but I learned a lot about color temperature. Any
                feedback is welcome! 🎨
              </p>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&crop=center"
                alt="Digital landscape painting"
                className="w-full h-64 rounded-lg object-cover"
              />
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm">
                    <Heart className="size-4 mr-1" />
                    23
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="size-4 mr-1" />8
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="size-4 mr-1" />
                    Share
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Earned 8 ✨ from community feedback
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mentor Spotlight Post */}
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face" />
                  <AvatarFallback>SM</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Sarah Mitchell</p>
                    <Badge variant="secondary" className="bg-amber-100">
                      <Award className="size-3 mr-1" />
                      Mentor
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Posted a tutorial • 4 hours ago
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                New tutorial: "Understanding Light and Shadow in Digital Art" 💡
                This covers the fundamentals that will elevate your work
                instantly!
              </p>
              <div className="bg-white p-4 rounded-lg border">
                <h4>Light & Shadow Masterclass</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  45 min video tutorial + practice exercises
                </p>
                <Button className="mt-3" size="sm">
                  Watch Tutorial
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                🏆 Complete this tutorial to earn 15 ✨ Creator Tokens
              </div>
            </CardContent>
          </Card>

          {/* Community Collaboration */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Users className="size-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Community Project</p>
                  <p className="text-sm text-muted-foreground">
                    Collaborative mural project • 12 contributors
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                Join our monthly collaborative digital mural! This month's
                theme: "Future Cities". Each contributor gets to work on a
                section.
              </p>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=300&fit=crop&crop=center"
                alt="Futuristic city digital art"
                className="w-full h-40 rounded-lg object-cover"
              />
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[...Array(6)].map((_, i) => (
                    <Avatar key={i} className="size-6 border-2 border-white">
                      <AvatarFallback className="text-xs">
                        {String.fromCharCode(65 + i)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  <div className="size-6 bg-muted rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs">+6</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Join Project (+20 ✨)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Recognition Board</CardTitle>
              <CardDescription>
                Community members who've made outstanding contributions this
                month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  name: 'Alex Rivera',
                  tokens: 342,
                  achievement: 'Most Helpful Feedback',
                  avatar: 'AR',
                },
                {
                  name: 'Maya Chen',
                  tokens: 298,
                  achievement: 'Tutorial Creator',
                  avatar: 'MC',
                },
                {
                  name: 'Jordan Kim',
                  tokens: 275,
                  achievement: 'Community Builder',
                  avatar: 'JK',
                },
                {
                  name: 'Sam Wilson',
                  tokens: 231,
                  achievement: 'Collaboration Leader',
                  avatar: 'SW',
                },
              ].map((member, index) => (
                <div
                  key={member.name}
                  className="flex items-center gap-4 p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-lg font-medium text-muted-foreground w-6 text-center">
                      #{index + 1}
                    </div>
                    <Avatar>
                      <AvatarFallback>{member.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.achievement}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{member.tokens} ✨</p>
                    <p className="text-sm text-muted-foreground">this month</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
