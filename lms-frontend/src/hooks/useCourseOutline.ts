// src/hooks/useCourseOutline.ts
import { useQuery } from '@tanstack/react-query'
import { getCourseOutline } from '@/services/courses'
import type { CourseOutlinePayload } from '@/services/courses'

export function useCourseOutline(courseId: number | string | undefined) {
  const id = typeof courseId === 'string' ? Number(courseId) : courseId
  const safeKey = ['courseOutline', id ?? ''] as const

  return useQuery({
    queryKey: safeKey,
    queryFn: async () => {
      if (!id) return null as unknown as CourseOutlinePayload
      const res = await getCourseOutline(Number(id))
      if (!res.ok) throw res.error || new Error('Failed to load')
      return res.data as CourseOutlinePayload
    },
    enabled: !!id,
    staleTime: 1000 * 10, // 10s
    retry: 1,
  })
}
