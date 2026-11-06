import { CircleCheck, Loader2, TriangleAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useVerificarEmail } from '@/api/auth'
import { ApiError } from '@/api/client'
import { IconeQuadrado } from '@/components/IconeQuadrado'
import { LayoutEntrada } from '@/components/LayoutEntrada'
import { ReenviarVerificacao } from '@/components/ReenviarVerificacao'
import { Button } from '@/components/ui/button'
import { useTokenDaUrl } from '@/lib/tokenDaUrl'

/** Link do e-mail de confirmação: `/verificar-email?token=...`. O token é de uso único. */
export function VerificarEmailPage() {
  const token = useTokenDaUrl()
  const { mutate, isSuccess, isError, error } = useVerificarEmail()
  // O link só funciona uma vez: sem esta trava, o modo de desenvolvimento (que roda o efeito duas vezes) gastaria o token.
  const disparou = useRef(false)

  useEffect(() => {
    if (token && !disparou.current) {
      disparou.current = true
      mutate(token)
    }
  }, [token, mutate])

  const linkInvalido = !token || (error instanceof ApiError && error.codigo === 'LINK_INVALIDO')

  if (isSuccess) {
    return (
      <LayoutEntrada titulo="E-mail confirmado">
        <div className="flex flex-col gap-4">
          <IconeQuadrado icone={CircleCheck} tom="sucesso" className="size-14 rounded-xl [&>svg]:size-7" />
          <p>Pronto! Seu e-mail foi confirmado e sua conta já pode ser usada.</p>
          <Button asChild size="lg" className="h-12 text-base">
            <Link to="/entrar">Entrar</Link>
          </Button>
        </div>
      </LayoutEntrada>
    )
  }

  if (linkInvalido) {
    return (
      <LayoutEntrada titulo="Link inválido">
        <div className="flex flex-col gap-4">
          <IconeQuadrado icone={TriangleAlert} tom="alerta" className="size-14 rounded-xl [&>svg]:size-7" />
          <p>
            Este link de confirmação não é válido: ele pode ter vencido (24 horas), já ter sido usado ou estar
            incompleto. Se você já confirmou, é só entrar. Se não, peça um novo link.
          </p>
          <ReenviarVerificacao pedirEmail />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/entrar" className="font-medium text-primary underline underline-offset-4">
            Ir para Entrar
          </Link>
        </p>
      </LayoutEntrada>
    )
  }

  if (isError) {
    return (
      <LayoutEntrada titulo="Não foi possível confirmar">
        <div className="flex flex-col gap-4">
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error instanceof ApiError ? error.message : 'Algo deu errado. Tente novamente.'}
          </p>
          <Button size="lg" className="h-12 text-base" onClick={() => token && mutate(token)}>
            Tentar de novo
          </Button>
        </div>
      </LayoutEntrada>
    )
  }

  return (
    <LayoutEntrada titulo="Confirmando seu e-mail">
      <p role="status" className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        Só um instante…
      </p>
    </LayoutEntrada>
  )
}
