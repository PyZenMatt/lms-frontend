import React, { useState } from 'react'

// ImageWithFallback: renders an <img /> when available. When missing or errored
// it will render a simple placeholder DIV for regular images (cards/thumbnails),
// but return null for avatar-like images to avoid extra markup in tight avatar
// slots. Avatar detection is heuristic (checks for `rounded-full` in className).

type Props = React.ImgHTMLAttributes<HTMLImageElement> & { showPlaceholder?: boolean }

export function ImageWithFallback(props: Props) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, showPlaceholder = true, ...rest } = props

  // treat empty / missing src as an error so fallback is shown
  const hasSrc = !!src && String(src).trim() !== ""
  const showFallback = didError || !hasSrc

  // Heuristic: if the caller passed a rounded avatar class, don't render any
  // placeholder element (the UI often expects compact avatar slots).
  const isAvatar = typeof className === 'string' && className.includes('rounded-full')

  if (showFallback) {
    if (!showPlaceholder) return null
    if (isAvatar) return null

  // Render a minimal rectangular placeholder. Always include a neutral
  // background so the placeholder is visible even when callers pass only
  // sizing classes (e.g. "w-full h-48"). Callers can still override
  // sizing via `className`.
  const sizingClass = className ?? 'w-full h-48'
  // add a faint border so the placeholder is visible against various
  // backgrounds (helps when the app background and placeholder are similar)
  const placeholderClass = `${sizingClass} bg-gray-100 border border-gray-200 rounded-md`
  return <div className={placeholderClass} style={style} aria-hidden />
  }

  return <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
}
