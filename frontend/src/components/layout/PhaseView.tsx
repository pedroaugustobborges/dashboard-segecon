// Generic phase page layout. Used by all 9 phase views (Fase 1 Análise, Fase 1 Aprovação, Fase 2–8).
// Handles data fetching, metrics computation, and standard layout.
// Phase-specific sections are injected via `extraIndicators` and `gapIndicators` props.

import { useMemo } from 'react'
import { Box, Grid, Card, CardContent, Typography } from '@mui/material'
import { GlobalFilterBar } from '../filters/GlobalFilterBar'
import { KpiCard } from '../charts/KpiCard'
import { DistributionChart } from '../charts/DistributionChart'
import { PriorityPieChart } from '../charts/PriorityPieChart'
import { ProcessDetailTable } from '../tables/ProcessDetailTable'
import { useProcessos } from '../../hooks/useProcessoContrato'
import { useFase1Analise } from '../../hooks/useFase1AnaliseContrato'
import { useGlobalFilters } from '../../hooks/useGlobalFilters'
import { usePhaseMetrics } from '../../hooks/usePhaseMetrics'
import { useProcessoTableRows } from '../../features/processos/useProcessoTableRows'
import { solicitacaoColumns } from '../../features/processos/solicitacaoColumns'
import { phaseColors, prioridadeColors } from '../../theme/theme'
import { strings } from '../../i18n/strings.pt-BR'
import type { FaseKey } from '../../types/processoContrato.types'
import type { Fase1AnaliseContrato } from '../../types/processoContrato.types'
import type { ProcessoRow } from '../../features/processos/useProcessoTableRows'
import type { ColumnDef } from '../tables/ProcessDetailTable'

interface PhaseViewProps {
  phaseKey: FaseKey
  title: string
  subtitle?: string
  // Optional: the DB column to use for status distribution donut
  statusColumn?: keyof import('../../types/processoContrato.types').ProcessoContrato
  statusColumnLabel?: string
  // Whether to show the responsável distribution chart (only Fase 1 Análise)
  showResponsavelChart?: boolean
  // Phase-specific extra JSX rendered after standard charts (before detail table)
  extraIndicators?: (fase1Records: Fase1AnaliseContrato[]) => React.ReactNode
  // Gap indicators rendered in the gaps row
  gapIndicators?: React.ReactNode
  // Override which processes appear in the detail table (default: currentlyInPhase)
  tableFilterKey?: 'currentlyInPhase' | 'enteredPhase'
}

function Section({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {title && <Typography variant="subtitle2" fontWeight={600} mb={2}>{title}</Typography>}
        {children}
      </CardContent>
    </Card>
  )
}

