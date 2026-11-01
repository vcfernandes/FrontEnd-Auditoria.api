import { Navigate, Outlet } from 'react-router'
import { useAuth } from './useAuth'

export function RotaProtegida() {
  const { sessao } = useAuth()
  return sessao ? <Outlet /> : <Navigate to="/entrar" replace />
}

/** Telas de entrada: quem já tem sessão vai direto para a página inicial. */
export function RotaPublica() {
  const { sessao } = useAuth()
  return sessao ? <Navigate to="/inicio" replace /> : <Outlet />
}
