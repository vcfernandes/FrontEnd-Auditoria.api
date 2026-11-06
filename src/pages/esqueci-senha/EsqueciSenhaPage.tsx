import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { useEsqueciSenha } from '@/api/auth'
import { ApiError } from '@/api/client'
import { CampoTexto } from '@/components/CampoTexto'
import { IconeQuadrado } from '@/components/IconeQuadrado'
import { LayoutEntrada } from '@/components/LayoutEntrada'
import { Button } from '@/components/ui/button'

const esquema = z.object({ email: z.email('Informe um e-mail válido') })
type Dados = z.infer<typeof esquema>

/** Pede o link de nova senha. A resposta é a mesma para qualquer e-mail, então a mensagem também é. */
export function EsqueciSenhaPage() {
  const esqueci = useEsqueciSenha()
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Dados>({ resolver: zodResolver(esquema) })

  const enviar = handleSubmit(({ email }) => {
    setErroGeral(null)
    esqueci.mutate(email.trim(), {
      onError: (erro) => setErroGeral(erro instanceof ApiError ? erro.message : 'Algo deu errado. Tente novamente.'),
    })
  })

  if (esqueci.isSuccess) {
    return (
      <LayoutEntrada titulo="Confira seu e-mail">
        <div className="flex flex-col gap-4">
          <IconeQuadrado icone={MailCheck} tom="sucesso" className="size-14 rounded-xl [&>svg]:size-7" />
          <p>Se houver uma conta com este e-mail, enviamos um link para criar uma nova senha. O link vale por 1 hora.</p>
          <p className="text-sm text-muted-foreground">Não chegou? Veja a caixa de spam.</p>
          <Button asChild size="lg" className="h-12 text-base">
            <Link to="/entrar">Voltar para Entrar</Link>
          </Button>
        </div>
      </LayoutEntrada>
    )
  }

  return (
    <LayoutEntrada titulo="Esqueci minha senha">
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.
        </p>
        <CampoTexto
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          erro={errors.email?.message}
          {...register('email')}
        />
        {erroGeral && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {erroGeral}
          </p>
        )}
        <Button type="submit" size="lg" className="h-12 text-base" disabled={esqueci.isPending}>
          {esqueci.isPending ? 'Enviando…' : 'Enviar link'}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Lembrou a senha?{' '}
        <Link to="/entrar" className="font-medium text-primary underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </LayoutEntrada>
  )
}
