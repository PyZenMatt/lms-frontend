import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { 
  Wallet as WalletIcon, 
  Sparkles, 
  Copy, 
  TrendingUp,
  Target
} from "lucide-react"
import { useAuth } from "./AuthContext"
import { toast } from "sonner"

export function Wallet() {
  const { user, connectWallet } = useAuth()
  void connectWallet
  void WalletIcon
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnectWallet = async () => {
    setIsConnecting(true)
    const success = await connectWallet()
    if (success) {
      toast("Wallet connected successfully!", {
        description: "You can now receive tokens directly to your MetaMask wallet"
      })
    } else {
      toast("Failed to connect wallet", {
        description: "Please make sure MetaMask is installed and try again"
      })
    }
    setIsConnecting(false)
  }

  const copyWalletAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress)
      toast("Address copied to clipboard")
    }
  }

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Mock transaction history
  const recentTransactions = [
    { type: 'earned', amount: 5, description: 'Peer review completed', date: '2 hours ago' },
    { type: 'earned', amount: 15, description: 'Assignment submitted', date: '1 day ago' },
    { type: 'earned', amount: 3, description: 'Helpful feedback given', date: '2 days ago' },
    { type: 'earned', amount: 10, description: 'Weekly streak bonus', date: '3 days ago' },
    { type: 'earned', amount: 25, description: 'Community project participation', date: '1 week ago' },
  ]

  const nextMilestones = [
    { name: 'Art Enthusiast', requirement: 300, reward: 50, current: user?.tokens || 0 },
    { name: 'Community Helper', requirement: 500, reward: 100, current: user?.tokens || 0 },
    { name: 'Master Critic', requirement: 1000, reward: 200, current: user?.tokens || 0 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Your Wallet</h1>
          <p className="text-muted-foreground">Manage your Creator Tokens and rewards</p>
        </div>
        {!user?.walletAddress && (
          <Button onClick={handleConnectWallet} disabled={isConnecting}>
            <WalletIcon className="size-4 mr-2" />
            {isConnecting ? "Connecting..." : "Connect MetaMask"}
          </Button>
        )}
      </div>

      {/* Token Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="size-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="size-6 text-white" />
              </div>
              <div>
                <CardTitle>Creator Token Balance</CardTitle>
                <CardDescription>Your learning and community contributions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-medium">{user?.tokens || 0}</span>
              <span className="text-xl text-muted-foreground">✨</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="size-4" />
                <span>+23 this week</span>
              </div>
              <div className="text-muted-foreground">
                Rank #{42} in community
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">MetaMask Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user?.walletAddress ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Connected</span>
                  <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800">
                    Active
                  </Badge>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">
                      {formatWalletAddress(user.walletAddress)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={copyWalletAddress}>
                      <Copy className="size-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tokens can be transferred to this wallet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connect MetaMask to receive tokens directly in your wallet
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="w-full"
                >
                  <WalletIcon className="size-4 mr-2" />
                  Connect Wallet
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="rewards">Reward System</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest token earnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="size-8 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="size-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-50 text-green-800">
                    +{transaction.amount} ✨
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <div className="space-y-4">
            {nextMilestones.map((milestone, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <Target className="size-5 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{milestone.name}</CardTitle>
                        <CardDescription>
                          {milestone.current}/{milestone.requirement} tokens
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">+{milestone.reward} ✨</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress 
                    value={(milestone.current / milestone.requirement) * 100} 
                    className="h-2"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {milestone.requirement - milestone.current} more tokens to unlock
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>How to Earn Creator Tokens</CardTitle>
              <CardDescription>Ways to contribute and grow in the community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4>Learning Activities</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Complete a lesson</span>
                      <Badge variant="secondary">+5 ✨</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Submit an exercise</span>
                      <Badge variant="secondary">+10 ✨</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Finish a course</span>
                      <Badge variant="secondary">+50 ✨</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Weekly learning streak</span>
                      <Badge variant="secondary">+15 ✨</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4>Community Contributions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Peer review feedback</span>
                      <Badge variant="secondary">+5 ✨</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Helpful forum post</span>
                      <Badge variant="secondary">+3 ✨</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Mentor a student</span>
                      <Badge variant="secondary">+20 ✨</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Create a tutorial</span>
                      <Badge variant="secondary">+100 ✨</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}