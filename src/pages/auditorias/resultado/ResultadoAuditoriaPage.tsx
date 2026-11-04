import { CheckCircle2, ListChecks, MinusCircle, XCircle, type LucideIcon } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router'
import { useAuditoria } from '@/api/auditorias'
import { ApiError } from '@/api/client'
import { EsqueletoResultado } from '@/components/Esqueletos'
import { IconeQuadrado, type TomIcone } from '@/components/IconeQuadrado'
import { Button } from '@/components/ui/button'
import { comBuscaLembrada } from '@/lib/ultimaLista'
import { Card, CardContent } from '@/components/ui/card'
import { CLASSIFICACOES } from '@/lib/classificacao'
import { formatarData, formatarNota } from '@/lib/formatadores'
import { cn } from '@/lib/utils'
import { Assinaturas } from './Assinaturas'
import { BotaoReabrir } from './BotaoReabrir'
import { BotaoRelatorio } from './BotaoRelatorio'
import { NaoConformidades } from './NaoConformidades'

function Dado({
  icone,
  tom,
  rotulo,
  valor,
}: {
  icone: LucideIcon
  tom: TomIcone
  rotulo: string
  valor?: string | number
}) {
  return (
    <div className="flex items-center gap-3">
      <IconeQuadrado icone={icone} tom={tom} />
      <div className="flex flex-col">
        <dt className="text-sm text-muted-foreground">{rotulo}</dt>
        <dd className="text-lg leading-tight font-semibold tabular-nums">{valor ?? '—'}</dd>
      </div>
    </div>
  )
}

export function ResultadoAuditoriaPage() {
  const { id } = useParams()
  const auditoria = useAuditoria(id)

  if (auditoria.isPending) return <EsqueletoResultado />

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
          <Link to={comBuscaLembrada('/auditorias')}>Voltar para auditorias</Link>
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
      <h1 className="sr-only">Resultado</h1>

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
            <Dado icone={CheckCircle2} tom="sucesso" rotulo="Conformes" valor={resumo?.conformes} />
            <Dado icone={XCircle} tom="perigo" rotulo="Não conformes" valor={resumo?.naoConformes} />
            <Dado icone={MinusCircle} tom="neutro" rotulo="Não se aplica" valor={resumo?.naoSeAplica} />
            <Dado icone={ListChecks} tom="primario" rotulo="Respondidas" valor={`${resumo?.respondidas ?? 0}/${resumo?.total ?? 0}`} />
          </dl>
        </CardContent>
      </Card>

      <Assinaturas auditoria={dados} />

      <div className="flex flex-col gap-3">
        <BotaoRelatorio auditoriaId={id!} />
        <BotaoReabrir auditoriaId={id!} temAssinaturas={(dados.assinaturas?.length ?? 0) > 0} />
      </div>

      <NaoConformidades auditoria={dados} />
    </section>
  )
}
