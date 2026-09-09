// Generic phase page layout. Used by all 9 phase views (Fase 1 Análise, Fase 1 Aprovação, Fase 2–8).
// Handles data fetching, metrics computation, and standard layout.
// Phase-specific sections are injected via `extraIndicators` and `gapIndicators` props.

import { useMemo, useState } from 'react'
import {
  Box, Grid, Card, CardContent, Typography, ToggleButtonGroup, ToggleButton,
  Drawer, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Chip, IconButton, Divider, useTheme, alpha,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
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
import { computeLeadTimeDays } from '../../hooks/useDerivedStatus'
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
  headerRight,
}: {
  children: React.ReactNode
  title?: string
  accentColor?: string
  headerRight?: React.ReactNode
}) {
  const theme   = useTheme()
  const isDark  = theme.palette.mode === 'dark'
  const accent  = accentColor ?? theme.palette.primary.main

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {title && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            {headerRight}
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
  const [respMode, setRespMode] = useState<'count' | 'leadtime'>('count')
  const [selectedResponsavel, setSelectedResponsavel] = useState<string | null>(null)

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
    const seen = new Set<string>() // (nome, id_controle_sc) pairs already counted
    for (const rec of fase1Records) {
      const nome = rec.nome ?? strings.status.naoAtribuido
      const key = `${nome}|||${rec.id_controle_sc ?? ''}`
      if (seen.has(key)) continue
      seen.add(key)
      counts[nome] = (counts[nome] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [fase1Records, showResponsavelChart])

  // Full processo list per responsável — used by the detail drawer
  const responsavelProcessoMap = useMemo(() => {
    if (!showResponsavelChart) return new Map<string, typeof processos>()
    const processoMap = new Map<number, (typeof processos)[0]>()
    for (const p of processos) {
      if (p.id_controle_sc !== null) processoMap.set(p.id_controle_sc, p)
    }
    const result = new Map<string, typeof processos>()
    const seen = new Map<string, Set<number>>() // nome → Set of id_controle_sc already added
    for (const rec of fase1Records) {
      const nome = rec.nome ?? strings.status.naoAtribuido
      const p = rec.id_controle_sc !== null ? processoMap.get(rec.id_controle_sc) : undefined
      if (!p || p.id_controle_sc === null) continue
      if (!seen.has(nome)) seen.set(nome, new Set())
      if (seen.get(nome)!.has(p.id_controle_sc)) continue
      seen.get(nome)!.add(p.id_controle_sc)
      if (!result.has(nome)) result.set(nome, [])
      result.get(nome)!.push(p)
    }
    return result
  }, [fase1Records, processos, showResponsavelChart])

  // Lead time by responsável — join fase1Records → processos via id_controle_sc
  const leadTimeByResponsavel = useMemo(() => {
    if (!showResponsavelChart) return []
    const processoMap = new Map<number, (typeof processos)[0]>()
    for (const p of processos) {
      if (p.id_controle_sc !== null) processoMap.set(p.id_controle_sc, p)
    }
    const ltByResp: Record<string, number[]> = {}
    const seen = new Map<string, Set<number>>() // nome → Set of id_controle_sc already counted
    for (const rec of fase1Records) {
      const nome = rec.nome ?? strings.status.naoAtribuido
      const p = rec.id_controle_sc !== null ? processoMap.get(rec.id_controle_sc) : undefined
      if (!p || p.id_controle_sc === null) continue
      if (!seen.has(nome)) seen.set(nome, new Set())
      if (seen.get(nome)!.has(p.id_controle_sc)) continue
      seen.get(nome)!.add(p.id_controle_sc)
      const days = computeLeadTimeDays(p.fase1_data_inicio_sc, p.fase1_data_fim_sc)
      if (days === null || days < 0) continue
      if (!ltByResp[nome]) ltByResp[nome] = []
      ltByResp[nome].push(days)
    }
    return Object.entries(ltByResp)
      .map(([label, days]) => {
        days.sort((a, b) => a - b)
        const avg = days.reduce((s, v) => s + v, 0) / days.length
        const mid = Math.floor(days.length / 2)
        const med = days.length % 2 ? days[mid] : (days[mid - 1] + days[mid]) / 2
        return {
          label,
          value: Math.round(avg * 10) / 10,
          median: Math.round(med * 10) / 10,
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [fase1Records, processos, showResponsavelChart])

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
                title={respMode === 'count' ? strings.faseIndicators.distribuicaoPorResponsavel : 'Lead Time por Responsável'}
                accentColor={phaseColor}
                headerRight={
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={respMode}
                    onChange={(_, v) => v && setRespMode(v as 'count' | 'leadtime')}
                    sx={{
                      '& .MuiToggleButton-root': {
                        py: 0.25, px: 1, fontSize: '0.68rem', textTransform: 'none',
                        lineHeight: 1.4, fontWeight: 500,
                      },
                    }}
                  >
                    <ToggleButton value="count">Processos</ToggleButton>
                    <ToggleButton value="leadtime">Lead Time</ToggleButton>
                  </ToggleButtonGroup>
                }
              >
                <DistributionChart
                  title=""
                  data={respMode === 'count' ? responsavelData : leadTimeByResponsavel}
                  loading={loading}
                  horizontal={true}
                  height={280}
                  pageSize={5}
                  valueLabel={respMode === 'count' ? 'Processos' : 'Média (dias)'}
                  onBarClick={(label) => setSelectedResponsavel(label)}
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

      {/* ── Responsável detail drawer ────────────────────────────────────────── */}
      {showResponsavelChart && (() => {
        const drawerRows = selectedResponsavel
          ? (responsavelProcessoMap.get(selectedResponsavel) ?? [])
          : []
        const completed = drawerRows.filter((p) => !!p.fase1_data_fim_sc)
        const inProgress = drawerRows.filter((p) => !p.fase1_data_fim_sc)
        const completedDays = completed
          .map((p) => computeLeadTimeDays(p.fase1_data_inicio_sc, p.fase1_data_fim_sc))
          .filter((d): d is number => d !== null && d >= 0)
        const avgDays = completedDays.length
          ? Math.round(completedDays.reduce((s, v) => s + v, 0) / completedDays.length * 10) / 10
          : null
        const sortedRows = [
          ...completed.sort((a, b) => {
            const dA = computeLeadTimeDays(a.fase1_data_inicio_sc, a.fase1_data_fim_sc) ?? 0
            const dB = computeLeadTimeDays(b.fase1_data_inicio_sc, b.fase1_data_fim_sc) ?? 0
            return dB - dA
          }),
          ...inProgress,
        ]

        return (
          <Drawer
            anchor="right"
            open={selectedResponsavel !== null}
            onClose={() => setSelectedResponsavel(null)}
            PaperProps={{
              sx: {
                width: { xs: '100%', sm: 700 },
                bgcolor: 'background.default',
                display: 'flex',
                flexDirection: 'column',
              },
            }}
          >
            {/* Header */}
            <Box
              sx={{
                px: 3, py: 2.5,
                background: isDark
                  ? `linear-gradient(135deg, ${alpha(phaseColor, 0.18)} 0%, ${alpha(phaseColor, 0.06)} 100%)`
                  : `linear-gradient(135deg, ${alpha(phaseColor, 0.10)} 0%, ${alpha(phaseColor, 0.03)} 100%)`,
                borderBottom: `1px solid ${isDark ? alpha('#fff', 0.08) : alpha('#000', 0.07)}`,
                flexShrink: 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{
                    fontSize: '0.68rem', fontWeight: 700, color: phaseColor,
                    textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5,
                  }}>
                    Responsável · Fase 1
                  </Typography>
                  <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    {selectedResponsavel}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setSelectedResponsavel(null)}
                  size="small"
                  sx={{
                    mt: 0.5,
                    border: `1px solid ${isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1)}`,
                    borderRadius: '8px',
                    '&:hover': { borderColor: alpha(phaseColor, 0.4), color: phaseColor },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>

              {/* Summary chips */}
              <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total', value: drawerRows.length, color: phaseColor },
                  { label: 'Concluídos', value: completed.length, color: '#4caf50' },
                  { label: 'Em andamento', value: inProgress.length, color: '#f59e0b' },
                  ...(avgDays !== null ? [{ label: 'Média', value: `${avgDays} dias`, color: phaseColor }] : []),
                ].map(({ label, value, color }) => (
                  <Box
                    key={label}
                    sx={{
                      px: 1.5, py: 0.6,
                      borderRadius: '8px',
                      bgcolor: alpha(color, isDark ? 0.12 : 0.08),
                      border: `1px solid ${alpha(color, 0.25)}`,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.68rem', color: isDark ? alpha('#fff', 0.5) : alpha('#000', 0.45), lineHeight: 1 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color, lineHeight: 1.4 }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Table */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              <TableContainer
                sx={{
                  borderRadius: '12px',
                  border: `1px solid ${isDark ? alpha('#fff', 0.07) : alpha('#000', 0.07)}`,
                  boxShadow: isDark ? `0 2px 12px ${alpha('#000', 0.3)}` : `0 1px 6px ${alpha('#000', 0.05)}`,
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['Processo', 'Entidade', 'Prioridade', 'Início Fase 1', 'Fim Fase 1', 'Lead Time'].map((h, i) => (
                        <TableCell
                          key={h}
                          align={i === 5 ? 'right' : 'left'}
                          sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedRows.map((p, idx) => {
                      const isCompleted = !!p.fase1_data_fim_sc
                      const days = isCompleted
                        ? computeLeadTimeDays(p.fase1_data_inicio_sc, p.fase1_data_fim_sc)
                        : null
                      const prioColor = prioridadeColors[p.solicitacao_tipo ?? ''] ?? alpha('#fff', 0.3)
                      return (
                        <TableRow
                          key={p.id}
                          sx={{
                            bgcolor: idx % 2 === 0
                              ? 'transparent'
                              : isDark ? alpha('#fff', 0.02) : alpha('#000', 0.015),
                            '&:last-child td': { border: 0 },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                            {p.solicitacao_numero ?? `#${p.id_controle_sc}`}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.78rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.entidade ?? '—'}
                          </TableCell>
                          <TableCell>
                            {p.solicitacao_tipo ? (
                              <Chip
                                label={p.solicitacao_tipo}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  bgcolor: alpha(prioColor, 0.15),
                                  color: prioColor,
                                  border: `1px solid ${alpha(prioColor, 0.3)}`,
                                }}
                              />
                            ) : '—'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap', color: 'text.secondary' }}>
                            {fmtDate(p.fase1_data_inicio_sc)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap', color: 'text.secondary' }}>
                            {fmtDate(p.fase1_data_fim_sc)}
                          </TableCell>
                          <TableCell align="right">
                            {isCompleted && days !== null ? (
                              <Typography
                                sx={{
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  color: days <= 15 ? '#4caf50' : days <= 30 ? '#f59e0b' : '#ef4444',
                                }}
                              >
                                {days}d
                              </Typography>
                            ) : (
                              <Chip
                                label="Em andamento"
                                size="small"
                                sx={{
                                  height: 18, fontSize: '0.62rem', fontWeight: 600,
                                  bgcolor: alpha('#f59e0b', 0.12),
                                  color: '#f59e0b',
                                  border: `1px solid ${alpha('#f59e0b', 0.3)}`,
                                }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 2 }} />
              <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', textAlign: 'center' }}>
                Lead Time = dias entre Início e Fim da Fase 1. Processos em andamento não entram na média.
              </Typography>
            </Box>
          </Drawer>
        )
      })()}

    </Box>
  )
}

// ── Helpers used by the drawer ────────────────────────────────────────────────
function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