export function PhaseView({
  phaseKey, title, subtitle, statusColumn, statusColumnLabel,
  showResponsavelChart, extraIndicators, gapIndicators,
  tableFilterKey = 'currentlyInPhase',
}: PhaseViewProps) {
  const [filters] = useGlobalFilters()
  const phaseColor = phaseColors[phaseKey] ?? '#00897b'

  // Fetch all processos (include cancelled — metrics handle exclusion)
  const { data: processos = [], isLoading } = useProcessos({ ...filters, incluirCancelados: true })

  // Fetch fase1 records for responsável + revision chart
  const scIds = useMemo(
    () => processos.map((p) => p.id_controle_sc).filter((id): id is number => id !== null),
    [processos],
  )
  const { data: fase1Records = [], isLoading: fase1Loading } = useFase1Analise(scIds)

  const loading = isLoading || fase1Loading

  const metrics = usePhaseMetrics(processos, phaseKey, statusColumn)

  // Table rows — enriched with phase/responsável join
  const allRows = useProcessoTableRows(processos, fase1Records)
  const tableRows = useMemo(() => {
    const targetIds = new Set(metrics[tableFilterKey].map((p) => p.id))
    return allRows.filter((r) => targetIds.has(r.id))
  }, [allRows, metrics, tableFilterKey])

  // Responsável distribution (Fase 1 Análise only — from fase1_analise_contrato.nome)
  const responsavelData = useMemo(() => {
    if (!showResponsavelChart) return []
    const counts: Record<string, number> = {}
    for (const rec of fase1Records) {
      const nome = rec.nome ?? strings.status.naoAtribuido
      counts[nome] = (counts[nome] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [fase1Records, showResponsavelChart])

  return (
    <Box>
      <GlobalFilterBar />
      <Box sx={{ px: 1.5, py: 1.5 }}>
        {/* Header */}
        <Box sx={{ mb: 2, borderLeft: `4px solid ${phaseColor}`, pl: 1.5 }}>
          <Typography variant="h5" fontWeight={700}>{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary" mt={0.5}>{subtitle}</Typography>}
        </Box>

        {/* KPI row */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              label={strings.faseIndicators.atualmenteNaFase}
              value={metrics.currentlyInPhaseCount}
              color={phaseColor}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              label={strings.faseIndicators.mediaLeadTime}
              value={metrics.avgLeadTimeDays}
              unit="dias"
              color={phaseColor}
              loading={loading}
              tooltip="Média de dias nos processos já concluídos nesta fase"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              label={strings.faseIndicators.medianaLeadTime}
              value={metrics.medianLeadTimeDays}
              unit="dias"
              color={phaseColor}
              loading={loading}
              tooltip="Mediana de dias nos processos já concluídos nesta fase"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              label={strings.faseIndicators.entraram}
              value={metrics.enteredPhaseCount}
              color={phaseColor}
              loading={loading}
              tooltip="Total de processos que já passaram por esta fase (incluindo concluídos)"
            />
          </Grid>
        </Grid>

        {/* Charts row: lead time by prioridade + status donut */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={statusColumn ? 8 : 12}>
            <Section title={strings.faseIndicators.leadTimePorPrioridade}>
              <DistributionChart
                title=""
                data={metrics.leadTimeByPrioridade}
                loading={loading}
                horizontal={false}
                colorMap={prioridadeColors}
                height={220}
              />
            </Section>
          </Grid>
          {statusColumn && (
            <Grid item xs={12} md={4}>
              <Section>
                <PriorityPieChart
                  title={statusColumnLabel ?? strings.faseIndicators.distribuicaoPorStatus}
                  data={metrics.byStatus}
                  loading={loading}
                  height={220}
                  innerRadius={44}
                />
              </Section>
            </Grid>
          )}
        </Grid>

        {/* Responsável chart (Fase 1 Análise only) */}
        {showResponsavelChart && (
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12}>
              <Section title={strings.faseIndicators.distribuicaoPorResponsavel}>
                <DistributionChart
                  title=""
                  data={responsavelData}
                  loading={loading}
                  horizontal={true}
                  height={280}
                  maxItems={15}
                />
              </Section>
            </Grid>
          </Grid>
        )}

        {/* Phase-specific extra sections (e.g. RevisionsChart) */}
        {extraIndicators && (
          <Box mb={3}>
            {extraIndicators(fase1Records)}
          </Box>
        )}

        {/* Gap indicators */}
        {gapIndicators && (
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12}>{gapIndicators}</Grid>
          </Grid>
        )}

        {/* Prioridade distribution */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={5}>
            <Section>
              <PriorityPieChart
                title={strings.faseIndicators.distribuicaoPorPrioridade}
                data={metrics.byPrioridade}
                loading={loading}
                colorMap={prioridadeColors}
                height={220}
                innerRadius={44}
              />
            </Section>
          </Grid>
        </Grid>

        {/* Detail table */}
        <Section title={strings.faseIndicators.detalhamento}>
          <ProcessDetailTable
            columns={solicitacaoColumns as unknown as ColumnDef<Record<string, unknown>>[]}
            rows={tableRows as unknown as Record<string, unknown>[]}
            loading={loading}
            searchFields={['entidade', 'solicitacao_numero', 'solicitacao_departamento', 'responsavel']}
            filename={`segecon_fase${phaseKey}`}
            rowKey={(r) => (r as unknown as ProcessoRow).id}
          />
        </Section>
      </Box>
    </Box>
  )
}
