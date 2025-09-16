import React from 'react'

export type ThemeBCardProps = {
  title: string
  subtitle?: string
}

export const ThemeBCard: React.FC<ThemeBCardProps> = ({ title, subtitle }) => (
  <div className="p-4 border rounded-md shadow-sm">
    <h4 className="font-semibold">{title}</h4>
    {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
  </div>
)

export default ThemeBCard
