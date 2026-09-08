// Builds enriched rows for the process detail table by joining processos with
// fase1_analise_contrato (for responsável) and deriving current phase + days in phase.

import { useMemo } from 'react'
import { derivePhaseInfo, computeLeadTimeDays } from '../../hooks/useDerivedStatus'
import { useResponsavelMap } from '../../hooks/useResponsavelMap'
import { prioridadeColors, phaseColors } from '../../theme/theme'
import { strings } from '../../i18n/strings.pt-BR'
import type { ProcessoContrato, Fase1AnaliseContrato, FaseKey } from '../../types/processoContrato.types'

const PHASE_INICIO: Record<FaseKey, keyof ProcessoContrato> = {
  1: 'fase1_data_inicio_sc',
  2: 'fase2_data_inicio_prep_cotacao',
  3: 'fase3_data_inicio_cotacao',
  4: 'fase4_data_inicio_analise_cotacao',
  5: 'fase5_data_inicio_aprovacao_contrato',
  6: 'fase6_data_inicio_assinatura_contrato',
  7: 'fase7_data_inicio_validacao_anexos_contrato',
  8: 'fase8_data_inicio_publicacao_contrato',
}

export interface ProcessoRow {
  id: number
  entidade: string
  solicitacao_numero: string
  faseAtual: FaseKey | null
  faseLabel: string
  faseColor: string
  diasNaFase: number | null
  solicitacao_tipo: string
  prioridadeColor: string
  responsavel: string | null       // null = Gap 2 (not available for this phase)
  catalogo_precos_codigo: string | null
  catalogo_precos_numero_contrato: string | null
  solicitacao_departamento: string | null
  solicitacao_valor_estimado: number | null
  valorFormatted: string
  cotacao_status: string | null
  fase1_solicitante: string | null
  status: 'in_progress' | 'completed' | 'cancelled' | 'pending'
}

const FASE_LABELS: Record<FaseKey, string> = {
  1: strings.phases.fase1Short,
  2: strings.phases.fase2Short,
  3: strings.phases.fase3Short,
  4: strings.phases.fase4Short,
  5: strings.phases.fase5Short,
  6: strings.phases.fase6Short,
  7: strings.phases.fase7Short,
  8: strings.phases.fase8Short,
}

const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export function useProcessoTableRows(
  processos: ProcessoContrato[],
  fase1Records: Fase1AnaliseContrato[],
): ProcessoRow[] {
  const responsavelMap = useResponsavelMap(fase1Records)

  return useMemo(() => {
    return processos.map((p) => {
      const { currentPhase, status } = derivePhaseInfo(p)

      // Days in current phase
      let diasNaFase: number | null = null
      if (currentPhase && status === 'in_progress') {
        const inicioKey = PHASE_INICIO[currentPhase]
        const inicio = p[inicioKey] as string | null
        diasNaFase = computeLeadTimeDays(inicio, null) // null fim = elapsed to now
      }

      // Responsável: only available for Fase 1 (fase1_analise_contrato.nome)
      // Gap 2 for all other phases — represented as null
      const responsavel = currentPhase === 1
        ? (p.id_controle_sc !== null ? (responsavelMap.get(p.id_controle_sc) ?? null) : null)
        : null

      const faseAtual = currentPhase
      const faseLabel = faseAtual
        ? FASE_LABELS[faseAtual]
        : (status === 'completed' ? 'Concluído' : status === 'cancelled' ? 'Cancelado' : '—')
      const faseColor = faseAtual
        ? (phaseColors[faseAtual] ?? '#757575')
        : (status === 'completed' ? '#388e3c' : '#757575')

      return {
        id: p.id,
        entidade:                          p.entidade ?? '',
        solicitacao_numero:                p.solicitacao_numero ?? '',
        faseAtual,
        faseLabel,
        faseColor,
        diasNaFase,
        solicitacao_tipo:                  p.solicitacao_tipo ?? '',
        prioridadeColor:                   prioridadeColors[p.solicitacao_tipo ?? ''] ?? '#757575',
        responsavel,
        catalogo_precos_codigo:            p.catalogo_precos_codigo,
        catalogo_precos_numero_contrato:   p.catalogo_precos_numero_contrato,
        solicitacao_departamento:          p.solicitacao_departamento,
        solicitacao_valor_estimado:        p.solicitacao_valor_estimado,
        valorFormatted:                    p.solicitacao_valor_estimado ? brlFormatter.format(p.solicitacao_valor_estimado) : '—',
        cotacao_status:                    p.cotacao_status,
        fase1_solicitante:                 p.fase1_solicitante,
        status,
      }
    })
  }, [processos, responsavelMap])
}
