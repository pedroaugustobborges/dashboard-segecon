// Computes all standard per-phase metrics from a ProcessoContrato array.
// "Currently in phase" = has fase{N}_data_inicio AND fase{N}_data_fim is null AND not cancelled.

import { useMemo } from 'react'
import { computeLeadTimeDays } from './useDerivedStatus'
import { prioridadeColors } from '../theme/theme'
import type { ProcessoContrato, FaseKey } from '../types/processoContrato.types'
import type { DistributionItem } from '../types/indicadores.types'

const PHASE_COLS: Record<FaseKey, { inicio: keyof ProcessoContrato; fim: keyof ProcessoContrato }> = {
  1: { inicio: 'fase1_data_inicio_sc',                        fim: 'fase1_data_fim_sc' },
  2: { inicio: 'fase2_data_inicio_prep_cotacao',              fim: 'fase2_data_fim_prep_cotacao' },
  3: { inicio: 'fase3_data_inicio_cotacao',                   fim: 'fase3_data_fim_cotacao' },
  4: { inicio: 'fase4_data_inicio_analise_cotacao',           fim: 'fase4_data_fim_analise_cotacao' },
  5: { inicio: 'fase5_data_inicio_aprovacao_contrato',        fim: 'fase5_data_fim_aprovacao_contrato' },
  6: { inicio: 'fase6_data_inicio_assinatura_contrato',       fim: 'fase6_data_fim_assinatura_contrato' },
  7: { inicio: 'fase7_data_inicio_validacao_anexos_contrato', fim: 'fase7_data_fim_validacao_anexos_contrato' },
  8: { inicio: 'fase8_data_inicio_publicacao_contrato',       fim: 'fase8_data_fim_publicacao_contrato' },
}

function mean(arr: number[]): number {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0
}

function median(sorted: number[]): number {
  if (!sorted.length) return 0
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export interface PhaseMetrics {
  // Processes currently in phase (not yet moved to next phase)
  currentlyInPhase: ProcessoContrato[]
  currentlyInPhaseCount: number
  // Processes that have entered phase (all time, including completed)
  enteredPhase: ProcessoContrato[]
  enteredPhaseCount: number
  // Lead time stats (from completed processes only)
  avgLeadTimeDays: number
  medianLeadTimeDays: number
  // Distribution by prioridade (currently in phase)
  byPrioridade: DistributionItem[]
  // Lead time by prioridade (avg, from completed)
  leadTimeByPrioridade: DistributionItem[]
  // Distribution by an arbitrary status column (e.g. fase1_status_analise_contrato)
  byStatus: DistributionItem[]
}

export function usePhaseMetrics(
  processos: ProcessoContrato[],
  phaseKey: FaseKey,
  statusColumn?: keyof ProcessoContrato,
): PhaseMetrics {
  return useMemo(() => {
    const { inicio, fim } = PHASE_COLS[phaseKey]

    const notCancelled = processos.filter((p) => !p.solicitacao_cancelada)

    // All processes that entered this phase
    const enteredPhase = notCancelled.filter((p) => !!p[inicio])

    // Processes still in this phase (fim is null)
    const currentlyInPhase = enteredPhase.filter((p) => !p[fim])

    // Lead times from completed processes
    const completedDays = enteredPhase
      .filter((p) => !!p[fim])
      .map((p) => computeLeadTimeDays(p[inicio] as string | null, p[fim] as string | null))
      .filter((d): d is number => d !== null && d >= 0)
      .sort((a, b) => a - b)

    // By prioridade (currently in phase)
    const prioridadeCount: Record<string, number> = {}
    for (const p of currentlyInPhase) {
      const k = p.solicitacao_tipo ?? 'N/A'
      prioridadeCount[k] = (prioridadeCount[k] ?? 0) + 1
    }
    const byPrioridade: DistributionItem[] = Object.entries(prioridadeCount)
      .map(([label, value]) => ({ label, value, color: prioridadeColors[label] }))
      .sort((a, b) => b.value - a.value)

    // Lead time by prioridade (avg days, from completed processes)
    const ltByPrio: Record<string, number[]> = {}
    for (const p of enteredPhase.filter((x) => !!x[fim])) {
      const key = p.solicitacao_tipo ?? 'N/A'
      const days = computeLeadTimeDays(p[inicio] as string | null, p[fim] as string | null)
      if (days !== null && days >= 0) {
        ltByPrio[key] = [...(ltByPrio[key] ?? []), days]
      }
    }
    const leadTimeByPrioridade: DistributionItem[] = Object.entries(ltByPrio)
      .map(([label, days]) => ({
        label,
        value: Math.round(mean(days) * 10) / 10,
        color: prioridadeColors[label],
      }))
      .sort((a, b) => b.value - a.value)

    // By status column (if provided)
    const statusCount: Record<string, number> = {}
    if (statusColumn) {
      for (const p of notCancelled.filter((x) => !!x[inicio])) {
        const k = (p[statusColumn] as string | null) ?? 'N/A'
        statusCount[k] = (statusCount[k] ?? 0) + 1
      }
    }
    const byStatus: DistributionItem[] = Object.entries(statusCount)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)

    return {
      currentlyInPhase,
      currentlyInPhaseCount: currentlyInPhase.length,
      enteredPhase,
      enteredPhaseCount: enteredPhase.length,
      avgLeadTimeDays: Math.round(mean(completedDays) * 10) / 10,
      medianLeadTimeDays: Math.round(median(completedDays) * 10) / 10,
      byPrioridade,
      leadTimeByPrioridade,
      byStatus,
    }
  }, [processos, phaseKey, statusColumn])
}
