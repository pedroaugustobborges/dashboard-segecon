// Reads and writes global filter state via URL query params (React Router).
// All filter changes reflect in the URL so views can be shared via link.

import { useSearchParams } from 'react-router-dom'
import type { ProcessoContratoFilters } from '../services/processoContrato'

export function useGlobalFilters(): [ProcessoContratoFilters, (next: ProcessoContratoFilters) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: ProcessoContratoFilters = {
    entidades: searchParams.get('entidades')?.split(',').filter(Boolean) ?? [],
    solicitacao_tipo: searchParams.get('prioridade')?.split(',').filter(Boolean) ?? [],
    dataInicio: searchParams.get('de') ?? undefined,
    dataFim: searchParams.get('ate') ?? undefined,
    incluirCancelados: searchParams.get('cancelados') === '1',
    departamentos: searchParams.get('departamentos')?.split(',').filter(Boolean) ?? [],
  }

  function setFilters(next: ProcessoContratoFilters) {
    const params: Record<string, string> = {}
    if (next.entidades?.length) params.entidades = next.entidades.join(',')
    if (next.solicitacao_tipo?.length) params.prioridade = next.solicitacao_tipo.join(',')
    if (next.dataInicio) params.de = next.dataInicio
    if (next.dataFim) params.ate = next.dataFim
    if (next.incluirCancelados) params.cancelados = '1'
    if (next.departamentos?.length) params.departamentos = next.departamentos.join(',')
    setSearchParams(params)
  }

  return [filters, setFilters]
}
