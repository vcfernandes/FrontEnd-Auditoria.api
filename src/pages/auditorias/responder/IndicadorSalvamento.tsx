import { AlertCircle, Check, Loader2 } from 'lucide-react'
import type { EstadoFila } from '@/lib/filaRespostas'

export function IndicadorSalvamento({ estado, onTentarDeNovo }: { estado: EstadoFila; onTentarDeNovo: () => void }) {
  return (
    <div aria-live="polite" className="flex shrink-0 items-center text-xs">
      {(estado.status === 'pendente' || estado.status === 'salvando') && (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Salvando…
        </span>
      )}
      {estado.status === 'salvo' && (
        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
          <Check className="size-3.5" aria-hidden />
          Salvo
        </span>
      )}
      {estado.status === 'erro' && (
        <button
          type="button"
          onClick={onTentarDeNovo}
          title={estado.mensagem ?? undefined}
          className="-my-2 flex min-h-10 items-center gap-1 rounded-md px-1 text-left font-medium text-destructive underline-offset-2 hover:underline"
        >
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          Erro ao salvar, tentar de novo
        </button>
      )}
    </div>
  )
}
