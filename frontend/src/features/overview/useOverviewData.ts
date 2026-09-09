// Derives all overview dashboard metrics from the raw processo_contrato rows.
// All computation is client-side (dataset is small enough).
// NO business logic in the view component — this hook is the single source of truth.

import { useMemo } from 'react'
import { derivePhaseInfo } from '../../hooks/useDerivedStatus'
import { prioridadeColors } from '../../theme/theme'
import { totalLeadTimeDays, PHASE_LABELS } from '../../utils/processoUtils'
import type { ProcessoContrato, FaseKey } from '../../types/processoContrato.types'
import type { DistributionItem } from '../../types/indicadores.types'

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

    // All departments (sorted by count desc)
    const topDepartamentos = countBy(
      processos.filter((p) => !p.solicitacao_cancelada),
      (p) => p.solicitacao_departamento,
    )

    // Lead time by department (avg + median total days)
    const ltByDept: Record<string, number[]> = {}
    for (const p of processos) {
      if (p.solicitacao_cancelada) continue
      const dept = p.solicitacao_departamento ?? 'N/A'
      const days = totalLeadTimeDays(p)
      if (days === null || days < 0) continue
      if (!ltByDept[dept]) ltByDept[dept] = []
      ltByDept[dept].push(days)
    }
    const leadTimeByDepartamento: DistributionItem[] = Object.entries(ltByDept)
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

    // Drill-down maps: bar label → list of processes (for click-through drawers)
    const processosByUnidade = new Map<string, ProcessoContrato[]>()
    const processosByPhaseLabel = new Map<string, ProcessoContrato[]>()
    for (const p of processos) {
      if (p.solicitacao_cancelada) continue
      // by unit
      const u = p.entidade ?? 'N/A'
      if (!processosByUnidade.has(u)) processosByUnidade.set(u, [])
      processosByUnidade.get(u)!.push(p)
      // by current phase label (active only)
      const { currentPhase } = derivePhaseInfo(p)
      if (currentPhase !== null) {
        const label = PHASE_LABELS[currentPhase as FaseKey] ?? `Fase ${currentPhase}`
        if (!processosByPhaseLabel.has(label)) processosByPhaseLabel.set(label, [])
        processosByPhaseLabel.get(label)!.push(p)
      }
    }

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
      leadTimeByDepartamento,
      analiseContratoItems,
      aprovacaoItems,
      processosByUnidade,
      processosByPhaseLabel,
    }
  }, [processos])
}
