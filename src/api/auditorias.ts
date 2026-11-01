import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useSyncExternalStore } from 'react'
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

/** Lista paginada; a API já ordena por data (mais recentes primeiro). */
export function useAuditorias(filtro: { status: StatusAuditoria; clienteId?: string }) {
  return useInfiniteQuery({
    queryKey: ['auditorias', 'lista', filtro.status, filtro.clienteId ?? null],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      api.get<Schemas['PagedModelAuditoriaResumoResponse']>('/auditorias', {
        params: { status: filtro.status, clienteId: filtro.clienteId, page: pageParam, size: TAMANHO_PAGINA },
        signal,
      }),
    getNextPageParam: ({ page }) => (page.number + 1 < page.totalPages ? page.number + 1 : undefined),
    placeholderData: keepPreviousData,
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

export function useFinalizarAuditoria(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<Auditoria>(`/auditorias/${id}/finalizar`),
    onSuccess: (auditoria) => {
      queryClient.setQueryData(chaveDetalhe(id), auditoria)
      return queryClient.invalidateQueries({ queryKey: ['auditorias', 'lista'] })
    },
  })
}
