import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Schemas } from './client'

export type Auditoria = Schemas['AuditoriaResponse']
export type AuditoriaDados = Schemas['AuditoriaRequest']

export function useAuditoria(id: string | undefined) {
  return useQuery({
    queryKey: ['auditorias', 'detalhe', id],
    queryFn: ({ signal }) => api.get<Auditoria>(`/auditorias/${id}`, { signal }),
    enabled: !!id,
  })
}

export function useCriarAuditoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: AuditoriaDados) => api.post<Auditoria>('/auditorias', dados),
    onSuccess: (auditoria) => {
      // A auditoria criada já vem completa: o detalhe não precisa de nova busca.
      queryClient.setQueryData(['auditorias', 'detalhe', auditoria.id], auditoria)
      return queryClient.invalidateQueries({ queryKey: ['auditorias', 'lista'] })
    },
  })
}
