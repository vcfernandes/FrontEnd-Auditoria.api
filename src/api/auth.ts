import { useMutation, useQuery } from '@tanstack/react-query'
import { api, type Schemas } from './client'

export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: ({ signal }) => api.get<Schemas['UsuarioResponse']>('/auth/me', { signal }),
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: (dados: Schemas['LoginRequest']) => api.post<Schemas['AuthResponse']>('/auth/login', dados),
  })
}
