import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError, api, type Schemas } from './client'

export type ModeloChecklist = Schemas['ChecklistResumoResponse']
export type ModeloDetalhe = Schemas['ChecklistResponse']

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
