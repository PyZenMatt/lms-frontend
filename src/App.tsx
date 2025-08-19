import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar"
import { AuthProvider, useAuth } from "./components/AuthContext"
import { AuthForms } from "./components/AuthForms"
import { AppSidebar } from "./components/AppSidebar"
import { Dashboard } from "./components/Dashboard"
import { Community } from "./components/Community"
import { Achievements } from "./components/Achievements"
import { PeerReview } from "./components/PeerReview"
import { TeacherDashboard } from "./components/TeacherDashboard"
import { Wallet } from "./components/Wallet"
import { Profile } from "./components/Profile"
import { Settings } from "./components/Settings"
import { LearningPaths } from "./components/LearningPaths"
import { CommunityGallery } from "./components/CommunityGallery"
import { useState } from "react"
import { Button } from "./components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar"
import { Badge } from "./components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./components/ui/dropdown-menu"
import { LogOut, User, Wallet as WalletIcon, Settings as SettingsIcon } from "lucide-react"
import { Toaster } from "./components/ui/sonner"

function AppContent() {
  const { user, logout, isAuthenticated, isTeacher } = useAuth()
  const [currentPage, setCurrentPage] = useState("dashboard")

  if (!isAuthenticated) {
    return <AuthForms />
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "teacher-dashboard":
        return isTeacher ? <TeacherDashboard /> : <Dashboard />
      case "peer-review":
        return <PeerReview />
      case "community":
        return <Community />
      case "achievements":
        return <Achievements />
      case "wallet":
        return <Wallet />
      case "profile":
        return <Profile />
      case "settings":
        return <Settings />
      case "courses":
        return <LearningPaths />
      case "gallery":
        return <CommunityGallery />
      case "discussions":
        return (
          <div className="space-y-6">
            <h1>Discussions</h1>
            <p className="text-muted-foreground">Coming soon! This will be the community discussion forum.</p>
          </div>
        )
      default:
        return isTeacher ? <TeacherDashboard /> : <Dashboard />
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 lg:px-6">
              <SidebarTrigger className="mr-4" />
              <div className="flex-1" />
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage("wallet")}
                  className="flex items-center gap-2"
                >
                  <WalletIcon className="size-4" />
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {user?.tokens || 0} ✨
                  </Badge>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                        <Badge variant="outline" className="w-fit mt-1 capitalize">
                          {user?.role}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setCurrentPage("wallet")}>
                      <WalletIcon className="mr-2 h-4 w-4" />
                      <span>Wallet</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrentPage("profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrentPage("settings")}>
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="container max-w-6xl mx-auto p-6">
              {renderCurrentPage()}
            </div>
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}