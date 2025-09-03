import React from "react"
export default function PageSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="container py-4">
      <div className="grid gap-4">{children}</div>
    </section>
  )
}
