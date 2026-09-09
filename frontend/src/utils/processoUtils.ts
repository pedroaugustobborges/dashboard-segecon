// Pure utilities shared across components that deal with ProcessoContrato data.
// No React imports — safe to use in hooks, components, and services alike.

import type { ProcessoContrato, FaseKey } from '../types/processoContrato.types'
import { strings } from '../i18n/strings.pt-BR'

// ── Lead-time helpers ─────────────────────────────────────────────────────────

/** Phase fim-date fields ordered from last to first — used to find the latest completed phase. */
export const FIM_FIELDS: Array<keyof ProcessoContrato> = [
  'fase8_data_fim_publicacao_contrato',
  'fase7_data_fim_validacao_anexos_contrato',
  'fase6_data_fim_assinatura_contrato',
  'fase5_data_fim_aprovacao_contrato',
  'fase4_data_fim_analise_cotacao',
  'fase3_data_fim_cotacao',
  'fase2_data_fim_prep_cotacao',
  'fase1_data_fim_sc',
]

/**
 * Total process lead time in days: fase1_data_inicio_sc → latest non-null phase fim.
 * Returns null when the process has no start date or no completed phase yet.
 */
export function totalLeadTimeDays(p: ProcessoContrato): number | null {
  const start = p.fase1_data_inicio_sc
  if (!start) return null
  let latestFim: string | null = null
  for (const field of FIM_FIELDS) {
    const v = p[field] as string | null
    if (v) { latestFim = v; break }
  }
  if (!latestFim) return null
  return Math.round(
    ((new Date(latestFim).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) * 10,
  ) / 10
}

// ── Phase label map ───────────────────────────────────────────────────────────

export const PHASE_LABELS: Record<FaseKey, string> = {
  1: strings.phases.fase1Short,
  2: strings.phases.fase2Short,
  3: strings.phases.fase3Short,
  4: strings.phases.fase4Short,
  5: strings.phases.fase5Short,
  6: strings.phases.fase6Short,
  7: strings.phases.fase7Short,
  8: strings.phases.fase8Short,
}

// ── Formatting ────────────────────────────────────────────────────────────────

export function fmtDate(s: string | null): string {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
