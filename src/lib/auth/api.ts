import { http } from '../http'
import { tokenStore } from '../tokenStore'

export type LoginPayload = { email: string; password: string }
export type TokenPair = { access: string; refresh?: string }

export async function login(payload: LoginPayload): Promise<void> {
  const data = await http.post<TokenPair>('/v1/token/', payload, {
    auth: false,
  })
  if (!data?.access) throw new Error('Invalid login response')
  tokenStore.set({
    access: data.access,
    refresh: data.refresh ?? tokenStore.refresh(),
  })
}

export async function logout(): Promise<void> {
  tokenStore.clear()
  // se vuoi invalidare lato server: await http.post("/v1/logout/", {}, { auth: true }).catch(() => {});
}

export function isAuthenticated(): boolean {
  return Boolean(tokenStore.access())
}
