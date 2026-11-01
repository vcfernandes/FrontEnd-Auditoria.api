import { ChevronRight, ClipboardCheck, ClipboardList, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { useAuditoriasRecentes } from '@/api/auditorias'
import { ApiError } from '@/api/client'
import { IconeQuadrado } from '@/components/IconeQuadrado'
import { Button } from '@/components/ui/button'
import { CLASSIFICACOES } from '@/lib/classificacao'
import { formatarData, formatarNota } from '@/lib/formatadores'
import { cn } from '@/lib/utils'
import { EsqueletoLinhas, PainelSecao, VazioSecao } from './PainelSecao'

const QUANTIDADE = 5
const linha =
  'flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40 active:bg-accent/60'

function ErroSecao({ erro, onTentar }: { erro: unknown; onTentar: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 p-4">
      <p className="text-sm text-destructive">
        {erro instanceof ApiError ? erro.message : 'Não foi possível carregar.'}
      </p>
      <Button variant="outline" size="lg" className="h-10" onClick={onTentar}>
        Tentar de novo
      </Button>
    </div>
  )
}

/** `mostrarAcao` falso quando os "primeiros passos" já oferecem o botão Nova auditoria. */
export function ContinuarDeOndeParou({ mostrarAcao = true }: { mostrarAcao?: boolean }) {
  const consulta = useAuditoriasRecentes('EM_ANDAMENTO', QUANTIDADE)
  const itens = consulta.data?.content ?? []
  const total = consulta.data?.page.totalElements ?? 0

  return (
    <PainelSecao
      titulo="Continuar de onde parou"
      subtitulo={total > QUANTIDADE ? `${QUANTIDADE} de ${total} em andamento` : undefined}
      verTodas={itens.length > 0 ? '/auditorias' : undefined}
    >
      {consulta.isPending && <EsqueletoLinhas quantidade={3} />}
      {consulta.isError && <ErroSecao erro={consulta.error} onTentar={() => consulta.refetch()} />}
      {consulta.isSuccess && itens.length === 0 && (
        <VazioSecao
          icone={<ClipboardList className="size-7" aria-hidden />}
          titulo="Nenhuma auditoria em andamento"
          descricao="Quando chegar ao estabelecimento, comece por aqui."
          acao={
            mostrarAcao && (
              <Button asChild size="lg" className="h-11 w-full">
                <Link to="/auditorias/nova">
                  <Plus aria-hidden />
                  Nova auditoria
                </Link>
              </Button>
            )
          }
        />
      )}
      {itens.length > 0 && (
        <ul className="flex flex-col divide-y">
          {itens.map((a) => {
            const respondidas = a.resumo?.respondidas ?? 0
            const totalPerguntas = a.resumo?.total ?? 0
            const porcentagem = totalPerguntas ? (respondidas / totalPerguntas) * 100 : 0
            return (
              <li key={a.id}>
                <Link to={`/auditorias/${a.id}/responder`} className={linha}>
                  <IconeQuadrado icone={ClipboardList} tom="alerta" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate leading-tight font-medium">{a.clienteNome}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.modeloNome}</p>
                    <div className="flex items-center gap-2">
                      <div
                        role="progressbar"
                        aria-label={`Progresso: ${respondidas} de ${totalPerguntas}`}
                        aria-valuemin={0}
                        aria-valuemax={totalPerguntas}
                        aria-valuenow={respondidas}
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                      >
                        <div className="h-full rounded-full bg-primary" style={{ width: `${porcentagem}%` }} />
                      </div>
                      <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                        {respondidas}/{totalPerguntas}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </PainelSecao>
  )
}

export function UltimasFinalizadas() {
  const consulta = useAuditoriasRecentes('FINALIZADA', QUANTIDADE)
  const itens = consulta.data?.content ?? []

  return (
    <PainelSecao
      titulo="Últimas finalizadas"
      verTodas={itens.length > 0 ? '/auditorias?status=finalizadas' : undefined}
    >
      {consulta.isPending && <EsqueletoLinhas quantidade={3} />}
      {consulta.isError && <ErroSecao erro={consulta.error} onTentar={() => consulta.refetch()} />}
      {consulta.isSuccess && itens.length === 0 && (
        <VazioSecao
          icone={<ClipboardCheck className="size-7" aria-hidden />}
          titulo="Nenhuma auditoria finalizada ainda"
          descricao="Ao finalizar uma auditoria, a nota e a classificação aparecem aqui."
        />
      )}
      {itens.length > 0 && (
        <ul className="flex flex-col divide-y">
          {itens.map((a) => {
            const estilo = a.classificacao ? CLASSIFICACOES[a.classificacao] : null
            return (
              <li key={a.id}>
                <Link to={`/auditorias/${a.id}/resultado`} className={linha}>
                  <IconeQuadrado icone={ClipboardCheck} tom="sucesso" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.clienteNome}</p>
                    <p className="text-xs text-muted-foreground">{formatarData(a.dataAuditoria)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-semibold tabular-nums">{formatarNota(a.nota)}</span>
                    {estilo && (
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', estilo.classes)}>
                        {estilo.rotulo}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </PainelSecao>
  )
}
