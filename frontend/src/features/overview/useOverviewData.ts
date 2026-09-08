// Derives all overview dashboard metrics from the raw processo_contrato rows.
// All computation is client-side (dataset is small enough).
// NO business logic in the view component — this hook is the single source of truth.

import { useMemo } from 'react'
import { derivePhaseInfo } from '../../hooks/useDerivedStatus'
import { prioridadeColors } from '../../theme/theme'
import type { ProcessoContrato, FaseKey } from '../../types/processoContrato.types'
import type { DistributionItem } from '../../types/indicadores.types'
import { strings } from '../../i18n/strings.pt-BR'

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

    // By entidade
    const porUnidade = countBy(
      processos.filter((p) => !p.solicitacao_cancelada),
      (p) => p.entidade,
    )

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
      porPrioridade,
      topDepartamentos,
      analiseContratoItems,
      aprovacaoItems,
    }
  }, [processos])
}
