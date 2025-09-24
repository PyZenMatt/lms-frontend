import * as React from "react"
import { Home, BookOpen, User, Bell } from "lucide-react"
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
// useDashboardStats removed for simplified sidebar
import { getUserFromToken } from "@/lib/auth"
import { getUnreadCount } from "@/services/notifications";

interface AppSidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export function AppSidebar({ currentPage, onPageChange }: AppSidebarProps) {
  const { user } = useAuth()
  // teacher role is intentionally not used; teacher dashboard is disabled
  const isTeacherRole = false;
  // dashboard stats not needed for the simplified student sidebar

  // Display safe username: prefer name, fall back to email or id, truncate for UI, keep full value in tooltip
  const tokenUser = getUserFromToken();
  const tokenFallback = tokenUser ? (tokenUser.username ?? ((tokenUser.first_name || tokenUser.last_name) ? `${tokenUser.first_name ?? ""} ${tokenUser.last_name ?? ""}`.trim() : tokenUser.email)) : undefined;
  const displayName = tokenFallback && tokenFallback.length > 20 ? tokenFallback.slice(0, 20) + "…" : tokenFallback ?? "";
  const emailDisplay = user?.email ?? tokenUser?.email ?? "";

  const studentMenuItems = [
    { title: "Dashboard", page: "dashboard", icon: Home },
    // For admins we'll replace this item with Approve courses elsewhere; keep default for regular students
    { title: "Learning Paths", page: "courses", icon: BookOpen },
  ]

  const menuItems = studentMenuItems

  // If user is admin, replace Learning Paths with Approve courses
  // runtime-safe admin check without 'any'
  const tokenRole = (user as Record<string, unknown> | undefined)?.role
  if (typeof tokenRole === 'string' && tokenRole.toLowerCase() === 'admin') {
    const idx = menuItems.findIndex((i) => i.title === 'Learning Paths')
    if (idx !== -1) {
      // mutate a copy to avoid changing constants
      menuItems[idx] = { title: 'Approve courses', page: 'approve-courses', icon: BookOpen }
    }
  }

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

  // Opportunity badge removed (teacher features disabled)

  return (
    <Sidebar>
          <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div>
            <h2 className="font-medium">OpenPython</h2>
            <p className="text-xs text-muted-foreground">Community Studio</p>
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
                <SidebarMenuButton>
                  <Bell className="size-4" />
                  <span>Notifiche</span>
                  <UnreadBadge />
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onPageChange("profile")} tooltip={tokenFallback}>
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
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
  )
}