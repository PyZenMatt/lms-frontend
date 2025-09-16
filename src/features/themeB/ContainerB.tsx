import React from 'react'
import ThemeBCard from '@/ui/ThemeBCard'
import { useThemeBData } from '@/hooks/useThemeB'

export const ContainerB: React.FC = () => {
  const { title, subtitle } = useThemeBData()
  return <ThemeBCard title={title + ' (B)'} subtitle={subtitle} />
}

export default ContainerB
