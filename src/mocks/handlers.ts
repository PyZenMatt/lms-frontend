import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/v1/token/', async ({ request }) => {
    interface LoginBody { email?: string; password?: string }
    const { email, password } = (await request.json()) as LoginBody
    if (email === 'student@example.com' && password === 'password') {
      return HttpResponse.json({
        access: 'ACCESS_TOKEN_MOCK',
        refresh: 'REFRESH_TOKEN_MOCK',
      })
    }
    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 })
  }),

  http.post('/api/v1/token/refresh/', async () => {
    return HttpResponse.json({ access: 'ACCESS_TOKEN_REFRESHED' })
  }),

  http.get('/api/v1/profile/', () =>
    HttpResponse.json({
      id: 1,
      username: 'student',
      email: 'student@example.com',
      role: 'student',
    }),
  ),

  http.get('/api/v1/courses', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const list = [
      { id: 1, title: 'Disegno base', description: 'matita e linee' },
      { id: 2, title: 'Acquerello 101', description: 'tecniche di base' },
    ].filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    return HttpResponse.json(list)
  }),
]
