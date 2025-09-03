import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('theme')
      if (stored) return stored === 'dark'
    } catch {
      /* ignore */
    }
    return (
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark')
    )
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [dark])

  return (
    <button
      className="btn btn-outline"
      onClick={() => setDark((d) => !d)}
      aria-pressed={dark}
    >
      {dark ? 'Light' : 'Dark'}
    </button>
  )
}
