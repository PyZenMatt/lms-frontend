import './styles/globals.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { tokenStore } from './lib/tokenStore'
import { USE_MSW } from './lib/env'

if (import.meta.env.DEV && USE_MSW) {
  ;(async () => {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  })()
}

tokenStore.load()
const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
