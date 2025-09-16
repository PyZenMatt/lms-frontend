import { z } from 'zod'

export const CourseDTOSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  course_id: z.union([z.string(), z.number()]).optional(),
  course_title: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  instructor: z.string().optional(),
  instructor_name: z.string().optional(),
  instructor_avatar: z.string().optional(),
  cover_url: z.string().optional(),
  thumbnail: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  lessons_count: z.number().optional(),
  lessons: z.number().optional(),
  students_count: z.number().optional(),
  students: z.number().optional(),
  rating: z.number().optional(),
  reviews: z.number().optional(),
  price: z.union([z.string(), z.number()]).optional(),
  price_eur: z.union([z.string(), z.number()]).optional(),
  student_pay_eur: z.union([z.string(), z.number()]).optional(),
  course_price: z.union([z.string(), z.number()]).optional(),
  tokens: z.number().optional(),
  price_tokens: z.number().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  enrolled: z.boolean().optional(),
  is_enrolled: z.boolean().optional(),
  progress_percent: z.number().optional(),
  progress: z.number().optional(),
  featured: z.boolean().optional(),
})

export type CourseDTO = z.infer<typeof CourseDTOSchema>

export default CourseDTOSchema
