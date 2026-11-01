import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'

/** Bloco do painel: cartão branco com título, link opcional ("Ver todas") e conteúdo. */
export function PainelSecao({
  titulo,
  subtitulo,
  verTodas,
  children,
}: {
  titulo: string
  subtitulo?: string
  verTodas?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="font-semibold">{titulo}</h2>
          {subtitulo && <p className="text-xs text-muted-foreground">{subtitulo}</p>}
        </div>
        {verTodas && (
          <Link
            to={verTodas}
            className="-mr-2 flex h-10 shrink-0 items-center rounded-lg px-2 text-sm font-medium text-primary hover:bg-accent/60"
          >
            Ver todas
          </Link>
        )}
      </header>
      {children}
    </section>
  )
}

/** Linhas em carregamento dentro de um PainelSecao. */
export function EsqueletoLinhas({ quantidade = 3 }: { quantidade?: number }) {
  return (
    <div className="flex flex-col divide-y" aria-busy aria-label="Carregando">
      {Array.from({ length: quantidade }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-10 shrink-0 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Mensagem de vazio compacta, dentro de um PainelSecao. */
export function VazioSecao({
  icone,
  titulo,
  descricao,
  acao,
}: {
  icone: ReactNode
  titulo: string
  descricao: string
  acao?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
      <span className="mb-1 flex size-14 items-center justify-center rounded-full bg-primary-suave text-primary">
        {icone}
      </span>
      <p className="font-medium">{titulo}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{descricao}</p>
      {acao && <div className="mt-2 w-full max-w-60">{acao}</div>}
    </div>
  )
}
