import { useQuery } from '@tanstack/react-query'
import { api, type Schemas } from './client'

export type ModeloChecklist = Schemas['ChecklistResumoResponse']

/** Modelos da organização + biblioteca (RDC 216/2004 etc.). */
export function useChecklists() {
  return useQuery({
    queryKey: ['checklists', 'lista'],
    queryFn: ({ signal }) => api.get<ModeloChecklist[]>('/checklists', { signal }),
  })
}
