import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { queryClient } from '@/api/query-client'
import { AuthProvider } from '@/auth/AuthContext'
import { registrarServiceWorker } from '@/pwa/atualizacao'
import { iniciarEscutaInstalacao } from '@/pwa/instalacao'
import App from './App.tsx'
import './index.css'

registrarServiceWorker()
iniciarEscutaInstalacao()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
