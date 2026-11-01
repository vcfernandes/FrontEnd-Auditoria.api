import { Skeleton } from '@/components/ui/skeleton'

/** Lista de cartões em carregamento, no formato dos cartões reais (ícone + duas linhas). */
export function EsqueletoCartoes({ quantidade = 3, rotulo = 'Carregando' }: { quantidade?: number; rotulo?: string }) {
  return (
    <div className="flex flex-col gap-3" aria-busy aria-label={rotulo}>
      {Array.from({ length: quantidade }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <Skeleton className="size-10 shrink-0 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Formulário em carregamento (rótulo + campo). */
export function EsqueletoFormulario({ campos = 3 }: { campos?: number }) {
  return (
    <div className="flex flex-col gap-5" aria-busy aria-label="Carregando">
      {Array.from({ length: campos }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  )
}

/** Tela de responder em carregamento: topo com progresso + perguntas. */
export function EsqueletoQuestionario() {
  return (
    <div className="flex flex-col gap-4" aria-busy aria-label="Carregando auditoria">
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-4 w-2/5" />
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/5" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Resultado em carregamento: nota + resumo + botões. */
export function EsqueletoResultado() {
  return (
    <div className="flex flex-col gap-6" aria-busy aria-label="Carregando resultado">
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-14 w-32" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  )
}
