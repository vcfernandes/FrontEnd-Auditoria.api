import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type Schemas } from './client'

export type Cliente = Schemas['ClienteResponse']
export type ClienteDados = Schemas['ClienteRequest']
export type StatusCliente = 'ATIVO' | 'INATIVO' | 'TODOS'

const TAMANHO_PAGINA = 20

export function useClientes(nome: string, status: StatusCliente = 'ATIVO') {
  return useInfiniteQuery({
    queryKey: ['clientes', 'lista', nome, status],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      api.get<Schemas['PagedModelClienteResponse']>('/clientes', {
        params: { nome, status, page: pageParam, size: TAMANHO_PAGINA },
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
    onSuccess: () => {
      toast.success('Cliente cadastrado.')
      return queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

export function useEditarCliente(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: ClienteDados) => api.put<Cliente>(`/clientes/${id}`, dados),
    onSuccess: () => {
      toast.success('Cliente atualizado.')
      return queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

export function useInativarCliente(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(`/clientes/${id}`),
    onSuccess: () => {
      toast.success('Cliente inativado.')
      // O detalhe antigo não deve mais ser buscado (ex.: formulário aberto na aba Ativos).
      queryClient.removeQueries({ queryKey: ['clientes', 'detalhe', id] })
      return queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

export function useReativarCliente(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<Cliente>(`/clientes/${id}/reativar`),
    onSuccess: (cliente) => {
      toast.success('Cliente reativado.')
      queryClient.setQueryData(['clientes', 'detalhe', id], cliente)
      return queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}
