import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { FilaRespostas, type RespostaEnvio } from '@/lib/filaRespostas'
import { api, type Schemas } from './client'

export type Auditoria = Schemas['AuditoriaResponse']
export type AuditoriaDados = Schemas['AuditoriaRequest']
export type SecaoAuditoria = Schemas['AuditoriaSecaoResponse']
export type ItemAuditoria = Schemas['AuditoriaItemResponse']

const chaveDetalhe = (id: string | undefined) => ['auditorias', 'detalhe', id]

export function useAuditoria(id: string | undefined) {
  return useQuery({
    queryKey: chaveDetalhe(id),
    queryFn: ({ signal }) => api.get<Auditoria>(`/auditorias/${id}`, { signal }),
    enabled: !!id,
  })
}

export type AuditoriaResumo = Schemas['AuditoriaResumoResponse']
export type StatusAuditoria = NonNullable<Auditoria['status']>

const TAMANHO_PAGINA = 20

export interface FiltroAuditorias {
  status: StatusAuditoria
  clienteId?: string
  /** aaaa-mm-dd: auditorias com `dataAuditoria` a partir deste dia. */
  dataInicio?: string
}

/** Lista paginada; a API já ordena por data (mais recentes primeiro). */
export function useAuditorias(filtro: FiltroAuditorias) {
  return useInfiniteQuery({
    queryKey: ['auditorias', 'lista', filtro.status, filtro.clienteId ?? null, filtro.dataInicio ?? null],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      api.get<Schemas['PagedModelAuditoriaResumoResponse']>('/auditorias', {
        params: {
          status: filtro.status,
          clienteId: filtro.clienteId,
          dataInicio: filtro.dataInicio,
          page: pageParam,
          size: TAMANHO_PAGINA,
        },
        signal,
      }),
    getNextPageParam: ({ page }) => (page.number + 1 < page.totalPages ? page.number + 1 : undefined),
    placeholderData: keepPreviousData,
  })
}

/** As mais recentes de um status (painel inicial). Mesma chave-base da lista: é atualizada junto. */
export function useAuditoriasRecentes(status: StatusAuditoria, quantidade = 5) {
  return useQuery({
    queryKey: ['auditorias', 'lista', 'recentes', status, quantidade],
    queryFn: ({ signal }) =>
      api.get<Schemas['PagedModelAuditoriaResumoResponse']>('/auditorias', {
        params: { status, page: 0, size: quantidade },
        signal,
      }),
  })
}

export function useExcluirAuditoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/auditorias/${id}`),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: chaveDetalhe(id) })
      return queryClient.invalidateQueries({ queryKey: ['auditorias', 'lista'] })
    },
  })
}

export function useCriarAuditoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: AuditoriaDados) => api.post<Auditoria>('/auditorias', dados),
    onSuccess: (auditoria) => {
      toast.success('Auditoria iniciada.')
      // A auditoria criada já vem completa: o detalhe não precisa de nova busca.
      queryClient.setQueryData(chaveDetalhe(auditoria.id), auditoria)
      return queryClient.invalidateQueries({ queryKey: ['auditorias', 'lista'] })
    },
  })
}

/** Salvamento automático das respostas: devolve a fila e o estado para o indicador. */
export function useSalvamentoRespostas(id: string) {
  const queryClient = useQueryClient()
  const [fila] = useState(
    () =>
      new FilaRespostas(async (respostas: RespostaEnvio[]) => {
        const auditoria = await api.put<Auditoria>(`/auditorias/${id}/respostas`, { respostas })
        queryClient.setQueryData(chaveDetalhe(id), auditoria)
        // O progresso do cartão do histórico vem da lista: marca como desatualizada (recarrega ao voltar para lá).
        void queryClient.invalidateQueries({ queryKey: ['auditorias', 'lista'] })
      }),
  )
  const estado = useSyncExternalStore(fila.assinar, fila.obterEstado)

  useEffect(() => {
    const aoVoltarRede = () => fila.tentarDeNovo()
    window.addEventListener('online', aoVoltarRede)
    return () => {
      window.removeEventListener('online', aoVoltarRede)
      fila.parar()
    }
  }, [fila])

  return { fila, estado }
}

/** PDF do relatório (só auditoria finalizada). Baixado com o token, como blob. */
export function useRelatorioPdf(id: string) {
  return useMutation({
    mutationFn: () => api.arquivo(`/auditorias/${id}/relatorio.pdf`),
    onSuccess: () => toast.success('PDF gerado.'),
  })
}

export function useReabrirAuditoria(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<Auditoria>(`/auditorias/${id}/reabrir`),
    onSuccess: (auditoria) => {
      toast.success('Auditoria reaberta.')
      queryClient.setQueryData(chaveDetalhe(id), auditoria)
      return queryClient.invalidateQueries({ queryKey: ['auditorias', 'lista'] })
    },
  })
}

export function useFinalizarAuditoria(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<Auditoria>(`/auditorias/${id}/finalizar`),
    onSuccess: (auditoria) => {
      toast.success('Auditoria finalizada.')
      queryClient.setQueryData(chaveDetalhe(id), auditoria)
      return queryClient.invalidateQueries({ queryKey: ['auditorias', 'lista'] })
    },
  })
}
