import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { aoMudarSessao, lerSessao, limparSessao, salvarSessao } from './session'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [sessao, setSessao] = useState(lerSessao)

  // Acompanha login, logout e o 401 tratado no cliente HTTP.
  useEffect(
    () =>
      aoMudarSessao(() => {
        const atual = lerSessao()
        setSessao(atual)
        // Sem sessão, nada do usuário anterior pode ficar no cache.
        if (!atual) queryClient.clear()
      }),
    [queryClient],
  )

  return <AuthContext value={{ sessao, entrar: salvarSessao, sair: limparSessao }}>{children}</AuthContext>
}
