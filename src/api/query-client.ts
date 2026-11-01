import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './client'

export const queryClient = new QueryClient({
  defaultOptions: {
    // Sem internet, tenta mesmo assim e falha na hora com a mensagem clara do cliente HTTP.
    // O padrão ("online") deixaria telas em carregamento e botões "Entrando…" para sempre.
    mutations: { networkMode: 'always' },
    queries: {
      networkMode: 'always',
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
