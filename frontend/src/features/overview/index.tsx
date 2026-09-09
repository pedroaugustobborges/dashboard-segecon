import { useState, useMemo } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Tooltip,
  useTheme,
  alpha,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import HubIcon from '@mui/icons-material/Hub'
import BlockIcon from '@mui/icons-material/Block'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import PaidIcon from '@mui/icons-material/Paid'
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation'
import WorkHistoryIcon from '@mui/icons-material/WorkHistory'
import { GlobalFilterBar } from '../../components/filters/GlobalFilterBar'
import { KpiCard } from '../../components/charts/KpiCard'
import { DistributionChart } from '../../components/charts/DistributionChart'
import { LeadTimeChart } from '../../components/charts/LeadTimeChart'
import { PriorityPieChart } from '../../components/charts/PriorityPieChart'
import { ProcessDrawer } from '../../components/layout/ProcessDrawer'
import { PictogramChart } from '../../components/charts/PictogramChart'
import { HeatmapChart, type HeatmapRow } from '../../components/charts/HeatmapChart'
import { useProcessos } from '../../hooks/useProcessoContrato'
import { useLeadTime } from '../../hooks/useLeadTime'
import { useGlobalFilters } from '../../hooks/useGlobalFilters'
import { useFase1AnaliseReserva } from '../../hooks/useFase1AnaliseReserva'
import { useOverviewData } from './useOverviewData'
import { totalLeadTimeDays, PHASE_LABELS } from '../../utils/processoUtils'
import { derivePhaseInfo } from '../../hooks/useDerivedStatus'
import { phaseColors } from '../../theme/theme'
import type { FaseKey } from '../../types/processoContrato.types'
import { prioridadeColors } from '../../theme/theme'
import { strings } from '../../i18n/strings.pt-BR'

// Section wrapper — title with left accent bar + card
function Section({
  title,
  children,
  accentColor,
  headerRight,
  titleTooltip,
}: {
  title?: string
  children: React.ReactNode
  accentColor?: string
  headerRight?: React.ReactNode
  titleTooltip?: string
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const accent = accentColor ?? theme.palette.primary.main

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {title && (
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
          >
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
              {titleTooltip && (
                <Tooltip title={titleTooltip} arrow placement="top">
                  <InfoOutlinedIcon
                    sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help', flexShrink: 0 }}
                  />
                </Tooltip>
              )}
            </Box>
            {headerRight}
          </Box>
        )}
        {children}
      </CardContent>
    </Card>
  )
}

const KPI_CONFIG = [
  { key: 'ativos', color: '#00897b', icon: <HubIcon /> },
  { key: 'cancelados', color: '#f44336', icon: <BlockIcon /> },
  { key: 'concluidos', color: '#0288d1', icon: <TaskAltIcon /> },
  { key: 'valor', color: '#7b1fa2', icon: <PaidIcon /> },
] as const

