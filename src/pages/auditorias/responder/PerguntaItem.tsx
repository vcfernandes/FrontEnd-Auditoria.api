import { MessageSquarePlus } from 'lucide-react'
import { memo, useState } from 'react'
import type { ItemAuditoria } from '@/api/auditorias'
import { Textarea } from '@/components/ui/textarea'
import type { RespostaLocal, ValorResposta } from '@/lib/filaRespostas'
import { cn } from '@/lib/utils'

const OPCOES: { valor: ValorResposta; rotulo: string; marcado: string; desmarcado: string }[] = [
  {
    valor: 'CONFORME',
    rotulo: 'Conforme',
    marcado: 'border-emerald-600 bg-emerald-600 text-white',
    desmarcado: 'border-emerald-600/40 text-emerald-700 dark:text-emerald-400',
  },
  {
    valor: 'NAO_CONFORME',
    rotulo: 'Não conforme',
    marcado: 'border-red-600 bg-red-600 text-white',
    desmarcado: 'border-red-600/40 text-red-700 dark:text-red-400',
  },
  {
    valor: 'NAO_SE_APLICA',
    rotulo: 'N/A',
    marcado: 'border-zinc-600 bg-zinc-600 text-white',
    desmarcado: 'border-zinc-400/60 text-muted-foreground',
  },
]

interface Props {
  item: ItemAuditoria
  numero: string
  valor: RespostaLocal
  destacar: boolean
  onResposta: (itemId: string, resposta: ValorResposta | null) => void
  onObservacao: (itemId: string, observacao: string) => void
}

export const PerguntaItem = memo(function PerguntaItem({
  item,
  numero,
  valor,
  destacar,
  onResposta,
  onObservacao,
}: Props) {
  const [abertaPeloUsuario, setAbertaPeloUsuario] = useState(false)
  const itemId = item.id!
  // Abre sozinha em "Não conforme" e fica aberta enquanto tiver texto.
  const mostrarObservacao = abertaPeloUsuario || valor.observacao !== '' || valor.resposta === 'NAO_CONFORME'
  const pendenteObrigatoria = destacar && item.obrigatoria && !valor.resposta

  return (
    <article
      id={`pergunta-${itemId}`}
      className={cn(
        'flex scroll-mt-52 flex-col gap-3 rounded-xl border bg-card p-4 md:scroll-mt-52',
        pendenteObrigatoria && 'border-destructive ring-1 ring-destructive',
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="leading-snug font-medium">
          <span className="mr-1.5 text-muted-foreground tabular-nums">{numero}</span>
          {item.texto}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {item.obrigatoria && (
            <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
              Obrigatória
            </span>
          )}
          {item.referenciaLegal && <span className="text-xs text-muted-foreground">{item.referenciaLegal}</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2" role="group" aria-label={`Resposta da pergunta ${numero}`}>
        {OPCOES.map((opcao) => {
          const marcado = valor.resposta === opcao.valor
          return (
            <button
              key={opcao.valor}
              type="button"
              aria-pressed={marcado}
              onClick={() => onResposta(itemId, marcado ? null : opcao.valor)}
              className={cn(
                'flex h-14 items-center justify-center rounded-lg border-2 px-1 text-sm leading-tight font-semibold transition-colors select-none active:scale-[0.98]',
                marcado ? opcao.marcado : cn('bg-background', opcao.desmarcado),
              )}
            >
              {opcao.rotulo}
            </button>
          )
        })}
      </div>

      {mostrarObservacao ? (
        <Textarea
          aria-label={`Observação da pergunta ${numero}`}
          placeholder="Observação"
          rows={2}
          maxLength={1000}
          autoFocus={abertaPeloUsuario && valor.observacao === ''}
          value={valor.observacao}
          onChange={(e) => onObservacao(itemId, e.target.value)}
          className="text-base"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAbertaPeloUsuario(true)}
          className="flex h-10 items-center gap-2 self-start rounded-lg px-2 text-sm font-medium text-muted-foreground hover:bg-muted active:bg-muted"
        >
          <MessageSquarePlus className="size-4" aria-hidden />
          Adicionar observação
        </button>
      )}
    </article>
  )
})
