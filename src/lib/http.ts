import { API_BASE_URL } from './env'
import { tokenStore } from './tokenStore'

export class AuthError extends Error {
  constructor(msg = 'Unauthorized') {
    super(msg)
  }
}

type HttpOpts = RequestInit & {
  auth?: boolean // se true → aggiunge Bearer e gestisce il refresh
  skipRefreshRetry?: boolean // evita loop su /v1/token/refresh
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

async function doFetch<T>(url: string, opts: HttpOpts = {}): Promise<T> {
  const headers = new Headers(opts.headers || {})
  if (!headers.has('Content-Type') && !(opts.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (opts.auth) {
    const at = tokenStore.access()
    if (at) headers.set('Authorization', `Bearer ${at}`)
  }

  const res = await fetch(url, {
    ...opts,
    headers,
    credentials: 'include' /*safe for cookie*/,
  })

  if (res.status === 401 && opts.auth) {
    if (opts.skipRefreshRetry) throw new AuthError()
    const refreshed = await tryRefresh()
    if (!refreshed) throw new AuthError()
    // retry una volta
    return doFetch<T>(url, { ...opts, skipRefreshRetry: true })
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

async function tryRefresh(): Promise<boolean> {
  const rt = tokenStore.refresh()
  if (!rt) return false
  try {
    const data = await fetch(`${API_BASE_URL}/v1/token/refresh/`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ refresh: rt }),
      credentials: 'include',
    }).then((r) => (r.ok ? r.json() : Promise.reject(r)))
    // SimpleJWT tipico: { access: "..." }
    if (data?.access) {
      tokenStore.set({ access: data.access, refresh: rt })
      return true
    }
  } catch {
    /* noop */
  }
  tokenStore.clear()
  return false
}

export const http = {
  get: <T>(p: string, opts?: HttpOpts) =>
    doFetch<T>(`${API_BASE_URL}${p}`, { ...opts, method: 'GET' }),
  post: <T>(p: string, body?: unknown, opts?: HttpOpts) =>
    doFetch<T>(`${API_BASE_URL}${p}`, {
      ...opts,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(p: string, body?: unknown, opts?: HttpOpts) =>
    doFetch<T>(`${API_BASE_URL}${p}`, {
      ...opts,
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  patch: <T>(p: string, body?: unknown, opts?: HttpOpts) =>
    doFetch<T>(`${API_BASE_URL}${p}`, {
      ...opts,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  del: <T>(p: string, opts?: HttpOpts) =>
    doFetch<T>(`${API_BASE_URL}${p}`, { ...opts, method: 'DELETE' }),
}
