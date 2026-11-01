import { Link, useParams } from 'react-router'
import { useAuditoria } from '@/api/auditorias'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatarData } from '@/lib/formatadores'

const STATUS = { EM_ANDAMENTO: 'Em andamento', FINALIZADA: 'Finalizada' } as const

function Dado({ rotulo, valor }: { rotulo: string; valor?: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="font-medium">{valor ?? '—'}</dd>
    </div>
  )
}

/** Página provisória: a tela de responder o checklist vem na próxima etapa. */
export function ResponderAuditoriaPage() {
  const { id } = useParams()
  const auditoria = useAuditoria(id)

  return (
    <section className="flex flex-col gap-6">
      <h1 className="sr-only text-2xl font-semibold md:not-sr-only">Responder auditoria</h1>

      {auditoria.isPending && <div className="h-64 animate-pulse rounded-xl bg-muted" aria-busy />}

      {auditoria.isError && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-destructive">
            {auditoria.error instanceof ApiError && auditoria.error.status === 404
              ? 'Auditoria não encontrada.'
              : auditoria.error instanceof ApiError
                ? auditoria.error.message
                : 'Não foi possível carregar a auditoria.'}
          </p>
          <Button asChild variant="outline" size="lg" className="h-11">
            <Link to="/auditorias">Voltar para auditorias</Link>
          </Button>
        </div>
      )}

      {auditoria.isSuccess && (
        <>
          <Card>
            <CardContent>
              <dl className="flex flex-col gap-4">
                <Dado rotulo="Cliente" valor={auditoria.data.clienteNome} />
                <Dado rotulo="Modelo" valor={auditoria.data.modeloNome} />
                <Dado rotulo="Data" valor={formatarData(auditoria.data.dataAuditoria)} />
                <Dado rotulo="Status" valor={auditoria.data.status && STATUS[auditoria.data.status]} />
                {auditoria.data.observacoes && <Dado rotulo="Observações" valor={auditoria.data.observacoes} />}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <Dado rotulo="Perguntas" valor={auditoria.data.resumo?.total} />
                <Dado rotulo="Respondidas" valor={auditoria.data.resumo?.respondidas} />
                <Dado rotulo="Obrigatórias pendentes" valor={auditoria.data.resumo?.obrigatoriasPendentes} />
                <Dado rotulo="Seções" valor={auditoria.data.secoes?.length} />
              </dl>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">
            A tela para responder o checklist será a próxima etapa.
          </p>
        </>
      )}
    </section>
  )
}
