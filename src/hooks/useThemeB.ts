import { useState, useEffect } from 'react'

export function useThemeBData() {
  const [title, setTitle] = useState('Theme B Preview')
  const [subtitle, setSubtitle] = useState('Shared hook data')

  useEffect(() => {
    // mimic async setup
    const t = setTimeout(() => {
      setTitle('Theme B Preview (ready)')
    }, 10)
    return () => clearTimeout(t)
  }, [])

  return { title, subtitle }
}

export default useThemeBData
