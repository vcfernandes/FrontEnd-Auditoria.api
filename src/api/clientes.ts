import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Schemas } from './client'

export type Cliente = Schemas['ClienteResponse']
export type ClienteDados = Schemas['ClienteRequest']

const TAMANHO_PAGINA = 20

export function useClientes(nome: string) {
  return useInfiniteQuery({
    queryKey: ['clientes', 'lista', nome],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      api.get<Schemas['PagedModelClienteResponse']>('/clientes', {
        params: { nome, page: pageParam, size: TAMANHO_PAGINA },
        signal,
      }),
    getNextPageParam: ({ page }) => (page.number + 1 < page.totalPages ? page.number + 1 : undefined),
    // Mantém a lista anterior na tela enquanto a nova busca carrega.
    placeholderData: keepPreviousData,
  })
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['clientes', 'detalhe', id],
    queryFn: ({ signal }) => api.get<Cliente>(`/clientes/${id}`, { signal }),
    enabled: !!id,
  })
}

export function useCriarCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: ClienteDados) => api.post<Cliente>('/clientes', dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  })
}

export function useEditarCliente(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: ClienteDados) => api.put<Cliente>(`/clientes/${id}`, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  })
}

export function useInativarCliente(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(`/clientes/${id}`),
    onSuccess: () => {
      // O cliente some da lista; o detalhe antigo não deve mais ser buscado.
      queryClient.removeQueries({ queryKey: ['clientes', 'detalhe', id] })
      return queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}
