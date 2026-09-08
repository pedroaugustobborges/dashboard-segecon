// For each id_controle_sc, returns the nome from the latest revision (max nro_revisao)
// in fase1_analise_contrato. Only available for Fase 1 / Análise Contrato (Gap 2 for others).

import { useMemo } from 'react'
import type { Fase1AnaliseContrato } from '../types/processoContrato.types'

export function useResponsavelMap(
  fase1Records: Fase1AnaliseContrato[],
): Map<number, string> {
  return useMemo(() => {
    const map = new Map<number, string>()

    // Group by id_controle_sc, keep the record with the highest nro_revisao
    const best = new Map<number, Fase1AnaliseContrato>()
    for (const rec of fase1Records) {
      if (rec.id_controle_sc === null) continue
      const existing = best.get(rec.id_controle_sc)
      if (!existing || (rec.nro_revisao ?? 0) > (existing.nro_revisao ?? 0)) {
        best.set(rec.id_controle_sc, rec)
      }
    }

    for (const [scId, rec] of best) {
      map.set(scId, rec.nome ?? '')
    }

    return map
  }, [fase1Records])
}
