import { useQuery } from '@tanstack/react-query'
import { fetchContratoCatalogo } from '../services/contratoCatalogo'
import type { ContratoCatalogo } from '../types/processoContrato.types'
import { useGlobalFilters } from './useGlobalFilters'

export function useContratoCatalogo(): {
  data: ContratoCatalogo[]
  isLoading: boolean
  isError: boolean
} {
  const [filters] = useGlobalFilters()
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['contrato_catalogo', filters.entidades],
    queryFn: () => fetchContratoCatalogo(filters.entidades ?? undefined),
    staleTime: 5 * 60 * 1000,
  })
  return { data, isLoading, isError }
}
