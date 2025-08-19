type Tokens = { access: string; refresh?: string | null }

const mem: Tokens = { access: '', refresh: null }

const LS_KEY = 'auth_tokens' // opzionale: commenta per non usare LS

export const tokenStore = {
  load() {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const t = JSON.parse(raw) as Tokens
        mem.access = t.access || ''
        mem.refresh = t.refresh || null
      }
    } catch {
      /* noop */
    }
  },
  save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(mem))
    } catch {
      /* noop */
    }
  },
  set(t: Tokens) {
    mem.access = t.access
    mem.refresh = t.refresh ?? null
    tokenStore.save()
  },
  clear() {
    mem.access = ''
    mem.refresh = null
    try {
      localStorage.removeItem(LS_KEY)
    } catch {
      /* noop */
    }
  },
  access() {
    return mem.access
  },
  refresh() {
    return mem.refresh
  },
}
