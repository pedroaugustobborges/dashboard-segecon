// Business rule 5.1: determine the current phase of a processo_contrato row.
// The current phase is the last faseN where data_inicio is filled and data_fim is null.
// Cancelled processes return status 'cancelled'.

import type { ProcessoContrato, FaseKey, DerivedPhaseInfo } from '../types/processoContrato.types'

const PHASE_COLUMNS: Array<{
  phase: FaseKey
  inicio: keyof ProcessoContrato
  fim: keyof ProcessoContrato
}> = [
  { phase: 1, inicio: 'fase1_data_inicio_sc',                        fim: 'fase1_data_fim_sc' },
  { phase: 2, inicio: 'fase2_data_inicio_prep_cotacao',              fim: 'fase2_data_fim_prep_cotacao' },
  { phase: 3, inicio: 'fase3_data_inicio_cotacao',                   fim: 'fase3_data_fim_cotacao' },
  { phase: 4, inicio: 'fase4_data_inicio_analise_cotacao',           fim: 'fase4_data_fim_analise_cotacao' },
  { phase: 5, inicio: 'fase5_data_inicio_aprovacao_contrato',        fim: 'fase5_data_fim_aprovacao_contrato' },
  { phase: 6, inicio: 'fase6_data_inicio_assinatura_contrato',       fim: 'fase6_data_fim_assinatura_contrato' },
  { phase: 7, inicio: 'fase7_data_inicio_validacao_anexos_contrato', fim: 'fase7_data_fim_validacao_anexos_contrato' },
  { phase: 8, inicio: 'fase8_data_inicio_publicacao_contrato',       fim: 'fase8_data_fim_publicacao_contrato' },
]

export function derivePhaseInfo(processo: ProcessoContrato): DerivedPhaseInfo {
  if (processo.solicitacao_cancelada) {
    return { currentPhase: null, status: 'cancelled' }
  }

  let currentPhase: FaseKey | null = null

  for (const { phase, inicio, fim } of PHASE_COLUMNS) {
    const hasInicio = !!processo[inicio]
    const hasFim = !!processo[fim]

    if (hasInicio && !hasFim) {
      currentPhase = phase
    }
  }

  // All phases completed
  if (currentPhase === null && processo.fase8_data_fim_publicacao_contrato) {
    return { currentPhase: 8, status: 'completed' }
  }

  return {
    currentPhase,
    status: currentPhase !== null ? 'in_progress' : 'pending',
  }
}

/** Compute lead time in days between two ISO timestamps. Returns null if either is missing. */
export function computeLeadTimeDays(inicio: string | null, fim: string | null): number | null {
  if (!inicio) return null
  const start = new Date(inicio).getTime()
  const end = fim ? new Date(fim).getTime() : Date.now()
  return Math.round((end - start) / (1000 * 60 * 60 * 24) * 10) / 10
}
