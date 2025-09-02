import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Palette, Sparkles, GraduationCap, Users } from "lucide-react"
import { useAuth } from "./AuthContext"

export function AuthForms({ defaultTab = "login" }: { defaultTab?: "login" | "signup" }) {
  const { login, signup } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  })

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student" as "student" | "teacher"
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const success = await login(loginForm.email, loginForm.password)
    if (!success) {
      setError("Invalid email or password")
    }
    setIsLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Guardrail: enforce max length for name
    if (signupForm.name && signupForm.name.length > 20) {
      setError("Name must be 20 characters or less")
      setIsLoading(false)
      return
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    const success = await signup(
      signupForm.name,
      signupForm.email,
      signupForm.password,
      signupForm.role
    )
    
    if (!success) {
      setError("Failed to create account")
    }
  // signup now delegates to the central postAuth flow for persistence + redirect
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="size-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Palette className="size-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-medium">ArtLearn</h1>
          <p className="text-muted-foreground">Community-focused art education platform</p>
        </div>

  <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Sign in to continue your artistic journey</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      required
                    />
                  </div>
                  {error && (
                    <p id="auth-form-error" className="text-sm text-destructive">{error}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">Demo accounts:</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-blue-600" />
                        <span className="text-sm">Student: maya@example.com</span>
                      </div>
                      <Badge variant="outline">247 ✨</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="size-4 text-green-600" />
                        <span className="text-sm">Teacher: sarah@example.com</span>
                      </div>
                      <Badge variant="outline">1250 ✨</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Password: any text</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Join ArtLearn</CardTitle>
                <CardDescription>Create your account and start learning</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      placeholder="Enter your full name"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({...signupForm, name: e.target.value})}
                      maxLength={20}
                      required
                    />
                    <p id="signup-name-hint" className="text-xs text-muted-foreground">Max 20 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">I want to</Label>
                    <Select 
                      value={signupForm.role} 
                      onValueChange={(value: "student" | "teacher") => setSignupForm({...signupForm, role: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">
                          <div className="flex items-center gap-2">
                            <Users className="size-4" />
                            Learn art (Student)
                          </div>
                        </SelectItem>
                        <SelectItem value="teacher">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="size-4" />
                            Teach art (Teacher)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                      required
                      hintId="signup-password-hint"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({...signupForm, confirmPassword: e.target.value})}
                      required
                      hintId="signup-confirm-password-hint"
                    />
                  </div>
                  {error && (
                    <p id="auth-form-error" className="text-sm text-destructive">{error}</p>
                  )}
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="size-4 text-purple-600" />
                      <span className="text-sm font-medium">Welcome Bonus</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {signupForm.role === 'teacher' ? 'Teachers start with 500 ✨ Creator Tokens' : 'Students start with 50 ✨ Creator Tokens'}
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}