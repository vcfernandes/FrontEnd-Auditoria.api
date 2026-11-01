import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { useRegistrar } from '@/api/auth'
import { CampoTexto } from '@/components/CampoTexto'
import { LayoutEntrada } from '@/components/LayoutEntrada'
import { Button } from '@/components/ui/button'
import { aplicarErroApi } from '@/lib/erros'

const esquema = z
  .object({
    nomeOrganizacao: z.string().trim().min(1, 'Informe o nome da organização').max(150, 'Máximo de 150 caracteres'),
    nome: z.string().trim().min(1, 'Informe seu nome').max(150, 'Máximo de 150 caracteres'),
    email: z.email('Informe um e-mail válido').max(255, 'Máximo de 255 caracteres'),
    senha: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres').max(72, 'Máximo de 72 caracteres'),
    confirmarSenha: z.string().min(1, 'Confirme a senha'),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    path: ['confirmarSenha'],
    message: 'As senhas não conferem',
  })
type Dados = z.infer<typeof esquema>

export function CriarContaPage() {
  const navigate = useNavigate()
  const registrar = useRegistrar()
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Dados>({ resolver: zodResolver(esquema) })

  const enviar = handleSubmit(({ nomeOrganizacao, nome, email, senha }) => {
    setErroGeral(null)
    registrar.mutate(
      { nomeOrganizacao, nome, email, senha },
      {
        onSuccess: () => navigate('/inicio', { replace: true }),
        onError: (erro) =>
          setErroGeral(aplicarErroApi(erro, setError, ['nomeOrganizacao', 'nome', 'email', 'senha'])),
      },
    )
  })

  return (
    <LayoutEntrada titulo="Criar conta">
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <CampoTexto
          rotulo="Nome da organização"
          autoComplete="organization"
          erro={errors.nomeOrganizacao?.message}
          {...register('nomeOrganizacao')}
        />
        <CampoTexto rotulo="Seu nome" autoComplete="name" erro={errors.nome?.message} {...register('nome')} />
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
          autoComplete="new-password"
          erro={errors.senha?.message}
          {...register('senha')}
        />
        <CampoTexto
          rotulo="Confirmar senha"
          type="password"
          autoComplete="new-password"
          erro={errors.confirmarSenha?.message}
          {...register('confirmarSenha')}
        />
        {erroGeral && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {erroGeral}
          </p>
        )}
        <Button type="submit" size="lg" className="h-12 text-base" disabled={registrar.isPending}>
          {registrar.isPending ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link to="/entrar" className="font-medium text-primary underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </LayoutEntrada>
  )
}
