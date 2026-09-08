import { useQuery } from '@tanstack/react-query'
import { fetchFase1AnaliseByScIds } from '../services/processoContrato'

export function useFase1Analise(idControleScList: number[]) {
  return useQuery({
    queryKey: ['fase1-analise', idControleScList],
    queryFn: () => fetchFase1AnaliseByScIds(idControleScList),
    enabled: idControleScList.length > 0,
  })
}
