import * as React from "react"
import { Home, BookOpen, Users, Trophy, Palette, MessageCircle, User, UserCheck, GraduationCap, Wallet, Bell } from "lucide-react"
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
import useDashboardStats from "@/hooks/useDashboardStats";
import { getUserFromToken } from "@/lib/auth"
import { getUnreadCount, getTeacherChoicesPendingCount } from "@/services/notifications";

interface AppSidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export function AppSidebar({ currentPage, onPageChange }: AppSidebarProps) {
  const { user } = useAuth()
  const isTeacherRole = user?.role === 'teacher';
  const { stats, loading } = useDashboardStats();

  // Display safe username: prefer name, fall back to email or id, truncate for UI, keep full value in tooltip
  const tokenUser = getUserFromToken();
  const tokenFallback = tokenUser ? (tokenUser.username ?? ((tokenUser.first_name || tokenUser.last_name) ? `${tokenUser.first_name ?? ""} ${tokenUser.last_name ?? ""}`.trim() : tokenUser.email)) : undefined;
  const displayName = tokenFallback && tokenFallback.length > 20 ? tokenFallback.slice(0, 20) + "…" : tokenFallback ?? "";
  const emailDisplay = user?.email ?? tokenUser?.email ?? "";

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
    { title: "Peer Review", page: "peer-review", icon: UserCheck },
    { title: "Community", page: "community", icon: Users },
    { title: "Analytics", page: "analytics", icon: Trophy },
  ]

  const menuItems = isTeacherRole ? teacherMenuItems : studentMenuItems

  function UnreadBadge() {
    const [count, setCount] = React.useState<number | null>(null)
    React.useEffect(() => {
      let mounted = true

      async function fetchCount() {
        try {
          const c = await getUnreadCount()
          if (mounted) setCount(c)
        } catch {
          if (mounted) setCount(null)
        }
      }

      fetchCount()

      const onUpdated = () => { fetchCount() }
      window.addEventListener("notifications:updated", onUpdated as EventListener)
      return () => { mounted = false; window.removeEventListener("notifications:updated", onUpdated as EventListener) }
    }, [])

    if (!count || count <= 0) return null
    return <Badge variant="secondary" className="ml-auto bg-primary text-primary-foreground">{count}</Badge>
  }

  function OpportunityBadge() {
    const [count, setCount] = React.useState<number | null>(null)
    React.useEffect(() => {
      let mounted = true

      async function fetchCount() {
        if (!isTeacherRole) return
        try {
          const c = await getTeacherChoicesPendingCount()
          if (mounted) setCount(c)
        } catch {
          if (mounted) setCount(null)
        }
      }

      fetchCount()

      const onUpdated = () => { fetchCount() }
      window.addEventListener("notifications:updated", onUpdated as EventListener)
      return () => { mounted = false; window.removeEventListener("notifications:updated", onUpdated as EventListener) }
    }, [isTeacherRole])

    if (!count || count <= 0) return null
    return <Badge variant="secondary" className="ml-auto bg-yellow-100 text-yellow-800">{count}</Badge>
  }

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
              {isTeacherRole ? "Teacher Studio" : "Community Studio"}
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
                      (item.page === "teacher-dashboard" && currentPage === "dashboard" && isTeacherRole) ||
                      (item.page === "dashboard" && currentPage === "dashboard" && !isTeacherRole)
                    }
                  >
                    <button 
                      onClick={() => onPageChange(item.page)}
                      className="w-full flex items-center gap-2"
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      {item.title === "Peer Review" && !isTeacherRole && (
                        <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-800">
                          {loading ? '…' : (stats?.pendingReviews ?? 0)}
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
            <SidebarMenuButton
              onClick={() => onPageChange("notifications")}
            >
              <Bell className="size-4" />
              <span>Notifiche</span>
              <UnreadBadge />
            </SidebarMenuButton>
          </SidebarMenuItem>

          {isTeacherRole && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onPageChange("teacher-opportunities")}
              >
                <Trophy className="size-4" />
                <span>Opportunity</span>
                <OpportunityBadge />
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

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
            <SidebarMenuButton
              onClick={() => onPageChange("profile")}
              tooltip={tokenFallback}
            >
              <User className="size-4" />
              <span className="ml-2 overflow-hidden">
                <span className="text-sm font-medium leading-none truncate max-w-[9rem] block" title={tokenFallback}>
                  {user?.name ?? displayName}
                </span>
                <span className="text-xs leading-none text-muted-foreground truncate max-w-[9rem] block">
                  {emailDisplay}
                </span>
              </span>
              <Badge variant="outline" className="ml-auto capitalize text-xs">
                {user?.role}
              </Badge>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Theme toggle moved to top nav */}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}