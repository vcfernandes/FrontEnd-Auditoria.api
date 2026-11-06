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

/** O cadastro não devolve token: a pessoa precisa confirmar o e-mail antes de entrar. */
export function useRegistrar() {
  return useMutation({
    mutationFn: (dados: Schemas['RegistrarRequest']) =>
      api.post<Schemas['RegistroResponse']>('/auth/registrar', dados),
  })
}

/** Reenvia o e-mail de confirmação. A API responde 204 para qualquer e-mail (não revela se a conta existe). */
export function useReenviarVerificacao() {
  return useMutation({
    mutationFn: (email: string) => api.post('/auth/reenviar-verificacao', { email } satisfies Schemas['EmailRequest']),
  })
}

export function useVerificarEmail() {
  return useMutation({
    mutationFn: (token: string) => api.post('/auth/verificar-email', { token } satisfies Schemas['VerificarEmailRequest']),
  })
}

/** Pede o link de nova senha. A API responde 204 para qualquer e-mail. */
export function useEsqueciSenha() {
  return useMutation({
    mutationFn: (email: string) => api.post('/auth/esqueci-senha', { email } satisfies Schemas['EmailRequest']),
  })
}

export function useRedefinirSenha() {
  return useMutation({
    mutationFn: (dados: Schemas['RedefinirSenhaRequest']) => api.post('/auth/redefinir-senha', dados),
  })
}
