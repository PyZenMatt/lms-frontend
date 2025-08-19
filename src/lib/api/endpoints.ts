import { http } from '../http'

// Example API endpoints consumed via react-query hooks.
// Expand with real backend contract as needed.
export const api = {
  me: () => http.get('/v1/profile/', { auth: true }),
  courses: (params?: { search?: string }) => {
    const qs = params?.search ? `?search=${encodeURIComponent(params.search)}` : ''
    return http.get(`/api/v1/courses${qs}`, { auth: true })
  },
}
