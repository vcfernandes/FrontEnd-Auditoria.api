import { ClipboardList } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { useAuditorias, type StatusAuditoria } from '@/api/auditorias'
import { ApiError } from '@/api/client'
import { BotaoNovo } from '@/components/BotaoNovo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AuditoriaCard } from './AuditoriaCard'
import { FiltroCliente } from './FiltroCliente'

const ABAS: { status: StatusAuditoria; rotulo: string; vazio: string }[] = [
  { status: 'EM_ANDAMENTO', rotulo: 'Em andamento', vazio: 'Nenhuma auditoria em andamento' },
  { status: 'FINALIZADA', rotulo: 'Finalizadas', vazio: 'Nenhuma auditoria finalizada ainda' },
]

function Carregando() {
  return (
    <div className="flex flex-col gap-3" aria-busy aria-label="Carregando auditorias">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  )
}

export function AuditoriasPage() {
  // Aba e cliente ficam na URL: ao voltar de uma auditoria, a lista continua no mesmo filtro.
  const [params, setParams] = useSearchParams()
  const status: StatusAuditoria = params.get('status') === 'finalizadas' ? 'FINALIZADA' : 'EM_ANDAMENTO'
  const clienteId = params.get('cliente')
  const auditorias = useAuditorias({ status, clienteId: clienteId ?? undefined })

  const itens = auditorias.data?.pages.flatMap((p) => p.content ?? []) ?? []
  const total = auditorias.data?.pages[0]?.page.totalElements ?? 0
  const aba = ABAS.find((a) => a.status === status)!

  const mudarFiltro = (novo: { status?: StatusAuditoria; clienteId?: string | null }) => {
    const proximo = new URLSearchParams(params)
    if (novo.status) {
      if (novo.status === 'FINALIZADA') proximo.set('status', 'finalizadas')
      else proximo.delete('status')
    }
    if (novo.clienteId !== undefined) {
      if (novo.clienteId) proximo.set('cliente', novo.clienteId)
      else proximo.delete('cliente')
    }
    setParams(proximo, { replace: true })
  }

  return (
    <section className="flex flex-col gap-4 pb-16 md:pb-0">
      <div className="flex items-center justify-between gap-4">
        <h1 className="sr-only text-2xl font-semibold md:not-sr-only">Auditorias</h1>
        <BotaoNovo para="/auditorias/nova" rotulo="Nova auditoria" />
      </div>

      <div role="tablist" aria-label="Situação" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {ABAS.map((a) => (
          <button
            key={a.status}
            type="button"
            role="tab"
            aria-selected={a.status === status}
            onClick={() => mudarFiltro({ status: a.status })}
            className={cn(
              'h-11 rounded-lg text-sm font-medium transition-colors',
              a.status === status ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      <FiltroCliente clienteId={clienteId} onChange={(id) => mudarFiltro({ clienteId: id })} />

      {auditorias.isPending && <Carregando />}

      {auditorias.isError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 p-4">
          <p className="text-sm text-destructive">
            {auditorias.error instanceof ApiError ? auditorias.error.message : 'Não foi possível carregar as auditorias.'}
          </p>
          <Button variant="outline" size="lg" className="h-11" onClick={() => auditorias.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {auditorias.isSuccess && itens.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
          <ClipboardList className="size-10 text-muted-foreground" aria-hidden />
          <p className="font-medium">
            {aba.vazio}
            {clienteId && ' para este cliente'}
          </p>
          {status === 'EM_ANDAMENTO' && (
            <p className="text-sm text-muted-foreground">Toque em “Nova auditoria” para começar uma inspeção.</p>
          )}
        </div>
      )}

      {itens.length > 0 && (
        <>
          <ul className={cn('flex flex-col gap-3 transition-opacity', auditorias.isPlaceholderData && 'opacity-60')}>
            {itens.map((auditoria) => (
              <li key={auditoria.id}>
                <AuditoriaCard auditoria={auditoria} />
              </li>
            ))}
          </ul>
          <p className="text-center text-sm text-muted-foreground">
            {itens.length} de {total} {total === 1 ? 'auditoria' : 'auditorias'}
          </p>
          {auditorias.hasNextPage && (
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-base"
              disabled={auditorias.isFetchingNextPage}
              onClick={() => auditorias.fetchNextPage()}
            >
              {auditorias.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
            </Button>
          )}
        </>
      )}
    </section>
  )
}
