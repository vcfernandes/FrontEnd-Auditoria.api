import type { Dashboard } from '@/api/dashboard'
import { CLASSIFICACOES, ORDEM_CLASSIFICACOES } from '@/lib/classificacao'
import { cn } from '@/lib/utils'
import { PainelSecao } from './PainelSecao'

/** Barra horizontal com as quatro faixas dos últimos 90 dias. Só existe se houver finalizadas no período. */
export function DistribuicaoClassificacao({ dados }: { dados: Dashboard }) {
  const periodo = dados.ultimos90Dias
  const contagem = periodo?.porClassificacao ?? {}
  const total = ORDEM_CLASSIFICACOES.reduce((soma, c) => soma + (contagem[c] ?? 0), 0)
  if (!periodo?.finalizadas || total === 0) return null

  const resumoTexto = ORDEM_CLASSIFICACOES.map((c) => `${CLASSIFICACOES[c].rotulo}: ${contagem[c] ?? 0}`).join(', ')

  return (
    <PainelSecao
      titulo="Classificações (90 dias)"
      subtitulo={`${total} ${total === 1 ? 'auditoria finalizada' : 'auditorias finalizadas'}`}
    >
      <div className="flex flex-col gap-4 p-4">
        <div role="img" aria-label={resumoTexto} className="flex h-4 gap-0.5 overflow-hidden rounded-full bg-muted">
          {ORDEM_CLASSIFICACOES.map((c) => {
            const quantidade = contagem[c] ?? 0
            if (!quantidade) return null
            return (
              <div
                key={c}
                className={cn('h-full first:rounded-l-full last:rounded-r-full', CLASSIFICACOES[c].barra)}
                style={{ width: `${(quantidade / total) * 100}%` }}
              />
            )
          })}
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {ORDEM_CLASSIFICACOES.map((c) => (
            <li key={c} className="flex items-center gap-2">
              <span className={cn('size-3 shrink-0 rounded-full', CLASSIFICACOES[c].barra)} aria-hidden />
              <span className="flex-1 text-muted-foreground">{CLASSIFICACOES[c].rotulo}</span>
              <span className="font-semibold tabular-nums">{contagem[c] ?? 0}</span>
            </li>
          ))}
        </ul>
      </div>
    </PainelSecao>
  )
}
