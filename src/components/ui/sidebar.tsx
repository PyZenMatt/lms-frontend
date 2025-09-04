import * as React from "react";
import { /* NavLink */ } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "./useFocusTrap";
import type { MenuSection as MenuSectionType } from "@/components/ui/getMenuByRole";
import { AppSidebar } from "@/components/figma/AppSidebar";
import { SidebarProvider } from "@/components/figma/ui/sidebar";
import { useNavigate } from "react-router-dom";

/**
 * Sidebar semplice, desktop-first, con supporto "collapsed".
 * Usa i token --color-sidebar* definiti in globals.css.
 */

export type SidebarItem = {
  to?: string; // if absent, item may be an action (onClick)
  label: React.ReactNode;
  icon?: React.ReactNode;
  end?: boolean;
  onClick?: () => void;
  // when true, the icon will be hidden when the sidebar is collapsed
  hideIconWhenCollapsed?: boolean;
};

export type MenuItem = {
  to?: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: number;
};

export type MenuSection = {
  title?: string;
  items: MenuItem[];
};

// Figma parity constants (adjustable)
// Figma source: src/components/figma/ui/sidebar.tsx
// 16rem -> 16 * 16 = 256px (expanded)
// 3rem  -> 3 * 16  = 48px  (icon / collapsed)
// 18rem -> 18 * 16 = 288px (mobile sheet)
const SIDEBAR_WIDTH_EXPANDED = 256; // px (Figma: 16rem)
const SIDEBAR_WIDTH_COLLAPSED = 48; // px (Figma: 3rem)
const SIDEBAR_WIDTH_MOBILE = 288; // px (Figma: 18rem)
// kept minimal constants for layout
// no local spacing constants needed when delegating to AppSidebar

export function Sidebar(props: {
  sections?: MenuSectionType[];
  footer?: React.ReactNode;
  collapsed?: boolean;
  onToggle?: (v: boolean) => void;
  className?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  counts?: Record<string, number>;
}) {
  const { collapsed, className, mobileOpen, onMobileClose } = props;
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const drawerRef = React.useRef<HTMLDivElement | null>(null);

  // apply focus trap when mobile drawer is open (hook accepts null to disable)
  useFocusTrap(mobileOpen ? drawerRef.current : null, { onClose: () => onMobileClose?.() });

  // matchIsActive is no longer needed because menu is rendered by AppSidebar (figma)

  // compute width for the inner visual sidebar. Outer <aside> reserves the expanded width
  // on desktop to avoid layout-shift when collapsing; mobile drawer still uses computedWidth.
  const innerWidth = mobileOpen
    ? SIDEBAR_WIDTH_MOBILE
    : collapsed
    ? SIDEBAR_WIDTH_COLLAPSED
    : SIDEBAR_WIDTH_EXPANDED;

  // role heuristics are handled by the mounted AppSidebar (figma source)

  const navigate = useNavigate();
  const currentPage = window.location.pathname.split("/").filter(Boolean)[0] || "dashboard";
  const onPageChange = (page: string) => {
    // navigate to the page route; preserve mobile drawer close
    navigate("/" + page);
    if (mobileOpen) onMobileClose?.();
  };

  return (
    <>
      {/* Mobile overlay: covers the page when the drawer is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => onMobileClose?.()}
          aria-hidden="true"
        />
      )}

  <aside
        // desktop: md:flex; mobile: fixed drawer when mobileOpen
        className={cn(
          // base styles
            "h-screen border-r border-[--color-sidebar-border] bg-[--color-sidebar] text-[--color-sidebar-foreground]",
          // desktop layout: hidden on small, flex column on md+
          "hidden md:flex md:flex-col",
          // animate width when collapsing/expanding
          "transition-[width] duration-200 ease-in-out",
    // NOTE: outer aside reserves the expanded width on desktop to prevent main reflow.
    // The inner container animates between collapsed/expanded visually.
    // mobile drawer visible when mobileOpen (kept separate from md rules)
  mobileOpen && "fixed left-0 top-0 z-50 md:hidden translate-x-0",
    className
        )}
        id="site-sidebar"
        ref={drawerRef}
    // reserve expanded width on desktop (prevents layout shift)
    style={{ width: `${mobileOpen ? innerWidth : SIDEBAR_WIDTH_EXPANDED}px` }}
  data-state={collapsed ? "collapsed" : "expanded"}
  role={mobileOpen ? "dialog" : "navigation"}
  aria-label="Primary"
  aria-modal={mobileOpen ? true : undefined}
      >
      {/* Mobile close overlay button (visually hidden, used to receive initial focus) */}
      {mobileOpen && (
        <button
          ref={closeButtonRef}
          className="md:hidden absolute left-full top-0 h-full w-8 bg-transparent"
          onClick={() => onMobileClose?.()}
          aria-label="Close sidebar"
        />
      )}

      {/* Mount the Figma AppSidebar inside the real aside to get exact UI */}
      {/* inner visual rail: animates width to collapsed/expanded while outer aside reserves space */}
      <div
        className="flex-1 overflow-y-auto p-0"
  style={{ width: `${innerWidth}px`, transition: "width 200ms ease-in-out", maxWidth: mobileOpen ? '100vw' : undefined }}
      >
        <SidebarProvider open={!collapsed}>
          <AppSidebar currentPage={currentPage} onPageChange={onPageChange} />
        </SidebarProvider>
      </div>
  </aside>
  </>
  );
}
