import { Link, useParams } from 'react-router'
import { useAuditoria } from '@/api/auditorias'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CLASSIFICACOES } from '@/lib/classificacao'
import { formatarData, formatarNota } from '@/lib/formatadores'
import { cn } from '@/lib/utils'

function Dado({ rotulo, valor }: { rotulo: string; valor?: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="font-medium tabular-nums">{valor ?? '—'}</dd>
    </div>
  )
}

/** Página provisória: a tela completa de resultado (PDF, reabrir) é a próxima etapa. */
export function ResultadoAuditoriaPage() {
  const { id } = useParams()
  const auditoria = useAuditoria(id)

  return (
    <section className="flex flex-col gap-6">
      <h1 className="sr-only text-2xl font-semibold md:not-sr-only">Resultado</h1>

      {auditoria.isPending && <div className="h-64 animate-pulse rounded-xl bg-muted" aria-busy />}

      {auditoria.isError && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-destructive">
            {auditoria.error instanceof ApiError ? auditoria.error.message : 'Não foi possível carregar a auditoria.'}
          </p>
          <Button asChild variant="outline" size="lg" className="h-11">
            <Link to="/auditorias">Voltar para auditorias</Link>
          </Button>
        </div>
      )}

      {auditoria.isSuccess && (
        <>
          <Card>
            <CardContent className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">{auditoria.data.clienteNome}</p>
              <p className="text-5xl font-semibold tabular-nums">{formatarNota(auditoria.data.nota)}</p>
              {auditoria.data.classificacao && (
                <span
                  className={cn(
                    'rounded-full px-4 py-1 text-sm font-semibold',
                    CLASSIFICACOES[auditoria.data.classificacao].classes,
                  )}
                >
                  {CLASSIFICACOES[auditoria.data.classificacao].rotulo}
                </span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <Dado rotulo="Data" valor={formatarData(auditoria.data.dataAuditoria)} />
                <Dado rotulo="Modelo" valor={auditoria.data.modeloNome} />
                <Dado rotulo="Conformes" valor={auditoria.data.resumo?.conformes} />
                <Dado rotulo="Não conformes" valor={auditoria.data.resumo?.naoConformes} />
                <Dado rotulo="Não se aplica" valor={auditoria.data.resumo?.naoSeAplica} />
                <Dado rotulo="Respondidas" valor={`${auditoria.data.resumo?.respondidas ?? 0}/${auditoria.data.resumo?.total ?? 0}`} />
              </dl>
            </CardContent>
          </Card>

          {auditoria.data.status === 'EM_ANDAMENTO' && (
            <Button asChild size="lg" className="h-12 text-base">
              <Link to={`/auditorias/${id}/responder`}>Continuar respondendo</Link>
            </Button>
          )}
          <p className="text-sm text-muted-foreground">PDF e reabrir chegam na próxima etapa.</p>
        </>
      )}
    </section>
  )
}
