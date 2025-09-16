import { useQuery } from '@tanstack/react-query'
import { getEnrolledCourses } from '@/services/student'

export function useEnrolledCourses(page = 1, page_size = 100) {
  return useQuery({
    queryKey: ['enrolledCourses', page, page_size],
    queryFn: async () => {
      const res = await getEnrolledCourses(page, page_size)
      if (!res.ok) throw res.error || new Error('Failed to load enrolled')
      return res.data
    },
    staleTime: 1000 * 30,
    retry: 1,
  })
}
