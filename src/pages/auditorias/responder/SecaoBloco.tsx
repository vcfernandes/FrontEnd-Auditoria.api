import { CheckCircle2, ChevronDown } from 'lucide-react'
import { memo } from 'react'
import type { ItemAuditoria } from '@/api/auditorias'
import type { RespostaLocal, ValorResposta } from '@/lib/filaRespostas'
import { cn } from '@/lib/utils'
import { PerguntaItem } from './PerguntaItem'

interface Props {
  auditoriaId: string
  indice: number
  titulo: string
  itens: ItemAuditoria[]
  respostas: Record<string, RespostaLocal>
  aberta: boolean
  /** Filtro "só pendentes": ids visíveis (fotografados ao ligar o filtro). `null` = todos. */
  visiveis: Set<string> | null
  destacar: boolean
  onAlternar: (indice: number) => void
  onResposta: (itemId: string, resposta: ValorResposta | null) => void
  onObservacao: (itemId: string, observacao: string) => void
}

export const SecaoBloco = memo(function SecaoBloco({
  auditoriaId,
  indice,
  titulo,
  itens,
  respostas,
  aberta,
  visiveis,
  destacar,
  onAlternar,
  onResposta,
  onObservacao,
}: Props) {
  const respondidas = itens.filter((i) => respostas[i.id!]?.resposta).length
  const completa = respondidas === itens.length
  const mostrados = visiveis ? itens.filter((i) => visiveis.has(i.id!)) : itens
  const idConteudo = `secao-${indice}`

  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        aria-expanded={aberta}
        aria-controls={idConteudo}
        onClick={() => onAlternar(indice)}
        className="flex min-h-14 items-center gap-3 rounded-xl border bg-muted/50 px-4 py-3 text-left transition-colors hover:bg-muted active:bg-muted"
      >
        <span className="flex-1 leading-snug font-semibold">
          {indice + 1}. {titulo}
        </span>
        <span
          className={cn(
            'flex shrink-0 items-center gap-1 text-sm tabular-nums',
            completa ? 'font-medium text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
          )}
        >
          {completa && <CheckCircle2 className="size-4" aria-hidden />}
          {respondidas}/{itens.length}
        </span>
        <ChevronDown
          className={cn('size-5 shrink-0 text-muted-foreground transition-transform', aberta && 'rotate-180')}
          aria-hidden
        />
      </button>

      {aberta && (
        <div id={idConteudo} className="flex flex-col gap-3">
          {mostrados.length === 0 && (
            <p className="px-1 text-sm text-muted-foreground">Nenhuma pergunta pendente nesta seção.</p>
          )}
          {mostrados.map((item) => {
            const posicao = itens.indexOf(item)
            return (
              <PerguntaItem
                key={item.id}
                auditoriaId={auditoriaId}
                item={item}
                numero={`${indice + 1}.${posicao + 1}`}
                valor={respostas[item.id!]}
                destacar={destacar}
                onResposta={onResposta}
                onObservacao={onObservacao}
              />
            )
          })}
        </div>
      )}
    </section>
  )
})
