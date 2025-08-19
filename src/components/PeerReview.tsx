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
  Upload,
  Clock,
  Star,
  CheckCircle,
  Eye,
  Award,
  Users,
  Sparkles,
} from 'lucide-react'
import { ImageWithFallback } from './figma/ImageWithFallback'

export function PeerReview() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Peer Review Studio</h1>
          <p className="text-muted-foreground">
            Submit your work and help fellow artists grow through constructive
            feedback
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 border-blue-200">
            <Eye className="size-3 mr-1" />3 pending reviews
          </Badge>
          <Button>
            <Upload className="size-4 mr-2" />
            Submit Exercise
          </Button>
        </div>
      </div>

      <Tabs defaultValue="review-others" className="space-y-6">
        <TabsList>
          <TabsTrigger value="review-others">Review Others</TabsTrigger>
          <TabsTrigger value="my-submissions">My Submissions</TabsTrigger>
          <TabsTrigger value="feedback-received">Feedback Received</TabsTrigger>
        </TabsList>

        <TabsContent value="review-others" className="space-y-4">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Award className="size-5 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Ready to Review</CardTitle>
                  <CardDescription>
                    Help your peers grow while earning Creator Tokens
                  </CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  +5 ✨ each
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {/* Review Assignment 1 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" />
                    <AvatarFallback>AN</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">Anonymous Student</p>
                    <p className="text-sm text-muted-foreground">
                      Digital Painting Fundamentals • Lesson 3: Color Theory
                    </p>
                  </div>
                  <Badge variant="outline">Due in 2 days</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">
                    Exercise: Create a color temperature study
                  </p>
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=400&fit=crop&crop=center"
                    alt="Student color temperature study"
                    className="w-full h-48 rounded-lg object-cover"
                  />
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Student's Note:</p>
                  <p className="text-sm text-muted-foreground">
                    "I tried to show the contrast between warm afternoon light
                    and cool shadows. I'm not sure if the transition feels
                    natural - any tips would be appreciated!"
                  </p>
                </div>
                <Button className="w-full">Start Review (+5 ✨)</Button>
              </CardContent>
            </Card>

            {/* Review Assignment 2 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>BS</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">Anonymous Student</p>
                    <p className="text-sm text-muted-foreground">
                      Character Design Workshop • Lesson 1: Basic Proportions
                    </p>
                  </div>
                  <Badge variant="outline">Due in 4 days</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">
                    Exercise: Character proportion studies
                  </p>
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&crop=center"
                    alt="Character proportion sketches"
                    className="w-full h-48 rounded-lg object-cover"
                  />
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Student's Note:</p>
                  <p className="text-sm text-muted-foreground">
                    "First time drawing full body characters. I think the
                    proportions might be off but I'm not sure where exactly.
                    Looking forward to feedback!"
                  </p>
                </div>
                <Button className="w-full" variant="outline">
                  Start Review (+5 ✨)
                </Button>
              </CardContent>
            </Card>

            {/* In Progress Review */}
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>CS</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">Anonymous Student</p>
                    <p className="text-sm text-muted-foreground">
                      Digital Painting Fundamentals • Lesson 2: Light & Shadow
                    </p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800">
                    In Progress
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Review Progress</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Technical Skills</span>
                      <span>4/5</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Creative Expression</span>
                      <span>3/5</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Following Instructions</span>
                      <span>5/5</span>
                    </div>
                  </div>
                </div>
                <Button className="w-full">Continue Review</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="my-submissions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Submission */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Color Temperature Study
                    </CardTitle>
                    <CardDescription>
                      Digital Painting Fundamentals • Lesson 3
                    </CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    <Clock className="size-3 mr-1" />
                    Reviewing
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=200&fit=crop&crop=center"
                  alt="My color temperature study"
                  className="w-full h-32 rounded-lg object-cover"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-medium">2</p>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium">1</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Submitted 1 day ago
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Completed Submission */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Light & Shadow Study
                    </CardTitle>
                    <CardDescription>
                      Digital Painting Fundamentals • Lesson 2
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="size-3 mr-1" />
                    Complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1578228406113-77951bb64eff?w=300&h=200&fit=crop&crop=center"
                  alt="My light and shadow study"
                  className="w-full h-32 rounded-lg object-cover"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-medium">4.2</p>
                      <p className="text-xs text-muted-foreground">
                        Avg Rating
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium">3</p>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                    </div>
                  </div>
                  <Badge variant="secondary">+12 ✨</Badge>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  View Feedback
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback-received" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1578228406113-77951bb64eff?w=60&h=60&fit=crop&crop=center"
                  alt="Light and shadow study"
                  className="size-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium">Light & Shadow Study</p>
                  <p className="text-sm text-muted-foreground">
                    Digital Painting Fundamentals • Lesson 2
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">4.2 average</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Review 1 */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback>R1</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Anonymous Reviewer 1</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Technical Skills</p>
                    <p className="font-medium">4/5</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Creativity</p>
                    <p className="font-medium">4/5</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Following Brief</p>
                    <p className="font-medium">5/5</p>
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Feedback:</p>
                  <p className="text-sm text-muted-foreground">
                    "Great work on the shadow casting! Your understanding of
                    light direction is solid. One suggestion: try pushing the
                    contrast more in the darkest shadows to create more dramatic
                    depth. The composition is well thought out."
                  </p>
                </div>
              </div>

              {/* Review 2 */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback>R2</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Anonymous Reviewer 2</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3 ${i < 5 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Technical Skills</p>
                    <p className="font-medium">5/5</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Creativity</p>
                    <p className="font-medium">4/5</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Following Brief</p>
                    <p className="font-medium">5/5</p>
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Feedback:</p>
                  <p className="text-sm text-muted-foreground">
                    "Excellent attention to detail! Your light source is
                    consistent throughout the piece. I love how you handled the
                    reflected light in the shadows. This shows strong
                    foundational understanding."
                  </p>
                </div>
              </div>

              {/* Review 3 */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback>R3</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Anonymous Reviewer 3</p>
                    <div className="flex items-center gap-1">
                      {[...Array(3)].map((_, i) => (
                        <Star
                          key={i}
                          className="size-3 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                      {[...Array(2)].map((_, i) => (
                        <Star
                          key={i + 3}
                          className="size-3 text-muted-foreground"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Technical Skills</p>
                    <p className="font-medium">3/5</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Creativity</p>
                    <p className="font-medium">3/5</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Following Brief</p>
                    <p className="font-medium">4/5</p>
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Feedback:</p>
                  <p className="text-sm text-muted-foreground">
                    "Good start! The basic light and shadow concepts are there.
                    For improvement, work on smoother gradations between light
                    and shadow areas. Also consider studying more reference
                    photos for realistic shadow behavior."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Process Guide */}
      <Card>
        <CardHeader>
          <CardTitle>How Peer Review Works</CardTitle>
          <CardDescription>
            Understanding our collaborative learning system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="size-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Upload className="size-6 text-blue-600" />
              </div>
              <h4>1. Submit Your Work</h4>
              <p className="text-sm text-muted-foreground">
                Upload your lesson exercise with a brief note about your goals
                and challenges.
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="size-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="size-6 text-green-600" />
              </div>
              <h4>2. Get Reviewed</h4>
              <p className="text-sm text-muted-foreground">
                Three anonymous peers will provide constructive feedback on your
                work.
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="size-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="size-6 text-purple-600" />
              </div>
              <h4>3. Review Others</h4>
              <p className="text-sm text-muted-foreground">
                Help fellow students by reviewing their work and earn Creator
                Tokens.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
