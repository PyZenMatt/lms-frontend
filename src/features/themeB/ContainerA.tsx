import React from 'react'
import ThemeBCard from '@/ui/ThemeBCard'
import { useThemeBData } from '@/hooks/useThemeB'

export const ContainerA: React.FC = () => {
  const { title, subtitle } = useThemeBData()
  return <ThemeBCard title={title + ' (A)'} subtitle={subtitle} />
}

export default ContainerA
