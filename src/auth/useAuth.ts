import { createContext, useContext } from 'react'
import type { salvarSessao, Sessao } from './session'

export interface AuthContextValue {
  sessao: Sessao | null
  entrar: typeof salvarSessao
  sair: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return contexto
}
