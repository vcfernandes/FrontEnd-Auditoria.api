import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { api, type Schemas } from './client'

export function useMe() {
  const { sessao } = useAuth()
  return useQuery({
    queryKey: ['auth', 'me', sessao?.usuario.id],
    queryFn: ({ signal }) => api.get<Schemas['UsuarioResponse']>('/auth/me', { signal }),
    enabled: !!sessao,
  })
}

export function useLogin() {
  const { entrar } = useAuth()
  return useMutation({
    mutationFn: (dados: Schemas['LoginRequest']) => api.post<Schemas['AuthResponse']>('/auth/login', dados),
    onSuccess: entrar,
  })
}

export function useRegistrar() {
  const { entrar } = useAuth()
  return useMutation({
    mutationFn: (dados: Schemas['RegistrarRequest']) =>
      api.post<Schemas['AuthResponse']>('/auth/registrar', dados),
    onSuccess: entrar,
  })
}
