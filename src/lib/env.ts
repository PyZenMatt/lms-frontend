export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:8000/api'

export const USE_MSW =
  String(import.meta.env.VITE_USE_MSW || 'false') === 'true'
