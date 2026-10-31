import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { useLogin } from '@/api/auth'
import { CampoTexto } from '@/components/CampoTexto'
import { LayoutEntrada } from '@/components/LayoutEntrada'
import { Button } from '@/components/ui/button'
import { aplicarErroApi } from '@/lib/erros'

const esquema = z.object({
  email: z.email('Informe um e-mail válido'),
  senha: z.string().min(1, 'Informe a senha'),
})
type Dados = z.infer<typeof esquema>

export function EntrarPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Dados>({ resolver: zodResolver(esquema) })

  const enviar = handleSubmit((dados) => {
    setErroGeral(null)
    login.mutate(dados, {
      onSuccess: () => navigate('/', { replace: true }),
      onError: (erro) => setErroGeral(aplicarErroApi(erro, setError, ['email', 'senha'])),
    })
  })

  return (
    <LayoutEntrada titulo="Entrar">
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <CampoTexto
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          erro={errors.email?.message}
          {...register('email')}
        />
        <CampoTexto
          rotulo="Senha"
          type="password"
          autoComplete="current-password"
          erro={errors.senha?.message}
          {...register('senha')}
        />
        {erroGeral && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {erroGeral}
          </p>
        )}
        <Button type="submit" size="lg" className="h-12 text-base" disabled={login.isPending}>
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link to="/criar-conta" className="font-medium text-foreground underline underline-offset-4">
          Criar conta
        </Link>
      </p>
    </LayoutEntrada>
  )
}
