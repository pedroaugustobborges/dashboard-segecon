// Computes lead time statistics (in calendar days) per phase from a list of ProcessoContrato rows.
// Separates completed durations from in-progress (null fim) ones — they are NOT mixed in averages.

import { useMemo } from 'react'
import { computeLeadTimeDays } from './useDerivedStatus'
import type { ProcessoContrato, FaseKey } from '../types/processoContrato.types'
import type { LeadTimeData } from '../types/indicadores.types'
import { strings } from '../i18n/strings.pt-BR'

const PHASE_META: Array<{
  phase: FaseKey
  label: string
  inicio: keyof ProcessoContrato
  fim: keyof ProcessoContrato
}> = [
  { phase: 1, label: strings.phases.fase1Short, inicio: 'fase1_data_inicio_sc',                        fim: 'fase1_data_fim_sc' },
  { phase: 2, label: strings.phases.fase2Short, inicio: 'fase2_data_inicio_prep_cotacao',              fim: 'fase2_data_fim_prep_cotacao' },
  { phase: 3, label: strings.phases.fase3Short, inicio: 'fase3_data_inicio_cotacao',                   fim: 'fase3_data_fim_cotacao' },
  { phase: 4, label: strings.phases.fase4Short, inicio: 'fase4_data_inicio_analise_cotacao',           fim: 'fase4_data_fim_analise_cotacao' },
  { phase: 5, label: strings.phases.fase5Short, inicio: 'fase5_data_inicio_aprovacao_contrato',        fim: 'fase5_data_fim_aprovacao_contrato' },
  { phase: 6, label: strings.phases.fase6Short, inicio: 'fase6_data_inicio_assinatura_contrato',       fim: 'fase6_data_fim_assinatura_contrato' },
  { phase: 7, label: strings.phases.fase7Short, inicio: 'fase7_data_inicio_validacao_anexos_contrato', fim: 'fase7_data_fim_validacao_anexos_contrato' },
  { phase: 8, label: strings.phases.fase8Short, inicio: 'fase8_data_inicio_publicacao_contrato',       fim: 'fase8_data_fim_publicacao_contrato' },
]

function median(sorted: number[]): number {
  if (!sorted.length) return 0
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

export function useLeadTime(processos: ProcessoContrato[]): LeadTimeData[] {
  return useMemo(() => {
    return PHASE_META.map(({ phase, label, inicio, fim }) => {
      const completedDays: number[] = []
      let inProgressCount = 0

      for (const p of processos) {
        const startVal = p[inicio] as string | null
        const endVal   = p[fim]   as string | null
        if (!startVal) continue

        if (endVal) {
          const days = computeLeadTimeDays(startVal, endVal)
          if (days !== null && days >= 0) completedDays.push(days)
        } else {
          inProgressCount++
        }
      }

      completedDays.sort((a, b) => a - b)
      const mean = completedDays.length
        ? completedDays.reduce((s, v) => s + v, 0) / completedDays.length
        : 0

      return {
        phase,
        phaseName: label,
        min:            completedDays[0] ?? 0,
        q1:             quantile(completedDays, 0.25),
        median:         median(completedDays),
        q3:             quantile(completedDays, 0.75),
        max:            completedDays[completedDays.length - 1] ?? 0,
        mean:           Math.round(mean * 10) / 10,
        inProgressCount,
      }
    })
  }, [processos])
}