export default function OverviewPage() {
  const [filters] = useGlobalFilters()
  const [unitMode, setUnitMode] = useState<'count' | 'leadtime'>('count')
  const [deptMode, setDeptMode] = useState<'count' | 'leadtime'>('count')
  const [analystaMode, setAnalystaMode] = useState<'count' | 'leadtime'>('count')
  const [unitDrawer, setUnitDrawer] = useState<string | null>(null)
  const [phaseDrawer, setPhaseDrawer] = useState<string | null>(null)
  const [analystaDrawer, setAnalystaDrawer] = useState<string | null>(null)
  const [kpiDrawer, setKpiDrawer] = useState<
    'ativos' | 'cancelados' | 'concluidos' | 'valor' | null
  >(null)

  const {
    data: processos = [],
    isLoading,
    isError,
  } = useProcessos({
    ...filters,
    incluirCancelados: true,
  })

  const scIds = useMemo(
    () => processos.map((p) => p.id_controle_sc).filter((id): id is number => id !== null),
    [processos],
  )

  const { data: reservaRecords = [], isLoading: reservaLoading } = useFase1AnaliseReserva(scIds)

  const pictogramData = useMemo(() => {
    const counts: Record<string, number> = {}
    const seen = new Set<string>()
    for (const rec of reservaRecords) {
      const nome = rec.nome?.trim() || 'N/A'
      const key = `${nome}|||${rec.id_controle_sc ?? ''}`
      if (seen.has(key)) continue
      seen.add(key)
      counts[nome] = (counts[nome] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [reservaRecords])

  const processosByAnalista = useMemo(() => {
    const processoMap = new Map(
      processos.filter((p) => p.id_controle_sc !== null).map((p) => [p.id_controle_sc!, p]),
    )
    const result = new Map<string, typeof processos>()
    const seen = new Map<string, Set<number>>()
    for (const rec of reservaRecords) {
      const nome = rec.nome?.trim() || 'N/A'
      const p = rec.id_controle_sc != null ? processoMap.get(rec.id_controle_sc) : undefined
      if (!p || p.id_controle_sc == null) continue
      if (!seen.has(nome)) seen.set(nome, new Set())
      if (seen.get(nome)!.has(p.id_controle_sc)) continue
      seen.get(nome)!.add(p.id_controle_sc)
      if (!result.has(nome)) result.set(nome, [])
      result.get(nome)!.push(p)
    }
    return result
  }, [reservaRecords, processos])

  const leadTimeByAnalista = useMemo(() => {
    const processoMap = new Map(
      processos.filter((p) => p.id_controle_sc !== null).map((p) => [p.id_controle_sc!, p]),
    )
    const ltByNome: Record<string, number[]> = {}
    const seen = new Map<string, Set<number>>()
    for (const rec of reservaRecords) {
      const nome = rec.nome?.trim() || 'N/A'
      const p = rec.id_controle_sc != null ? processoMap.get(rec.id_controle_sc) : undefined
      if (!p || p.id_controle_sc == null) continue
      if (!seen.has(nome)) seen.set(nome, new Set())
      if (seen.get(nome)!.has(p.id_controle_sc)) continue
      seen.get(nome)!.add(p.id_controle_sc)
      const days = totalLeadTimeDays(p)
      if (days === null || days < 0) continue
      if (!ltByNome[nome]) ltByNome[nome] = []
      ltByNome[nome].push(days)
    }
    return Object.entries(ltByNome)
      .map(([label, days]) => ({
        label,
        value: Math.round((days.reduce((s, v) => s + v, 0) / days.length) * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value)
  }, [reservaRecords, processos])

  const HEATMAP_PHASES = [1, 2, 3, 4, 5, 6, 7, 8] as FaseKey[]

  const heatmapData = useMemo((): HeatmapRow[] => {
    const matrix: Record<string, Record<number, number>> = {}
    for (const [nome, procs] of processosByAnalista) {
      for (const p of procs) {
        if (p.solicitacao_cancelada) continue
        const { currentPhase } = derivePhaseInfo(p)
        if (!currentPhase) continue
        if (!matrix[nome]) matrix[nome] = {}
        matrix[nome][currentPhase] = (matrix[nome][currentPhase] ?? 0) + 1
      }
    }
    return Object.entries(matrix)
      .map(([entity, phaseCounts]) => ({
        entity,
        total: Object.values(phaseCounts).reduce((s, v) => s + v, 0),
        cells: HEATMAP_PHASES.map((phase) => ({
          phase,
          label: PHASE_LABELS[phase],
          count: phaseCounts[phase] ?? 0,
          color: phaseColors[phase] ?? '#00897b',
        })),
      }))
      .sort((a, b) => b.total - a.total)
  }, [processosByAnalista])

  const metrics = useOverviewData(processos)
  const leadTimeData = useLeadTime(processos.filter((p) => !p.solicitacao_cancelada))

  const kpiItems = [
    {
      ...KPI_CONFIG[0],
      label: strings.overview.totalAtivos,
      value: metrics.totalAtivos,
      drawerKey: 'ativos' as const,
    },
    {
      ...KPI_CONFIG[1],
      label: strings.overview.totalCancelados,
      value: metrics.totalCancelados,
      drawerKey: 'cancelados' as const,
    },
    {
      ...KPI_CONFIG[2],
      label: strings.overview.totalConcluidos,
      value: metrics.totalConcluidos,
      drawerKey: 'concluidos' as const,
    },
    {
      ...KPI_CONFIG[3],
      label: strings.overview.valorTotalEstimado,
      value: metrics.valorFormatted,
      drawerKey: 'valor' as const,
    },
  ]

  return (
    <>
      <Box>
        <GlobalFilterBar />

        <Box sx={{ px: 1.5, py: 1.5 }}>
          {isError && (
            <Typography color="error" mb={1.5} sx={{ fontSize: '0.85rem' }}>
              {strings.errors.carregamentoFalhou}
            </Typography>
          )}

          {/* ── Row 1: KPI cards ─────────────────────────────────────────────── */}
          <Grid container spacing={2} mb={2}>
            {kpiItems.map(({ key, label, value, color, icon, drawerKey }) => (
              <Grid item xs={12} sm={6} md={3} key={key}>
                <KpiCard
                  label={label}
                  value={value}
                  color={color}
                  icon={icon}
                  loading={isLoading}
                  onClick={() => setKpiDrawer(drawerKey)}
                />
              </Grid>
            ))}
          </Grid>

          {/* ── Row 2: Phase funnel + Priority donut ─────────────────────────── */}
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={8}>
              <Section title={strings.overview.processosPorFase} accentColor="#0288d1">
                {isLoading ? (
                  <Skeleton variant="rectangular" height={268} sx={{ borderRadius: 2 }} />
                ) : (
                  <DistributionChart
                    title=""
                    data={metrics.phaseDistribution}
                    height={268}
                    horizontal={true}
                    onBarClick={(label) => setPhaseDrawer(label)}
                  />
                )}
              </Section>
            </Grid>
            <Grid item xs={12} md={4}>
              <Section accentColor={prioridadeColors.Imediata}>
                <PriorityPieChart
                  title={strings.overview.prioridadeBreakdown}
                  data={metrics.porPrioridade}
                  loading={isLoading}
                  colorMap={prioridadeColors}
                  height={268}
                />
              </Section>
            </Grid>
          </Grid>

          {/* ── Row 3: Lead time + Treemap (fase × entidade) ─────────────────── */}
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={7}>
              <Section>
                <LeadTimeChart data={leadTimeData} loading={isLoading} height={310} />
              </Section>
            </Grid>
            <Grid item xs={12} md={5}>
              <Section
                title="Analistas × Fase Atual"
                accentColor="#00897b"
                titleTooltip="O total aqui pode ser menor do que no pictograma porque processos cancelados e processos ainda sem fase iniciada são excluídos. Ou seja, apenas processos ativos e concluídos têm uma fase atual para exibir."
              >
                <HeatmapChart
                  data={heatmapData}
                  loading={isLoading || reservaLoading}
                  height={310}
                />
              </Section>
            </Grid>
          </Grid>

          {/* ── Row 3b: Pictogram — analysts by process volume ───────────────── */}
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={7}>
              <Section
                title={
                  analystaMode === 'count'
                    ? 'Analistas: Volume de Processos (Reserva)'
                    : 'Analistas: Tempo Médio (Reserva)'
                }
                accentColor="#0288d1"
                headerRight={
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={analystaMode}
                    onChange={(_, v) => v && setAnalystaMode(v as 'count' | 'leadtime')}
                    sx={{
                      '& .MuiToggleButton-root': {
                        py: 0.25,
                        px: 1,
                        fontSize: '0.68rem',
                        textTransform: 'none',
                        lineHeight: 1.4,
                        fontWeight: 500,
                      },
                    }}
                  >
                    <ToggleButton value="count">Processos</ToggleButton>
                    <ToggleButton value="leadtime">Lead Time</ToggleButton>
                  </ToggleButtonGroup>
                }
              >
                <PictogramChart
                  data={analystaMode === 'count' ? pictogramData : leadTimeByAnalista}
                  loading={isLoading || reservaLoading}
                  accentColor="#0288d1"
                  pageSize={5}
                  maxIcons={12}
                  onEntryClick={(label) => setAnalystaDrawer(label)}
                  IconComponent={
                    analystaMode === 'count' ? MedicalInformationIcon : WorkHistoryIcon
                  }
                  valueLabel={analystaMode === 'count' ? 'processo' : 'dia'}
                />
              </Section>
            </Grid>
            <Grid item xs={12} md={5}>
              <Section
                title={
                  unitMode === 'count'
                    ? strings.overview.processosPorUnidade
                    : 'Tempo Médio por Unidade'
                }
                accentColor="#7b1fa2"
                headerRight={
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={unitMode}
                    onChange={(_, v) => v && setUnitMode(v as 'count' | 'leadtime')}
                    sx={{
                      '& .MuiToggleButton-root': {
                        py: 0.25,
                        px: 1,
                        fontSize: '0.68rem',
                        textTransform: 'none',
                        lineHeight: 1.4,
                        fontWeight: 500,
                      },
                    }}
                  >
                    <ToggleButton value="count">Processos</ToggleButton>
                    <ToggleButton value="leadtime">Lead Time</ToggleButton>
                  </ToggleButtonGroup>
                }
              >
                {isLoading ? (
                  <Skeleton variant="rectangular" height={310} sx={{ borderRadius: 2 }} />
                ) : (
                  <DistributionChart
                    title=""
                    data={unitMode === 'count' ? metrics.porUnidade : metrics.leadTimeByUnidade}
                    height={310}
                    maxItems={12}
                    valueLabel={unitMode === 'count' ? 'Processos' : 'Média (dias)'}
                    onBarClick={(label) => setUnitDrawer(label)}
                  />
                )}
              </Section>
            </Grid>
          </Grid>

          {/* ── Row 4: Status donuts ─────────────────────────────────────────── */}
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={6}>
              <Section accentColor="#00897b">
                <PriorityPieChart
                  title={strings.overview.analiseContratoStatus}
                  data={metrics.analiseContratoItems}
                  loading={isLoading}
                  height={240}
                  innerRadius={52}
                />
              </Section>
            </Grid>
            <Grid item xs={12} md={6}>
              <Section accentColor="#f57c00">
                <PriorityPieChart
                  title={strings.overview.aprovacaoSolicitacaoStatus}
                  data={metrics.aprovacaoItems}
                  loading={isLoading}
                  height={240}
                  innerRadius={52}
                />
              </Section>
            </Grid>
          </Grid>

          {/* ── Row 5: Departments (paginated) ───────────────────────────────── */}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Section
                title={deptMode === 'count' ? 'Departamentos' : 'Tempo Médio por Departamento'}
                accentColor="#5e35b1"
                headerRight={
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={deptMode}
                    onChange={(_, v) => v && setDeptMode(v as 'count' | 'leadtime')}
                    sx={{
                      '& .MuiToggleButton-root': {
                        py: 0.25,
                        px: 1,
                        fontSize: '0.68rem',
                        textTransform: 'none',
                        lineHeight: 1.4,
                        fontWeight: 500,
                      },
                    }}
                  >
                    <ToggleButton value="count">Processos</ToggleButton>
                    <ToggleButton value="leadtime">Lead Time</ToggleButton>
                  </ToggleButtonGroup>
                }
              >
                {isLoading ? (
                  <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
                ) : (
                  <DistributionChart
                    title=""
                    data={
                      deptMode === 'count'
                        ? metrics.topDepartamentos
                        : metrics.leadTimeByDepartamento
                    }
                    height={220}
                    pageSize={5}
                    horizontal={true}
                    valueLabel={deptMode === 'count' ? 'Processos' : 'Média (dias)'}
                  />
                )}
              </Section>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* ── Drill-down drawers ────────────────────────────────────────────────── */}
      <ProcessDrawer
        open={analystaDrawer !== null}
        onClose={() => setAnalystaDrawer(null)}
        title={analystaDrawer ?? ''}
        subtitle="Analista — Reserva"
        accentColor="#0288d1"
        processes={analystaDrawer ? (processosByAnalista.get(analystaDrawer) ?? []) : []}
      />
      <ProcessDrawer
        open={unitDrawer !== null}
        onClose={() => setUnitDrawer(null)}
        title={unitDrawer ?? ''}
        subtitle="Processos por Unidade"
        accentColor="#7b1fa2"
        processes={unitDrawer ? (metrics.processosByUnidade.get(unitDrawer) ?? []) : []}
      />
      <ProcessDrawer
        open={phaseDrawer !== null}
        onClose={() => setPhaseDrawer(null)}
        title={phaseDrawer ?? ''}
        subtitle="Distribuição por Fase Atual"
        accentColor="#0288d1"
        processes={phaseDrawer ? (metrics.processosByPhaseLabel.get(phaseDrawer) ?? []) : []}
      />
      <ProcessDrawer
        open={kpiDrawer !== null}
        onClose={() => setKpiDrawer(null)}
        title={
          kpiDrawer === 'ativos'
            ? strings.overview.totalAtivos
            : kpiDrawer === 'cancelados'
              ? strings.overview.totalCancelados
              : kpiDrawer === 'concluidos'
                ? strings.overview.totalConcluidos
                : kpiDrawer === 'valor'
                  ? strings.overview.valorTotalEstimado
                  : ''
        }
        subtitle="Visão Geral"
        accentColor={
          kpiDrawer === 'ativos'
            ? '#00897b'
            : kpiDrawer === 'cancelados'
              ? '#f44336'
              : kpiDrawer === 'concluidos'
                ? '#0288d1'
                : kpiDrawer === 'valor'
                  ? '#7b1fa2'
                  : undefined
        }
        processes={
          kpiDrawer === 'ativos'
            ? metrics.processosAtivos
            : kpiDrawer === 'cancelados'
              ? metrics.processosCancelados
              : kpiDrawer === 'concluidos'
                ? metrics.processosConcluidos
                : kpiDrawer === 'valor'
                  ? metrics.processosPorValor
                  : []
        }
      />
    </>
  )
}
