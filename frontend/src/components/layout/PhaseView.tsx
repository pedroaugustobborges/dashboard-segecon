// Generic phase page layout. Used by all 9 phase views (Fase 1 Análise, Fase 1 Aprovação, Fase 2–8).
// Handles data fetching, metrics computation, and standard layout.
// Phase-specific sections are injected via `extraIndicators` and `gapIndicators` props.

import { useMemo } from 'react'
import { Box, Grid, Card, CardContent, Typography, useTheme, alpha } from '@mui/material'
import { GlobalFilterBar }     from '../filters/GlobalFilterBar'
import { KpiCard }             from '../charts/KpiCard'
import { DistributionChart }   from '../charts/DistributionChart'
import { PriorityPieChart }    from '../charts/PriorityPieChart'
import { ProcessDetailTable }  from '../tables/ProcessDetailTable'
import { useProcessos }        from '../../hooks/useProcessoContrato'
import { useFase1Analise }     from '../../hooks/useFase1AnaliseContrato'
import { useGlobalFilters }    from '../../hooks/useGlobalFilters'
import { usePhaseMetrics }     from '../../hooks/usePhaseMetrics'
import { useProcessoTableRows } from '../../features/processos/useProcessoTableRows'
import { solicitacaoColumns }   from '../../features/processos/solicitacaoColumns'
import { phaseColors, prioridadeColors } from '../../theme/theme'
import { strings }              from '../../i18n/strings.pt-BR'
import type { FaseKey }         from '../../types/processoContrato.types'
import type { Fase1AnaliseContrato } from '../../types/processoContrato.types'
import type { ProcessoRow }     from '../../features/processos/useProcessoTableRows'
import type { ColumnDef }       from '../tables/ProcessDetailTable'

interface PhaseViewProps {
  phaseKey: FaseKey
  title: string
  subtitle?: string
  statusColumn?: keyof import('../../types/processoContrato.types').ProcessoContrato
  statusColumnLabel?: string
  showResponsavelChart?: boolean
  extraIndicators?: (fase1Records: Fase1AnaliseContrato[]) => React.ReactNode
  gapIndicators?: React.ReactNode
  tableFilterKey?: 'currentlyInPhase' | 'enteredPhase'
}

// ── Section wrapper ───────────────────────────────────────────────────────────
// Left accent bar + card — matches the Overview page Section style.
function Section({
  children,
  title,
  accentColor,
}: {
  children: React.ReactNode
  title?: string
  accentColor?: string
}) {
  const theme   = useTheme()
  const isDark  = theme.palette.mode === 'dark'
  const accent  = accentColor ?? theme.palette.primary.main

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {title && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box
              sx={{
                width: 3,
                height: 16,
                borderRadius: 2,
                flexShrink: 0,
                bgcolor: accent,
                boxShadow: isDark ? `0 0 8px ${alpha(accent, 0.7)}` : 'none',
              }}
            />
            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'text.primary',
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </Typography>
          </Box>
        )}
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
  const theme      = useTheme()
  const isDark     = theme.palette.mode === 'dark'
  const [filters]  = useGlobalFilters()
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

  // Responsável distribution (Fase 1 Análise only)
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

        {/* ── Page header ───────────────────────────────────────────────────── */}
        <Box
          sx={{
            mb: 2.5,
            pl: 2,
            borderLeft: `3px solid ${phaseColor}`,
            borderRadius: '0 4px 4px 0',
            boxShadow: isDark ? `inset 3px 0 0 ${alpha(phaseColor, 0.0)}` : 'none',
          }}
        >
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* ── KPI row ───────────────────────────────────────────────────────── */}
        <Grid container spacing={2} mb={2.5}>
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

        {/* ── Charts row: lead time + prioridade donut + optional status donut ── */}
        <Grid container spacing={2} mb={2.5}>
          {/* Lead time by prioridade — takes remaining space */}
          <Grid item xs={12} md={statusColumn ? 6 : 8}>
            <Section title={strings.faseIndicators.leadTimePorPrioridade} accentColor={phaseColor}>
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

          {/* Prioridade donut — always shown */}
          <Grid item xs={12} md={statusColumn ? 3 : 4}>
            <Section accentColor={phaseColor}>
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

          {/* Status donut — only when statusColumn provided */}
          {statusColumn && (
            <Grid item xs={12} md={3}>
              <Section accentColor={phaseColor}>
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

        {/* ── Responsável chart (Fase 1 Análise only) ───────────────────────── */}
        {showResponsavelChart && (
          <Grid container spacing={2} mb={2.5}>
            <Grid item xs={12}>
              <Section
                title={strings.faseIndicators.distribuicaoPorResponsavel}
                accentColor={phaseColor}
              >
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

        {/* ── Phase-specific extra sections (e.g. RevisionsChart) ───────────── */}
        {extraIndicators && (
          <Box mb={2.5}>
            {extraIndicators(fase1Records)}
          </Box>
        )}

        {/* ── Gap indicators ────────────────────────────────────────────────── */}
        {gapIndicators && (
          <Grid container spacing={2} mb={2.5}>
            <Grid item xs={12}>{gapIndicators}</Grid>
          </Grid>
        )}

        {/* ── Detail table ──────────────────────────────────────────────────── */}
        <Section title={strings.faseIndicators.detalhamento} accentColor={phaseColor}>
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
