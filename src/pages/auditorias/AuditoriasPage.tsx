import { ClipboardCheck, ClipboardList, Plus, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { useAuditorias, type StatusAuditoria } from '@/api/auditorias'
import { ApiError } from '@/api/client'
import { BotaoNovo } from '@/components/BotaoNovo'
import { EsqueletoCartoes } from '@/components/Esqueletos'
import { EstadoVazio } from '@/components/EstadoVazio'
import { Button } from '@/components/ui/button'
import { formatarData } from '@/lib/formatadores'
import { cn } from '@/lib/utils'
import { AuditoriaCard } from './AuditoriaCard'
import { FiltroCliente } from './FiltroCliente'

const ABAS: { status: StatusAuditoria; rotulo: string; vazio: string }[] = [
  { status: 'EM_ANDAMENTO', rotulo: 'Em andamento', vazio: 'Nenhuma auditoria em andamento' },
  { status: 'FINALIZADA', rotulo: 'Finalizadas', vazio: 'Nenhuma auditoria finalizada ainda' },
]

export function AuditoriasPage() {
  // Aba e cliente ficam na URL: ao voltar de uma auditoria, a lista continua no mesmo filtro.
  const [params, setParams] = useSearchParams()
  const status: StatusAuditoria = params.get('status') === 'finalizadas' ? 'FINALIZADA' : 'EM_ANDAMENTO'
  const clienteId = params.get('cliente')
  // ?desde=aaaa-mm-dd vem dos cartões do painel (finalizadas no mês, nota média de 90 dias).
  const desde = params.get('desde')
  const auditorias = useAuditorias({ status, clienteId: clienteId ?? undefined, dataInicio: desde ?? undefined })

  const itens = auditorias.data?.pages.flatMap((p) => p.content ?? []) ?? []
  const total = auditorias.data?.pages[0]?.page.totalElements ?? 0
  const aba = ABAS.find((a) => a.status === status)!

  const mudarFiltro = (novo: { status?: StatusAuditoria; clienteId?: string | null; desde?: null }) => {
    const proximo = new URLSearchParams(params)
    if (novo.desde === null) proximo.delete('desde')
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
      <h1 className="sr-only">Auditorias</h1>

      {/* Abas + botão "Nova auditoria" (no celular, o botão é o flutuante) */}
      <div className="flex items-center gap-3">
        <div role="tablist" aria-label="Situação" className="grid flex-1 grid-cols-2 gap-1 rounded-xl border bg-secondary p-1">
          {ABAS.map((a) => (
            <button
              key={a.status}
              type="button"
              role="tab"
              aria-selected={a.status === status}
              onClick={() => mudarFiltro({ status: a.status })}
              className={cn(
                'h-10 rounded-lg text-sm font-medium transition-colors',
                a.status === status
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {a.rotulo}
            </button>
          ))}
        </div>
        <BotaoNovo para="/auditorias/nova" rotulo="Nova auditoria" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FiltroCliente clienteId={clienteId} onChange={(id) => mudarFiltro({ clienteId: id })} />
        {desde && (
          <div className="flex items-center gap-2 rounded-full border border-primary bg-primary-suave/60 py-1 pr-1 pl-3 text-sm">
            <span>
              Data da auditoria desde <strong className="font-medium">{formatarData(desde)}</strong>
            </span>
            <button
              type="button"
              aria-label="Remover filtro de data"
              onClick={() => mudarFiltro({ desde: null })}
              className="flex size-9 items-center justify-center rounded-full hover:bg-muted active:bg-muted"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        )}
      </div>

      {auditorias.isPending && <EsqueletoCartoes quantidade={3} rotulo="Carregando auditorias" />}

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
        <EstadoVazio
          icone={status === 'EM_ANDAMENTO' ? ClipboardList : ClipboardCheck}
          titulo={`${aba.vazio}${clienteId ? ' para este cliente' : ''}${desde ? ` desde ${formatarData(desde)}` : ''}`}
          descricao={
            status === 'EM_ANDAMENTO'
              ? 'Comece uma inspeção escolhendo o cliente e o checklist.'
              : 'As auditorias aparecem aqui depois de finalizadas, com a nota e o relatório em PDF.'
          }
          acao={
            status === 'EM_ANDAMENTO' && (
              <Button asChild size="lg" className="h-12 w-full text-base">
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
