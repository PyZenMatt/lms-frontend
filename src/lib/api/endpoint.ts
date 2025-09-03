import { http } from '../http'

export type UserProfile = {
  id: number
  username: string
  email: string
  role?: 'student' | 'teacher' | 'admin'
  first_name?: string
  last_name?: string
  wallet_address?: string | null
}

export type Course = {
  id: number
  title: string
  description: string
  price?: string
  category?: string
}

export const api = {
  me: () => http.get<UserProfile>('/v1/profile/', { auth: true }),
  courses: (
    params?: Partial<{
      teacher: string
      price_eur: string
      category: string
      search: string
      ordering: string
    }>,
  ) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return http.get<Course[]>(`/v1/courses/${qs ? `?${qs}` : ''}`, {
      auth: true,
    })
  },
}
