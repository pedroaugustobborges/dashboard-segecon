import { useQuery } from '@tanstack/react-query'
import { fetchFase1AnaliseReservaByScIds } from '../services/processoContrato'

export function useFase1AnaliseReserva(idControleScList: number[]) {
  return useQuery({
    queryKey: ['fase1-analise-reserva', idControleScList],
    queryFn: () => fetchFase1AnaliseReservaByScIds(idControleScList),
    enabled: idControleScList.length > 0,
  })
}
