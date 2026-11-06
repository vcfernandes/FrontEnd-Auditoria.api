import { MailCheck } from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router'
import { IconeQuadrado } from '@/components/IconeQuadrado'
import { LayoutEntrada } from '@/components/LayoutEntrada'
import { ReenviarVerificacao } from '@/components/ReenviarVerificacao'

/** Depois do cadastro: a conta só entra em uso depois de confirmar o e-mail. O endereço vem do cadastro. */
export function ConfiraEmailPage() {
  const email = (useLocation().state as { email?: string } | null)?.email
  if (!email) return <Navigate to="/criar-conta" replace />

  return (
    <LayoutEntrada titulo="Confira seu e-mail">
      <div className="flex flex-col gap-4">
        <IconeQuadrado icone={MailCheck} tom="sucesso" className="size-14 rounded-xl [&>svg]:size-7" />
        <p>
          Enviamos um link de confirmação para <strong className="break-all">{email}</strong>. Abra o e-mail e toque no
          link para ativar sua conta. O link vale por 24 horas.
        </p>
        <p className="text-sm text-muted-foreground">Não chegou? Veja a caixa de spam ou reenvie o e-mail.</p>
        <ReenviarVerificacao email={email} />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Já confirmou?{' '}
        <Link to="/entrar" className="font-medium text-primary underline underline-offset-4">
          Entrar
        </Link>
        {' · '}
        <Link to="/criar-conta" replace className="font-medium text-primary underline underline-offset-4">
          Usei o e-mail errado
        </Link>
      </p>
    </LayoutEntrada>
  )
}
