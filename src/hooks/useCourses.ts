import { useQuery } from '@tanstack/react-query'
import { listCourses as svcListCourses } from '@/services/courses'

export function useCourses(params: { page?: number; page_size?: number; search?: string; category?: string } = {}) {
  return useQuery({
    queryKey: ['courses', params.page ?? 1, params.page_size ?? 20, params.search ?? '', params.category ?? ''],
    queryFn: async () => {
      const res = await svcListCourses({ page: params.page ?? 1, page_size: params.page_size ?? 20, search: params.search, category: params.category })
      if (!res.ok) throw res.error || new Error('Failed to load courses')
      return res.data
    },
    staleTime: 1000 * 10,
    retry: 1,
  })
}
