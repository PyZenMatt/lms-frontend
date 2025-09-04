import * as React from "react";
import { Home, BookOpen, Users, Wallet, Settings, Bell, Sparkles } from "lucide-react";

export type Role = "student" | "teacher" | "admin" | "anonymous";

export type MenuItem = {
  to?: string;
  label: string;
  icon?: React.ReactNode;
  // match: 'prefix' (default) | 'exact' | RegExp
  match?: "prefix" | "exact" | RegExp;
  // badgeKey refers to a key provided by the app (e.g. 'notifications')
  badgeKey?: string;
  // optional raw badge number
  badge?: number;
};

export type MenuSection = {
  title?: string;
  items: MenuItem[];
};

export function getMenuByRole(role: Role, isAuthenticated: boolean): MenuSection[] {
  // returns sections in the order expected by the Figma design
  const sections: MenuSection[] = [];

  if (role === "teacher" || role === "admin") {
    sections.push({
      items: [
        { to: "/teacher", label: "Dashboard", icon: <Home size={20} strokeWidth={1.75} />, match: "prefix" },
        { to: "/studio/courses/new", label: "Studio Docente", icon: <Sparkles size={20} strokeWidth={1.75} />, match: "prefix" },
        { to: "/courses", label: "Corsi", icon: <BookOpen size={20} strokeWidth={1.75} />, match: "prefix" },
        { to: "/wallet", label: "Wallet", icon: <Wallet size={20} strokeWidth={1.75} />, match: "prefix" },
      ],
    });

    sections.push({
      title: "Teacher",
      items: [
        { to: "/teacher/staking", label: "Staking", icon: <Sparkles size={20} strokeWidth={1.75} />, match: "prefix" },
        { to: "/teacher/pending-discounts", label: "Pending Discounts", match: "prefix" },
      ],
    });
  } else {
    sections.push({
      items: [
        { to: "/dashboard", label: "Dashboard", icon: <Home size={20} strokeWidth={1.75} />, match: "prefix" },
        { to: "/courses", label: "Esplora Corsi", icon: <BookOpen size={20} strokeWidth={1.75} />, match: "prefix" },
        { to: "/my/courses", label: "I miei corsi", icon: <Users size={20} strokeWidth={1.75} />, match: "prefix" },
        { to: "/wallet", label: "Wallet", icon: <Wallet size={20} strokeWidth={1.75} />, match: "prefix" },
      ],
    });

    sections.push({
      title: "My work",
      items: [{ to: "/my/exercises", label: "I miei esercizi", icon: <Sparkles size={20} strokeWidth={1.75} />, match: "prefix" }],
    });
  }

  // common auth-only
  if (isAuthenticated) {
    sections.push({ items: [{ to: "/reviews/assigned", label: "Revisioni", icon: <Sparkles size={20} strokeWidth={1.75} />, badgeKey: "reviews", match: "prefix" }] });
  }

  // admin section
  if (role === "admin") {
    sections.push({ items: [{ to: "/admin", label: "Admin", icon: <Settings size={20} strokeWidth={1.75} />, match: "prefix" }] });
  }

  // final utilities
  sections.push({ items: [{ to: "/notifications", label: "Notifiche", icon: <Bell size={20} strokeWidth={1.75} />, badgeKey: "notifications", match: "prefix" }] });

  return sections;
}
