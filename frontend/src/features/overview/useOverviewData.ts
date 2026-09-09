// Derives all overview dashboard metrics from the raw processo_contrato rows.
// All computation is client-side (dataset is small enough).
// NO business logic in the view component — this hook is the single source of truth.

import { useMemo } from 'react'
import { derivePhaseInfo } from '../../hooks/useDerivedStatus'
import { prioridadeColors } from '../../theme/theme'
import type { ProcessoContrato, FaseKey } from '../../types/processoContrato.types'
import type { DistributionItem } from '../../types/indicadores.types'
import { strings } from '../../i18n/strings.pt-BR'

// Total process lead time: fase1_data_inicio_sc → latest non-null phase fim
const FIM_FIELDS: Array<keyof ProcessoContrato> = [
  'fase8_data_fim_publicacao_contrato',
  'fase7_data_fim_validacao_anexos_contrato',
  'fase6_data_fim_assinatura_contrato',
  'fase5_data_fim_aprovacao_contrato',
  'fase4_data_fim_analise_cotacao',
  'fase3_data_fim_cotacao',
  'fase2_data_fim_prep_cotacao',
  'fase1_data_fim_sc',
]

function totalLeadTimeDays(p: ProcessoContrato): number | null {
  const start = p.fase1_data_inicio_sc
  if (!start) return null
  let latestFim: string | null = null
  for (const field of FIM_FIELDS) {
    const v = p[field] as string | null
    if (v) { latestFim = v; break }
  }
  if (!latestFim) return null
  const days = (new Date(latestFim).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
  return Math.round(days * 10) / 10
}

function medianOf(sorted: number[]): number {
  if (!sorted.length) return 0
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function countBy<T>(arr: T[], key: (item: T) => string | null | undefined): DistributionItem[] {
  const counts: Record<string, number> = {}
  for (const item of arr) {
    const k = key(item) ?? 'N/A'
    counts[k] = (counts[k] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

const PHASE_LABELS: Record<FaseKey, string> = {
  1: strings.phases.fase1Short,
  2: strings.phases.fase2Short,
  3: strings.phases.fase3Short,
  4: strings.phases.fase4Short,
  5: strings.phases.fase5Short,
  6: strings.phases.fase6Short,
  7: strings.phases.fase7Short,
  8: strings.phases.fase8Short,
}

export function useOverviewData(processos: ProcessoContrato[]) {
  return useMemo(() => {
    let totalAtivos = 0
    let totalCancelados = 0
    let totalConcluidos = 0
    let valorTotal = 0

    const phaseCount: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 }
    const analiseContratoStatus: Record<string, number> = {}
    const aprovacaoStatus: Record<string, number> = {}

    for (const p of processos) {
      if (p.solicitacao_cancelada) {
        totalCancelados++
        continue
      }

      valorTotal += Number(p.solicitacao_valor_estimado ?? 0)

      const { currentPhase, status } = derivePhaseInfo(p)

      if (status === 'completed') {
        totalConcluidos++
      } else if (currentPhase !== null) {
        totalAtivos++
        phaseCount[currentPhase] = (phaseCount[currentPhase] ?? 0) + 1
      }

      // Fase 1 sub-status distributions (all non-cancelled)
      const analise = p.fase1_status_analise_contrato ?? 'N/A'
      analiseContratoStatus[analise] = (analiseContratoStatus[analise] ?? 0) + 1

      const aprov = p.fase1_status_aprovacao_solicitacao ?? 'N/A'
      aprovacaoStatus[aprov] = (aprovacaoStatus[aprov] ?? 0) + 1
    }

    // Phase distribution for funnel chart (active processes per phase)
    const phaseDistribution: DistributionItem[] = Object.entries(phaseCount)
      .map(([phase, value]) => ({
        label: PHASE_LABELS[Number(phase) as FaseKey] ?? `Fase ${phase}`,
        value,
      }))

    // By entidade (count)
    const porUnidade = countBy(
      processos.filter((p) => !p.solicitacao_cancelada),
      (p) => p.entidade,
    )

    // Lead time by entidade (avg + median total days)
    const ltByUnit: Record<string, number[]> = {}
    for (const p of processos) {
      if (p.solicitacao_cancelada) continue
      const entidade = p.entidade ?? 'N/A'
      const days = totalLeadTimeDays(p)
      if (days === null || days < 0) continue
      if (!ltByUnit[entidade]) ltByUnit[entidade] = []
      ltByUnit[entidade].push(days)
    }
    const leadTimeByUnidade: DistributionItem[] = Object.entries(ltByUnit)
      .map(([label, days]) => {
        days.sort((a, b) => a - b)
        const avg = days.reduce((s, v) => s + v, 0) / days.length
        return {
          label,
          value: Math.round(avg * 10) / 10,
          median: Math.round(medianOf(days) * 10) / 10,
        }
      })
      .sort((a, b) => b.value - a.value)

    // By prioridade
    const porPrioridade: DistributionItem[] = countBy(
      processos.filter((p) => !p.solicitacao_cancelada),
      (p) => p.solicitacao_tipo,
    ).map((item) => ({
      ...item,
      color: prioridadeColors[item.label],
    }))

    // Top departments
    const topDepartamentos = countBy(
      processos.filter((p) => !p.solicitacao_cancelada),
      (p) => p.solicitacao_departamento,
    ).slice(0, 10)

    // Status distributions for donuts
    const analiseContratoItems: DistributionItem[] = Object.entries(analiseContratoStatus)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)

    const aprovacaoItems: DistributionItem[] = Object.entries(aprovacaoStatus)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)

    const valorFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(valorTotal)

    return {
      totalAtivos,
      totalCancelados,
      totalConcluidos,
      valorTotal,
      valorFormatted,
      phaseDistribution,
      porUnidade,
      leadTimeByUnidade,
      porPrioridade,
      topDepartamentos,
      analiseContratoItems,
      aprovacaoItems,
    }
  }, [processos])
}
