// src/lib/dashboard.ts
export type RoleLike = 'student' | 'teacher' | 'admin' | null | undefined | string;

export const DASHBOARD_HOME: Record<string, string> = {
  admin: '/admin',
  teacher: '/teacher',
  student: '/dashboard/student',
};

/**
 * Return the canonical dashboard/home path for a given role.
 * Defaults to '/dashboard' for unknown/anonymous roles.
 */
export function getDashboardHome(role?: RoleLike): string {
  if (!role) return '/dashboard';
  const r = String(role).toLowerCase();
  if (r === 'admin') return DASHBOARD_HOME.admin;
  if (r === 'teacher') return DASHBOARD_HOME.teacher;
  if (r === 'student') return DASHBOARD_HOME.student;
  return '/dashboard';
}

export default getDashboardHome;
