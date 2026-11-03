import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError, api, type Schemas } from './client'

export type ModeloChecklist = Schemas['ChecklistResumoResponse']
export type ModeloDetalhe = Schemas['ChecklistResponse']
export type ModeloDados = Schemas['ChecklistRequest']

/** Modelos da organização + biblioteca (RDC 216/2004 etc.). */
export function useChecklists() {
  return useQuery({
    queryKey: ['checklists', 'lista'],
    queryFn: ({ signal }) => api.get<ModeloChecklist[]>('/checklists', { signal }),
  })
}

/** Modelo com seções e perguntas (só leitura). */
export function useChecklist(id: string | undefined) {
  return useQuery({
    queryKey: ['checklists', 'detalhe', id],
    queryFn: ({ signal }) => api.get<ModeloDetalhe>(`/checklists/${id}`, { signal }),
    enabled: !!id,
  })
}

/**
 * Modelo para o editor: sempre busca a versão atual ao abrir e não busca de novo durante a edição
 * (uma falha de rede numa nova busca não pode derrubar o formulário com alterações não salvas).
 */
export function useChecklistParaEditar(id: string | undefined) {
  return useQuery({
    queryKey: ['checklists', 'detalhe', id],
    queryFn: ({ signal }) => api.get<ModeloDetalhe>(`/checklists/${id}`, { signal }),
    enabled: !!id,
    refetchOnMount: 'always',
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })
}

/** Cria (sem id) ou substitui (com id) o modelo inteiro. */
export function useSalvarChecklist(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (corpo: ModeloDados) =>
      id ? api.put<ModeloDetalhe>(`/checklists/${id}`, corpo) : api.post<ModeloDetalhe>('/checklists', corpo),
    onSuccess: (salvo) => {
      toast.success(id ? 'Modelo salvo.' : 'Modelo criado em Meus modelos.')
      queryClient.setQueryData(['checklists', 'detalhe', salvo.id], salvo)
      return queryClient.invalidateQueries({ queryKey: ['checklists', 'lista'] })
    },
    // Aqui (e não no componente): com a sessão vencida o app volta ao login e o editor sai da tela antes do erro chegar.
    onError: (erro) => {
      if (erro instanceof ApiError && erro.status === 401) {
        toast.error(
          'Sua sessão venceu. O rascunho do modelo ficou guardado neste aparelho: entre de novo e abra o editor para recuperá-lo.',
          { duration: 15_000 },
        )
      }
    },
  })
}

/** A cópia vai para os modelos da organização. */
export function useDuplicarChecklist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<ModeloDetalhe>(`/checklists/${id}/duplicar`),
    onSuccess: () => {
      toast.success('Modelo duplicado em Meus modelos.')
      return queryClient.invalidateQueries({ queryKey: ['checklists', 'lista'] })
    },
    // Sem diálogo para mostrar o erro: vai num aviso. Erro de rede (status 0) já tem o aviso do cliente HTTP.
    onError: (erro) => {
      if (!(erro instanceof ApiError && erro.status === 0)) {
        toast.error(erro instanceof ApiError ? erro.message : 'Não foi possível duplicar o modelo.')
      }
    },
  })
}

export function useInativarChecklist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/checklists/${id}`),
    onSuccess: (_, id) => {
      toast.success('Modelo inativado.')
      queryClient.removeQueries({ queryKey: ['checklists', 'detalhe', id] })
      return queryClient.invalidateQueries({ queryKey: ['checklists', 'lista'] })
    },
  })
}
