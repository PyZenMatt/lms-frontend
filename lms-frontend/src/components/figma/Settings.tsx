import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Separator } from "./ui/separator"
import { Badge } from "./ui/badge"
import { 
  Moon, 
  Sun, 
  Bell, 
  Mail, 
  Shield, 
  User, 
  Palette,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Save,
  Trash2,
  AlertTriangle
} from "lucide-react"
import { useAuth } from "./AuthContext"
import { toast } from "sonner"

export function Settings() {
  const { user } = useAuth()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    peerReviewNotifications: true,
    achievementNotifications: true,
    courseNotifications: true,
    communityNotifications: false,
    
    // Privacy
    profileVisibility: 'public',
    showEmail: false,
    showProgress: true,
    allowMessages: true,
    
    // Preferences
    language: 'en',
    timezone: 'UTC-8',
    autoplayVideos: true,
    soundEffects: true,
    compactMode: false
  })

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
    toast(isDarkMode ? "Switched to light mode" : "Switched to dark mode")
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = () => {
    // In real app, this would save to backend
    toast("Settings saved successfully!")
  }

  const handleDeleteAccount = () => {
    // In real app, this would show confirmation dialog
    toast("Account deletion requires email confirmation", {
      description: "Please check your email for further instructions"
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and privacy settings</p>
        </div>
        <Button onClick={handleSaveSettings}>
          <Save className="size-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="size-5" />
                Theme
              </CardTitle>
              <CardDescription>Customize the appearance of the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark themes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="size-4" />
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={handleDarkModeToggle}
                  />
                  <Moon className="size-4" />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <Label>Display Preferences</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Compact Mode</Label>
                      <p className="text-xs text-muted-foreground">Reduce spacing and padding</p>
                    </div>
                    <Switch
                      checked={settings.compactMode}
                      onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Autoplay Videos</Label>
                      <p className="text-xs text-muted-foreground">Automatically play lesson videos</p>
                    </div>
                    <Switch
                      checked={settings.autoplayVideos}
                      onCheckedChange={(checked) => handleSettingChange('autoplayVideos', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Sound Effects</Label>
                      <p className="text-xs text-muted-foreground">Play sounds for notifications and actions</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {settings.soundEffects ? (
                        <Volume2 className="size-4 text-muted-foreground" />
                      ) : (
                        <VolumeX className="size-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={settings.soundEffects}
                        onCheckedChange={(checked) => handleSettingChange('soundEffects', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <Label>Language & Region</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-sm">Language</Label>
                    <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-sm">Timezone</Label>
                    <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                        <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                        <SelectItem value="UTC+0">GMT (UTC+0)</SelectItem>
                        <SelectItem value="UTC+1">Central European (UTC+1)</SelectItem>
                        <SelectItem value="UTC+9">Japan Standard (UTC+9)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-5" />
                Notifications
              </CardTitle>
              <CardDescription>Control when and how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates via email
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive browser and mobile notifications
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="size-4 text-muted-foreground" />
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <Label>Notification Types</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Peer Reviews</Label>
                      <p className="text-xs text-muted-foreground">When you receive feedback or need to review</p>
                    </div>
                    <Switch
                      checked={settings.peerReviewNotifications}
                      onCheckedChange={(checked) => handleSettingChange('peerReviewNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Achievements</Label>
                      <p className="text-xs text-muted-foreground">When you earn tokens or unlock milestones</p>
                    </div>
                    <Switch
                      checked={settings.achievementNotifications}
                      onCheckedChange={(checked) => handleSettingChange('achievementNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Course Updates</Label>
                      <p className="text-xs text-muted-foreground">New lessons and course announcements</p>
                    </div>
                    <Switch
                      checked={settings.courseNotifications}
                      onCheckedChange={(checked) => handleSettingChange('courseNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Community Activity</Label>
                      <p className="text-xs text-muted-foreground">Forum posts and community discussions</p>
                    </div>
                    <Switch
                      checked={settings.communityNotifications}
                      onCheckedChange={(checked) => handleSettingChange('communityNotifications', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5" />
                Privacy & Visibility
              </CardTitle>
              <CardDescription>Control what others can see about your profile and activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Visibility</Label>
                  <Select value={settings.profileVisibility} onValueChange={(value) => handleSettingChange('profileVisibility', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can view</SelectItem>
                      <SelectItem value="community">Community - Only ArtLearn members</SelectItem>
                      <SelectItem value="private">Private - Only you</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Controls who can see your profile, portfolio, and achievements
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label>Profile Information</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Show Email Address</Label>
                        <p className="text-xs text-muted-foreground">Allow others to see your email</p>
                      </div>
                      <Switch
                        checked={settings.showEmail}
                        onCheckedChange={(checked) => handleSettingChange('showEmail', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Show Learning Progress</Label>
                        <p className="text-xs text-muted-foreground">Display course progress and stats</p>
                      </div>
                      <Switch
                        checked={settings.showProgress}
                        onCheckedChange={(checked) => handleSettingChange('showProgress', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Allow Direct Messages</Label>
                        <p className="text-xs text-muted-foreground">Let community members contact you</p>
                      </div>
                      <Switch
                        checked={settings.allowMessages}
                        onCheckedChange={(checked) => handleSettingChange('allowMessages', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Account Information
              </CardTitle>
              <CardDescription>Manage your account details and security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current-email">Email Address</Label>
                  <Input
                    id="current-email"
                    type="email"
                    value={user?.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-role">Account Type</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {user?.role}
                    </Badge>
                    <Button variant="link" size="sm" className="h-auto p-0">
                      Change Role
                    </Button>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <Label>Security</Label>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Enable Two-Factor Authentication
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Download Account Data
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <Label className="text-red-600">Danger Zone</Label>
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="size-5 text-red-600" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-red-800">Delete Account</h4>
                        <p className="text-xs text-red-600">
                          Permanently delete your account and all associated data
                        </p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                        <Trash2 className="size-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}