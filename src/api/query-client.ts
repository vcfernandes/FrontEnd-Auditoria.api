import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Erros 4xx não melhoram tentando de novo; falhas de rede/5xx ganham uma nova tentativa.
      retry: (tentativas, erro) => {
        if (erro instanceof ApiError && erro.status >= 400 && erro.status < 500) return false
        return tentativas < 1
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})
