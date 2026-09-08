import { useQuery } from '@tanstack/react-query'
import { fetchProcessos, fetchDistinctEntidades, type ProcessoContratoFilters } from '../services/processoContrato'

export function useProcessos(filters: ProcessoContratoFilters = {}) {
  return useQuery({
    queryKey: ['processos', filters],
    queryFn: () => fetchProcessos(filters),
  })
}

export function useDistinctEntidades() {
  return useQuery({
    queryKey: ['entidades'],
    queryFn: fetchDistinctEntidades,
    staleTime: 30 * 60 * 1000, // 30 min — entidade list changes rarely
  })
}
