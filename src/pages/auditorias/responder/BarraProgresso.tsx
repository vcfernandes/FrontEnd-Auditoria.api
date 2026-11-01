import { ListFilter } from 'lucide-react'
import type { EstadoFila } from '@/lib/filaRespostas'
import { cn } from '@/lib/utils'
import { IndicadorSalvamento } from './IndicadorSalvamento'

interface Props {
  cliente?: string
  modelo?: string
  respondidas: number
  total: number
  obrigatoriasPendentes: number
  estado: EstadoFila
  soPendentes: boolean
  onTentarDeNovo: () => void
  onAlternarFiltro: () => void
}

/** Topo fixo: fica logo abaixo do cabeçalho no celular e no topo da página no computador. */
export function BarraProgresso({
  cliente,
  modelo,
  respondidas,
  total,
  obrigatoriasPendentes,
  estado,
  soPendentes,
  onTentarDeNovo,
  onAlternarFiltro,
}: Props) {
  const porcentagem = total ? Math.round((respondidas / total) * 100) : 0

  return (
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-[5] -mx-4 -mt-6 flex flex-col gap-2 border-b bg-background/95 px-4 pt-3 pb-3 backdrop-blur md:top-16 md:-mx-8 md:-mt-10 md:px-8 md:pt-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg leading-tight font-semibold">{cliente}</p>
          {modelo && <p className="truncate text-xs text-muted-foreground">{modelo}</p>}
        </div>
        <IndicadorSalvamento estado={estado} onTentarDeNovo={onTentarDeNovo} />
      </div>

      <div
        role="progressbar"
        aria-label="Perguntas respondidas"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={respondidas}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${porcentagem}%` }} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm">
          <span className="font-medium tabular-nums">
            {respondidas}/{total}
          </span>{' '}
          respondidas ·{' '}
          {obrigatoriasPendentes > 0 ? (
            <span className="font-medium text-destructive">
              {obrigatoriasPendentes} {obrigatoriasPendentes === 1 ? 'obrigatória falta' : 'obrigatórias faltam'}
            </span>
          ) : (
            <span className="font-medium text-emerald-700 dark:text-emerald-400">obrigatórias ok</span>
          )}
        </p>
        <button
          type="button"
          aria-pressed={soPendentes}
          onClick={onAlternarFiltro}
          className={cn(
            'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
            soPendentes ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted',
          )}
        >
          <ListFilter className="size-3.5" aria-hidden />
          Só pendentes
        </button>
      </div>
    </div>
  )
}
