import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() =>
    document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {
      // ignore storage errors (e.g., in private mode)
    }
  }, [dark])

  return (
    <button
      type="button"
      className="btn btn-outline"
      onClick={() => setDark((d) => !d)}
      aria-pressed={dark}
      title={dark ? 'Passa a Light' : 'Passa a Dark'}
    >
      {dark ? 'Light' : 'Dark'}
    </button>
  )
}
