// src/types/course.ts

export type Course = {
  id: number | string;
  title: string;
  description?: string;
  cover_image?: string | null;
  price?: number | null;
  currency?: string | null;
  progress_percent?: number | null; // per studente
  students_count?: number | null;   // per docente
  lessons_count?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type DrfPaginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
