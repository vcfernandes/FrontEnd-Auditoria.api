import { ClipboardList, Plus, SearchX, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { TAMANHO_PAGINA_AUDITORIAS, useAuditorias, type StatusAuditoria } from '@/api/auditorias'
import { ApiError } from '@/api/client'
import { EsqueletoCartoes } from '@/components/Esqueletos'
import { EstadoVazio } from '@/components/EstadoVazio'
import { Paginacao } from '@/components/Paginacao'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AuditoriaCard } from '../AuditoriaCard'
import { FiltrosAuditorias, type ValoresFiltro } from './FiltrosAuditorias'
import { TabelaAuditorias } from './TabelaAuditorias'

/** Valor do status no endereço (`?status=andamento|finalizadas`); sem o parâmetro = todos. */
const STATUS_URL: Record<StatusAuditoria, string> = { EM_ANDAMENTO: 'andamento', FINALIZADA: 'finalizadas' }
const PARAMS_FILTRO = ['busca', 'status', 'cliente', 'de', 'ate', 'pagina']

function lerStatus(valor: string | null): StatusAuditoria | undefined {
  if (valor === STATUS_URL.EM_ANDAMENTO) return 'EM_ANDAMENTO'
  if (valor === STATUS_URL.FINALIZADA) return 'FINALIZADA'
  return undefined
}

export function AbaRealizadas() {
  // Filtros e página ficam no endereço: ao voltar de uma auditoria, a lista continua igual.
  const [params, setParams] = useSearchParams()
  const valores: ValoresFiltro = {
    busca: params.get('busca') ?? '',
    status: lerStatus(params.get('status')),
    clienteId: params.get('cliente'),
    de: params.get('de') ?? '',
    ate: params.get('ate') ?? '',
  }
  const pagina = Math.max(0, (Number(params.get('pagina')) || 1) - 1)

  const consulta = useAuditorias({
    status: valores.status,
    clienteId: valores.clienteId ?? undefined,
    busca: valores.busca || undefined,
    dataInicio: valores.de || undefined,
    dataFim: valores.ate || undefined,
    pagina,
  })
  const itens = consulta.data?.content ?? []
  const pageInfo = consulta.data?.page
  const temFiltro = !!(valores.busca || valores.status || valores.clienteId || valores.de || valores.ate)

  const mudar = (mudancas: Record<string, string | null | undefined>, voltarAoInicio = true) =>
    setParams(
      (atual) => {
        const proximo = new URLSearchParams(atual)
        for (const [chave, valor] of Object.entries(mudancas)) {
          if (valor) proximo.set(chave, valor)
          else proximo.delete(chave)
        }
        if (voltarAoInicio) proximo.delete('pagina')
        return proximo
      },
      { replace: true },
    )

  const mudarFiltro = (m: Partial<ValoresFiltro>) => {
    const mudancas: Record<string, string | null | undefined> = {}
    if ('busca' in m) mudancas.busca = m.busca
    if ('status' in m) mudancas.status = m.status ? STATUS_URL[m.status] : null
    if ('clienteId' in m) mudancas.cliente = m.clienteId
    if ('de' in m) mudancas.de = m.de
    if ('ate' in m) mudancas.ate = m.ate
    mudar(mudancas)
  }

  const limpar = () => mudar(Object.fromEntries(PARAMS_FILTRO.map((p) => [p, null])))

  const mudarPagina = (nova: number) => {
    mudar({ pagina: nova > 0 ? String(nova + 1) : null }, false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-4">
      <FiltrosAuditorias valores={valores} onChange={mudarFiltro} onLimpar={limpar} />

      {consulta.isPending && <EsqueletoCartoes quantidade={4} rotulo="Carregando auditorias" />}

      {consulta.isError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-card p-4">
          <p className="text-sm text-destructive">
            {consulta.error instanceof ApiError ? consulta.error.message : 'Não foi possível carregar as auditorias.'}
          </p>
          <Button variant="outline" size="lg" className="h-11" onClick={() => consulta.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {consulta.isSuccess && itens.length === 0 && pagina > 0 && (
        <EstadoVazio
          icone={ClipboardList}
          titulo="Esta página não tem mais auditorias"
          acao={
            <Button variant="outline" size="lg" className="h-12 w-full text-base" onClick={() => mudarPagina(0)}>
              Ir para a primeira página
            </Button>
          }
        />
      )}

      {consulta.isSuccess && itens.length === 0 && pagina === 0 && (temFiltro ? (
        <EstadoVazio
          icone={SearchX}
          titulo="Nenhuma auditoria com esses filtros"
          descricao="Confira a busca, o cliente, o status e o período."
          acao={
            <Button variant="outline" size="lg" className="h-12 w-full text-base" onClick={limpar}>
              <X aria-hidden />
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <EstadoVazio
          icone={ClipboardList}
          titulo="Nenhuma auditoria ainda"
          descricao="Comece uma inspeção escolhendo o cliente e o checklist."
          acao={
            <Button asChild size="lg" className="h-12 w-full text-base">
              <Link to="/auditorias/nova">
                <Plus aria-hidden />
                Nova auditoria
              </Link>
            </Button>
          }
        />
      ))}

      {itens.length > 0 && pageInfo && (
        <>
          <div className="hidden lg:block">
            <TabelaAuditorias itens={itens} apagada={consulta.isPlaceholderData} />
          </div>
          <ul className={cn('flex flex-col gap-3 transition-opacity lg:hidden', consulta.isPlaceholderData && 'opacity-60')}>
            {itens.map((auditoria) => (
              <li key={auditoria.id}>
                <AuditoriaCard auditoria={auditoria} />
              </li>
            ))}
          </ul>
          <Paginacao
            pagina={pagina}
            totalPaginas={pageInfo.totalPages ?? 1}
            totalItens={pageInfo.totalElements ?? itens.length}
            tamanhoPagina={TAMANHO_PAGINA_AUDITORIAS}
            itensNaPagina={itens.length}
            nome={['auditoria', 'auditorias']}
            onMudar={mudarPagina}
          />
        </>
      )}
    </div>
  )
}
