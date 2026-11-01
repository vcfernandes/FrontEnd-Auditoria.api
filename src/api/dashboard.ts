import { useQuery } from '@tanstack/react-query'
import { api, type Schemas } from './client'

export type Dashboard = Schemas['DashboardResponse']

/** Números do painel inicial: em andamento, finalizadas no mês, clientes ativos e os últimos 90 dias. */
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: ({ signal }) => api.get<Dashboard>('/dashboard', { signal }),
    // Depende de clientes e de auditorias: em vez de invalidar em cada mutação, busca de novo
    // sempre que o painel abre (é uma consulta leve).
    staleTime: 0,
  })
}
