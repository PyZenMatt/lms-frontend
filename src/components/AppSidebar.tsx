import { Home, BookOpen, Users, Trophy, Palette, MessageCircle, User, UserCheck, GraduationCap, Wallet } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "./ui/sidebar"
import { Badge } from "./ui/badge"
import { useAuth } from "./AuthContext"

interface AppSidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export function AppSidebar({ currentPage, onPageChange }: AppSidebarProps) {
  const { user, isTeacher } = useAuth()

  const studentMenuItems = [
    { title: "Dashboard", page: "dashboard", icon: Home },
    { title: "Learning Paths", page: "courses", icon: BookOpen },
    { title: "Peer Review", page: "peer-review", icon: UserCheck },
    { title: "Community", page: "community", icon: Users },
    { title: "Gallery", page: "gallery", icon: Palette },
    { title: "Discussions", page: "discussions", icon: MessageCircle },
    { title: "Achievements", page: "achievements", icon: Trophy },
  ]

  const teacherMenuItems = [
    { title: "Dashboard", page: "teacher-dashboard", icon: GraduationCap },
    { title: "My Courses", page: "courses", icon: BookOpen },
    { title: "Students", page: "students", icon: Users },
    { title: "Community", page: "community", icon: Users },
    { title: "Analytics", page: "analytics", icon: Trophy },
  ]

  const menuItems = isTeacher ? teacherMenuItems : studentMenuItems

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="size-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Palette className="size-4 text-white" />
          </div>
          <div>
            <h2 className="font-medium">ArtLearn</h2>
            <p className="text-xs text-muted-foreground">
              {isTeacher ? "Teacher Studio" : "Community Studio"}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={
                      currentPage === item.page || 
                      (item.page === "teacher-dashboard" && currentPage === "dashboard" && isTeacher) ||
                      (item.page === "dashboard" && currentPage === "dashboard" && !isTeacher)
                    }
                  >
                    <button 
                      onClick={() => onPageChange(item.page)}
                      className="w-full flex items-center gap-2"
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      {item.title === "Peer Review" && !isTeacher && (
                        <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-800">
                          3
                        </Badge>
                      )}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onPageChange("wallet")}>
              <Wallet className="size-4" />
              <span>Wallet</span>
              <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-800">
                {user?.tokens || 0} ✨
              </Badge>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <User className="size-4" />
              <span>{user?.name}</span>
              <Badge variant="outline" className="ml-auto capitalize text-xs">
                {user?.role}
              </Badge>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}