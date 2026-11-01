import { Building2, LogOut, Mail, UserRound, type LucideIcon } from 'lucide-react'
import { useMe } from '@/api/auth'
import { ApiError } from '@/api/client'
import { useAuth } from '@/auth/useAuth'
import { IconeQuadrado } from '@/components/IconeQuadrado'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { InstalarApp } from './InstalarApp'

function Dado({ icone, rotulo, valor, carregando = false }: {
  icone: LucideIcon
  rotulo: string
  valor?: string
  carregando?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <IconeQuadrado icone={icone} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <dt className="text-sm text-muted-foreground">{rotulo}</dt>
        <dd className="font-medium break-words">
          {carregando ? <Skeleton className="h-5 w-40" aria-label="Carregando" /> : valor || '—'}
        </dd>
      </div>
    </div>
  )
}

export function ContaPage() {
  const { sessao, sair } = useAuth()
  const me = useMe()

  // Mostra já o que está na sessão e atualiza com o que vier de GET /auth/me.
  const nome = me.data?.nome ?? sessao?.usuario.nome
  const email = me.data?.email ?? sessao?.usuario.email
  // A organização só vem do /auth/me (a sessão do login não tem esse dado).
  const organizacao = me.data?.organizacaoNome

  return (
    <section className="flex flex-col gap-6">
      <h1 className="sr-only">Conta</h1>
      <Card>
        <CardContent>
          <dl className="flex flex-col gap-5">
            <Dado icone={UserRound} rotulo="Nome" valor={nome} />
            <Dado icone={Mail} rotulo="E-mail" valor={email} />
            <Dado icone={Building2} rotulo="Organização" valor={organizacao} carregando={me.isPending} />
          </dl>
        </CardContent>
      </Card>
      {me.isError && (
        <p role="alert" className="text-sm text-destructive">
          {me.error instanceof ApiError ? me.error.message : 'Não foi possível atualizar seus dados.'}
        </p>
      )}
      <InstalarApp />
      <Button variant="outline" size="lg" className="h-12 text-base" onClick={sair}>
        <LogOut aria-hidden />
        Sair
      </Button>
    </section>
  )
}
