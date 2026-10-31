import { useMe } from '@/api/auth'
import { ApiError } from '@/api/client'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const PAPEIS: Record<string, string> = { ADMIN: 'Administrador', AUDITOR: 'Auditor' }

function Dado({ rotulo, valor }: { rotulo: string; valor?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="break-words font-medium">{valor || '—'}</dd>
    </div>
  )
}

export function ContaPage() {
  const { sessao, sair } = useAuth()
  const me = useMe()

  // Mostra já o que está na sessão e atualiza com o que vier de GET /auth/me.
  const nome = me.data?.nome ?? sessao?.usuario.nome
  const email = me.data?.email ?? sessao?.usuario.email
  const papel = me.data?.papel ?? sessao?.usuario.papel

  return (
    <section className="flex flex-col gap-6">
      <h1 className="sr-only text-2xl font-semibold md:not-sr-only">Conta</h1>
      <Card>
        <CardContent>
          <dl className="flex flex-col gap-4">
            <Dado rotulo="Nome" valor={nome} />
            <Dado rotulo="E-mail" valor={email} />
            <Dado rotulo="Perfil" valor={papel ? (PAPEIS[papel] ?? papel) : undefined} />
          </dl>
        </CardContent>
      </Card>
      {me.isError && (
        <p role="alert" className="text-sm text-destructive">
          {me.error instanceof ApiError ? me.error.message : 'Não foi possível atualizar seus dados.'}
        </p>
      )}
      <Button variant="outline" size="lg" className="h-12 text-base" onClick={sair}>
        Sair
      </Button>
    </section>
  )
}
