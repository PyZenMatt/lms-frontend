// src/components/BuyCourseButton.tsx
import React from "react"
import { useNavigate } from "react-router-dom"

type Props = {
  courseId: number | string
  className?: string
  children?: React.ReactNode
  /** Path di destinazione custom (opzionale). Default: /courses/:id/checkout */
  to?: string
  /** Se true blocca gli eventi (utile dentro card/link wrapper). Default: true */
  stopPropagation?: boolean
}

export default function BuyCourseButton({
  courseId,
  className,
  children,
  to,
  stopPropagation = true,
}: Props) {
  const navigate = useNavigate()
  const target = to || `/courses/${courseId}/checkout`

  const stop = (e: React.SyntheticEvent) => {
    if (!stopPropagation) return;
    e.stopPropagation();
    const anyE = e as unknown as { preventDefault?: () => void };
    if (typeof anyE.preventDefault === "function") anyE.preventDefault();
  };

  const onClick = (e: React.MouseEvent) => {
    stop(e)
    // Debug: verifica click e destinazione
    console.log('[BuyCourseButton] click, target:', target)
    navigate(target)
  }

  return (
    <button
      type="button"
      onClickCapture={stop}
      onClick={onClick}
      className={
        className ||
        "inline-flex items-center rounded-xl px-4 py-2 border bg-black text-white hover:opacity-90"
      }
      data-testid={`buy-course-${courseId}`}
      aria-label="Acquista corso"
    >
      {children || "Compra"}
    </button>
  )
}
