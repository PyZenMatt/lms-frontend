import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Slider } from './ui/slider'
import { Star, Send, ArrowLeft } from 'lucide-react'
import { ImageWithFallback } from './figma/ImageWithFallback'

export function ReviewForm() {
  const [technicalSkills, setTechnicalSkills] = useState([4])
  const [creativity, setCreativity] = useState([3])
  const [followingBrief, setFollowingBrief] = useState([5])
  const [feedback, setFeedback] = useState('')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="size-4 mr-2" />
          Back to Reviews
        </Button>
        <div>
          <h1>Review Student Work</h1>
          <p className="text-muted-foreground">
            Provide constructive feedback to help your peer grow
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Artwork Display */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>AS</AvatarFallback>
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
                  className="w-full h-64 rounded-lg object-cover"
                />
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Student's Note:</p>
                <p className="text-sm text-muted-foreground">
                  "I tried to show the contrast between warm afternoon light and
                  cool shadows. I'm not sure if the transition feels natural -
                  any tips would be appreciated!"
                </p>
              </div>
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm font-medium mb-1">Lesson Objectives:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Demonstrate understanding of warm vs cool colors</li>
                  <li>• Show proper light source direction</li>
                  <li>• Create smooth color temperature transitions</li>
                  <li>• Apply color theory to create mood</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Review</CardTitle>
              <CardDescription>
                Rate different aspects and provide constructive feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Technical Skills</Label>
                  <p className="text-sm text-muted-foreground">
                    How well did they execute the technical aspects?
                  </p>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={technicalSkills}
                      onValueChange={setTechnicalSkills}
                      max={5}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`size-4 ${i < technicalSkills[0] ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Creative Expression</Label>
                  <p className="text-sm text-muted-foreground">
                    How creative and original is their approach?
                  </p>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={creativity}
                      onValueChange={setCreativity}
                      max={5}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`size-4 ${i < creativity[0] ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Following Brief</Label>
                  <p className="text-sm text-muted-foreground">
                    How well did they meet the lesson requirements?
                  </p>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={followingBrief}
                      onValueChange={setFollowingBrief}
                      max={5}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`size-4 ${i < followingBrief[0] ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Written Feedback</Label>
                <p className="text-sm text-muted-foreground">
                  Share specific, actionable suggestions to help them improve
                </p>
                <Textarea
                  id="feedback"
                  placeholder="What did they do well? What could be improved? Be specific and constructive..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-32"
                />
                <p className="text-xs text-muted-foreground">
                  {feedback.length}/500 characters
                </p>
              </div>

              <div className="bg-green-50/50 p-3 rounded-lg border border-green-200">
                <p className="text-sm font-medium mb-1">
                  💡 Good Feedback Tips:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Start with what they did well</li>
                  <li>• Be specific about areas to improve</li>
                  <li>• Suggest techniques or resources</li>
                  <li>• Keep it encouraging and constructive</li>
                </ul>
              </div>

              <Button className="w-full" disabled={feedback.length < 20}>
                <Send className="size-4 mr-2" />
                Submit Review (+5 ✨)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
