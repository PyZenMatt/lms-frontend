import React from 'react'
import ContainerA from './ContainerA'
import ContainerB from './ContainerB'

export const PreviewPage: React.FC = () => {
  return (
    <div className="p-6 space-y-4">
      <h2>Theme B Preview</h2>
      <div className="grid grid-cols-2 gap-4">
        <ContainerA />
        <ContainerB />
      </div>
    </div>
  )
}

export default PreviewPage
