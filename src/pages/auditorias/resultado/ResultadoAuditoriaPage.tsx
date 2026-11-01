import { Link, Navigate, useParams } from 'react-router'
import { useAuditoria } from '@/api/auditorias'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CLASSIFICACOES } from '@/lib/classificacao'
import { formatarData, formatarNota } from '@/lib/formatadores'
import { cn } from '@/lib/utils'
import { BotaoReabrir } from './BotaoReabrir'
import { BotaoRelatorio } from './BotaoRelatorio'
import { NaoConformidades } from './NaoConformidades'

function Dado({ rotulo, valor }: { rotulo: string; valor?: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="font-medium tabular-nums">{valor ?? '—'}</dd>
    </div>
  )
}

export function ResultadoAuditoriaPage() {
  const { id } = useParams()
  const auditoria = useAuditoria(id)

  if (auditoria.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy aria-label="Carregando resultado">
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (auditoria.isError) {
    const erro = auditoria.error
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-destructive">
          {erro instanceof ApiError && erro.status === 404
            ? 'Auditoria não encontrada.'
            : erro instanceof ApiError
              ? erro.message
              : 'Não foi possível carregar a auditoria.'}
        </p>
        <Button asChild variant="outline" size="lg" className="h-11">
          <Link to="/auditorias">Voltar para auditorias</Link>
        </Button>
      </div>
    )
  }

  const dados = auditoria.data
  if (dados.status === 'EM_ANDAMENTO') return <Navigate to={`/auditorias/${id}/responder`} replace />

  const classificacao = dados.classificacao ? CLASSIFICACOES[dados.classificacao] : null
  const resumo = dados.resumo

  return (
    <section className="flex flex-col gap-6">
      <h1 className="sr-only text-2xl font-semibold md:not-sr-only">Resultado</h1>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <div>
            <p className="font-medium">{dados.clienteNome}</p>
            <p className="text-sm text-muted-foreground">
              {formatarData(dados.dataAuditoria)} · {dados.modeloNome}
            </p>
          </div>
          <p className="text-6xl font-semibold tabular-nums">{formatarNota(dados.nota)}</p>
          {classificacao && (
            <span className={cn('rounded-full px-4 py-1 text-sm font-semibold', classificacao.classes)}>
              {classificacao.rotulo}
            </span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <Dado rotulo="Conformes" valor={resumo?.conformes} />
            <Dado rotulo="Não conformes" valor={resumo?.naoConformes} />
            <Dado rotulo="Não se aplica" valor={resumo?.naoSeAplica} />
            <Dado rotulo="Respondidas" valor={`${resumo?.respondidas ?? 0}/${resumo?.total ?? 0}`} />
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <BotaoRelatorio auditoriaId={id!} />
        <BotaoReabrir auditoriaId={id!} />
      </div>

      <NaoConformidades auditoria={dados} />
    </section>
  )
}
