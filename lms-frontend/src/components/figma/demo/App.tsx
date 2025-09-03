import { SidebarProvider, SidebarTrigger } from "../ui/sidebar"
import { AuthProvider, useAuth } from "../AuthContext"
import { AuthForms } from "../AuthForms"
import { AppSidebar } from "../AppSidebar"
import { Dashboard } from "../Dashboard"
import { Community } from "../Community"
import { Achievements } from "../Achievements"
import { PeerReview } from "../PeerReview"
import { TeacherDashboard } from "../TeacherDashboard"
import { Wallet } from "../Wallet"
import { Profile } from "../Profile"
import { Settings } from "../Settings"
import { LearningPaths } from "../LearningPaths"
import { CommunityGallery } from "../CommunityGallery"
import { CourseViewer } from "../CourseViewer"
import { CourseDetails } from "../CourseDetails"
import { useState } from "react"
import { Button } from "../ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { LogOut, User, Wallet as WalletIcon, Settings as SettingsIcon } from "lucide-react"
import { Toaster } from "./components/ui/sonner"

interface PageState {
  page: string
  courseId?: string
}

function AppContent() {
  const { user, logout, isAuthenticated, isTeacher } = useAuth()
  const [currentState, setCurrentState] = useState<PageState>({ page: "dashboard" })

  if (!isAuthenticated) {
    return <AuthForms />
  }

  const navigateToPage = (page: string) => {
    setCurrentState({ page })
  }

  const navigateToCourse = (courseId: string, viewMode: 'student' | 'teacher' = 'student') => {
    if (viewMode === 'student') {
      setCurrentState({ page: "course-viewer", courseId })
    } else {
      setCurrentState({ page: "course-details", courseId })
    }
  }

  const renderCurrentPage = () => {
    switch (currentState.page) {
      case "teacher-dashboard":
        return isTeacher ? (
          <TeacherDashboard onViewCourse={(courseId) => navigateToCourse(courseId, 'teacher')} />
        ) : (
          <Dashboard onContinueCourse={navigateToCourse} onNavigateToPage={navigateToPage} />
        )
      case "course-viewer":
        return currentState.courseId ? (
          <CourseViewer 
            courseId={currentState.courseId}
            onBack={() => navigateToPage("courses")}
            onNavigateToPage={navigateToPage}
          />
        ) : null
      case "course-details":
        return currentState.courseId ? (
          <CourseDetails 
            courseId={currentState.courseId}
            onBack={() => navigateToPage("teacher-dashboard")}
            onEdit={() => console.log("Edit course:", currentState.courseId)}
          />
        ) : null
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
        return <LearningPaths onContinueCourse={navigateToCourse} />
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
        return isTeacher ? (
          <TeacherDashboard onViewCourse={(courseId) => navigateToCourse(courseId, 'teacher')} />
        ) : (
          <Dashboard onContinueCourse={navigateToCourse} onNavigateToPage={navigateToPage} />
        )
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar 
          currentPage={currentState.page} 
          onPageChange={navigateToPage} 
        />
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 lg:px-6">
              <SidebarTrigger className="mr-4" />
              <div className="flex-1" />
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToPage("wallet")}
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
                    <DropdownMenuItem onClick={() => navigateToPage("wallet")}>
                      <WalletIcon className="mr-2 h-4 w-4" />
                      <span>Wallet</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigateToPage("profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigateToPage("settings")}>
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
            <div className={`${
              currentState.page === "course-viewer" 
                ? "h-full" 
                : "container max-w-6xl mx-auto p-6"
            }`}>
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