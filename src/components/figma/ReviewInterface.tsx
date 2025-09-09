import { useState } from "react"
import { sendReview } from "../../services/reviews"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Progress } from "./ui/progress"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { 
  ArrowLeft, 
  Star, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Target,
  Lightbulb,
  Heart
} from "lucide-react"
import { useAuth } from "./AuthContext"
import { ImageWithFallback } from "./figma/ImageWithFallback"
import { toast } from "sonner"

interface Submission {
  id: string
  studentNote: string
  course: string
  lesson: string
  exerciseTitle: string
  exerciseDescription: string
  image: string
  submittedAt: string
  studentId: string
}

interface ReviewInterfaceProps {
  submission: Submission
  onBack: () => void
  onComplete: () => void
}

interface ReviewScores {
  technical: number
  creative: number
  instructions: number
}

export function ReviewInterface({ submission, onBack, onComplete }: ReviewInterfaceProps) {
  const { updateTokens } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [scores, setScores] = useState<ReviewScores>({
    technical: 0,
    creative: 0,
    instructions: 0
  })
  const [feedback, setFeedback] = useState("")
  const [strengthsHighlight, setStrengthsHighlight] = useState("")
  const [improvementSuggestions, setImprovementSuggestions] = useState("")
  const [techniqueNotes, setTechniqueNotes] = useState("")
  const [creativeNotes, setCreativeNotes] = useState("")
  const [followingNotes, setFollowingNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const handleScoreChange = (category: keyof ReviewScores, value: number) => {
    setScores(prev => ({ ...prev, [category]: value }))
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return scores.technical > 0 && scores.creative > 0 && scores.instructions > 0
      case 2:
        return strengthsHighlight.trim().length >= 20
      case 3:
        return improvementSuggestions.trim().length >= 20
      case 4:
        return feedback.trim().length >= 20
      default:
        return false
    }
  }

  const handleSubmitReview = () => {
    if (submitting || submitted) return
    setSubmitting(true)
    const payload = {
      technical: scores.technical || undefined,
      creative: scores.creative || undefined,
      following: scores.instructions || undefined,
      // also send a concise comment combining strengths/suggestions/feedback
  comment: `${strengthsHighlight.trim()}\n\nSuggestions:\n${improvementSuggestions.trim()}\n\nFinal:\n${feedback.trim()}`.trim(),
  // New per-area textual fields (optional): prefer these on backend
  technical_comment: techniqueNotes?.trim() || undefined,
  creative_comment: creativeNotes?.trim() || undefined,
  following_comment: followingNotes?.trim() || undefined,
      recommendations: [],
    }
    // send the review (best-effort, endpoint discovery is handled in service)
    ;(async () => {
      try {
        const res = await sendReview(Number(submission.id), payload)
        if (res.ok) {
          updateTokens(5)
          setSubmitted(true)
          toast("Review submitted successfully! ✨", {
            description: "You earned 5 tokens for helping a fellow artist grow"
          })
          // allow parent to cleanup/navigate after a short delay
          setTimeout(() => onComplete(), 900)
        } else {
          toast.error?.(`Review submission failed: HTTP ${res.status}`)
        }
      } catch (err) {
        console.error(err)
        toast.error?.("Review submission failed")
      } finally {
        setSubmitting(false)
      }
    })()
  }

  const StarRating = ({ value, onChange, label }: { value: number, onChange: (value: number) => void, label: string }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className="transition-colors hover:scale-110 transform"
          >
            <Star 
              className={`size-6 ${
                star <= value 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-muted-foreground hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Target className="size-12 text-blue-600 mx-auto" />
              <h3 className="text-lg font-medium">Rate the Artwork</h3>
              <p className="text-muted-foreground">
                Rate each aspect honestly and constructively
              </p>
            </div>
            
            <div className="space-y-6">
              <StarRating
                value={scores.technical}
                onChange={(value) => handleScoreChange('technical', value)}
                label="Technical Skills"
              />
              <p className="text-xs text-muted-foreground">
                Consider: technique execution, skill with tools, understanding of fundamentals
              </p>
              
              <StarRating
                value={scores.creative}
                onChange={(value) => handleScoreChange('creative', value)}
                label="Creative Expression"
              />
              <p className="text-xs text-muted-foreground">
                Consider: artistic vision, creativity, personal style, visual impact
              </p>
              
              <StarRating
                value={scores.instructions}
                onChange={(value) => handleScoreChange('instructions', value)}
                label="Following Instructions"
              />
              <p className="text-xs text-muted-foreground">
                Consider: met exercise requirements, followed guidelines, addressed objectives
              </p>
            </div>
          </div>
        )
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Heart className="size-12 text-green-600 mx-auto" />
              <h3 className="text-lg font-medium">Highlight Strengths</h3>
              <p className="text-muted-foreground">
                What did the artist do well? Be specific and encouraging.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="strengths">What are the strongest aspects of this work?</Label>
              <Textarea
                id="strengths"
                placeholder="Example: Your color choices create a great sense of mood and atmosphere. The way you handled the light reflection on the water is particularly skillful..."
                value={strengthsHighlight}
                onChange={(e) => setStrengthsHighlight(e.target.value)}
                className="min-h-24"
              />
              <div className="mt-2">
                <Label htmlFor="technique-notes">Note Technique (optional)</Label>
                <Textarea
                  id="technique-notes"
                  placeholder="Optional: specific notes about technique"
                  value={techniqueNotes}
                  onChange={(e) => setTechniqueNotes(e.target.value)}
                  className="min-h-20"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={strengthsHighlight.length >= 20 ? "text-green-600" : "text-muted-foreground"}>
                  {strengthsHighlight.length} characters (minimum 20)
                </span>
                {strengthsHighlight.length >= 20 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="size-3" />
                    Good to go!
                  </div>
                )}
              </div>
            </div>
          </div>
        )
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Lightbulb className="size-12 text-amber-600 mx-auto" />
              <h3 className="text-lg font-medium">Constructive Suggestions</h3>
              <p className="text-muted-foreground">
                How could this work be improved? Focus on actionable advice.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="improvements">What suggestions do you have for improvement?</Label>
              <Textarea
                id="improvements"
                placeholder="Example: Consider adding more contrast in your shadows to create more depth. You might also experiment with varying your brush sizes to create more texture..."
                value={improvementSuggestions}
                onChange={(e) => setImprovementSuggestions(e.target.value)}
                className="min-h-24"
              />
              <div className="mt-2">
                <Label htmlFor="creative-notes">Note Creative (optional)</Label>
                <Textarea
                  id="creative-notes"
                  placeholder="Optional: notes about creative choices"
                  value={creativeNotes}
                  onChange={(e) => setCreativeNotes(e.target.value)}
                  className="min-h-20"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={improvementSuggestions.length >= 20 ? "text-green-600" : "text-muted-foreground"}>
                  {improvementSuggestions.length} characters (minimum 20)
                </span>
                {improvementSuggestions.length >= 20 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="size-3" />
                    Good to go!
                  </div>
                )}
              </div>
            </div>
          </div>
        )
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <CheckCircle className="size-12 text-blue-600 mx-auto" />
              <h3 className="text-lg font-medium">Final Thoughts</h3>
              <p className="text-muted-foreground">
                Wrap up with overall impressions and encouragement.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="overall-feedback">Overall feedback and encouragement</Label>
              <Textarea
                id="overall-feedback"
                placeholder="Example: Great progress on this exercise! You're clearly developing your skills. Keep experimenting and don't be afraid to push your boundaries..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-24"
              />
              <div className="mt-2">
                <Label htmlFor="following-notes">Note Following (optional)</Label>
                <Textarea
                  id="following-notes"
                  placeholder="Optional: notes about following instructions / requirements"
                  value={followingNotes}
                  onChange={(e) => setFollowingNotes(e.target.value)}
                  className="min-h-20"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={feedback.length >= 20 ? "text-green-600" : "text-muted-foreground"}>
                  {feedback.length} characters (minimum 20)
                </span>
                {feedback.length >= 20 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="size-3" />
                    Ready to submit!
                  </div>
                )}
              </div>
            </div>
            
            {/* Review Summary */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Review Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">Technical</p>
                    <div className="flex items-center justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`size-3 ${i < scores.technical ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                    <p className="font-medium">{scores.technical}/5</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Creative</p>
                    <div className="flex items-center justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`size-3 ${i < scores.creative ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                    <p className="font-medium">{scores.creative}/5</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Instructions</p>
                    <div className="flex items-center justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`size-3 ${i < scores.instructions ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                    <p className="font-medium">{scores.instructions}/5</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Overall Average</p>
                  <p className="text-lg font-medium">
                    {((scores.technical + scores.creative + scores.instructions) / 3).toFixed(1)}/5
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Reviews
          </Button>
          <div>
            <h1>Peer Review</h1>
            <p className="text-muted-foreground">Help a fellow artist grow with constructive feedback</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          +5 ✨ for completing
        </Badge>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Review Progress</span>
            <span className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Artwork Being Reviewed */}
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>AS</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">Anonymous Student</CardTitle>
                <CardDescription>{submission.course} • {submission.lesson}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">{submission.exerciseTitle}</h4>
              <p className="text-sm text-muted-foreground mb-3">{submission.exerciseDescription}</p>
              <ImageWithFallback
                src={submission.image}
                alt="Student artwork submission"
                className="w-full h-64 rounded-lg object-cover"
              />
            </div>
            
            {submission.studentNote && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Student's Note:</p>
                <p className="text-sm text-muted-foreground">"{submission.studentNote}"</p>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              Submitted {submission.submittedAt}
            </div>
          </CardContent>
        </Card>

        {/* Review Form */}
        <Card>
          <CardContent className="p-6">
            {renderStepContent()}
            
            <div className="flex items-center justify-between pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < totalSteps ? (
                <Button 
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceedToNext()}
                >
                  Next Step
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmitReview}
                  disabled={!canProceedToNext() || submitting || submitted}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Upload className="size-4 mr-2" />
                  {submitting ? 'Submitting…' : submitted ? 'Submitted' : 'Submit Review (+5 ✨)'}
                </Button>
              )}
            </div>
            
            {!canProceedToNext() && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="size-4 text-amber-600" />
                <p className="text-sm text-amber-800">
                  {currentStep === 1 && "Please rate all three aspects to continue."}
                  {currentStep > 1 && "Please provide at least 20 characters of feedback to continue."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}