import { useState } from 'react'
import { Box, Grid, Card, CardContent, Typography, Skeleton, useTheme, alpha, ToggleButtonGroup, ToggleButton } from '@mui/material'
import HubIcon         from '@mui/icons-material/Hub'
import BlockIcon        from '@mui/icons-material/Block'
import TaskAltIcon      from '@mui/icons-material/TaskAlt'
import PaidIcon         from '@mui/icons-material/Paid'
import { GlobalFilterBar }   from '../../components/filters/GlobalFilterBar'
import { KpiCard }           from '../../components/charts/KpiCard'
import { DistributionChart } from '../../components/charts/DistributionChart'
import { LeadTimeChart }     from '../../components/charts/LeadTimeChart'
import { PriorityPieChart }  from '../../components/charts/PriorityPieChart'
import { useProcessos }      from '../../hooks/useProcessoContrato'
import { useLeadTime }       from '../../hooks/useLeadTime'
import { useGlobalFilters }  from '../../hooks/useGlobalFilters'
import { useOverviewData }   from './useOverviewData'
import { prioridadeColors }  from '../../theme/theme'
import { strings }           from '../../i18n/strings.pt-BR'

// Section wrapper — title with left accent bar + card
function Section({
  title, children, accentColor, headerRight,
}: {
  title?: string
  children: React.ReactNode
  accentColor?: string
  headerRight?: React.ReactNode
}) {
  const theme  = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const accent = accentColor ?? theme.palette.primary.main

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
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary', letterSpacing: '-0.01em' }}>
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

const KPI_CONFIG = [
  { key: 'ativos',     color: '#00897b', icon: <HubIcon />     },
  { key: 'cancelados', color: '#f44336', icon: <BlockIcon />   },
  { key: 'concluidos', color: '#0288d1', icon: <TaskAltIcon /> },
  { key: 'valor',      color: '#7b1fa2', icon: <PaidIcon />    },
] as const

export default function OverviewPage() {
  const [filters] = useGlobalFilters()
  const [unitMode, setUnitMode] = useState<'count' | 'leadtime'>('count')

  const { data: processos = [], isLoading, isError } = useProcessos({
    ...filters,
    incluirCancelados: true,
  })

  const metrics     = useOverviewData(processos)
  const leadTimeData = useLeadTime(processos.filter((p) => !p.solicitacao_cancelada))

  const kpiItems = [
    { ...KPI_CONFIG[0], label: strings.overview.totalAtivos,       value: metrics.totalAtivos      },
    { ...KPI_CONFIG[1], label: strings.overview.totalCancelados,    value: metrics.totalCancelados  },
    { ...KPI_CONFIG[2], label: strings.overview.totalConcluidos,    value: metrics.totalConcluidos  },
    { ...KPI_CONFIG[3], label: strings.overview.valorTotalEstimado, value: metrics.valorFormatted   },
  ]

  return (
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
          {kpiItems.map(({ key, label, value, color, icon }) => (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <KpiCard
                label={label}
                value={value}
                color={color}
                icon={icon}
                loading={isLoading}
              />
            </Grid>
          ))}
        </Grid>

        {/* ── Row 2: Phase funnel + Priority donut ─────────────────────────── */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={8}>
            <Section title={strings.overview.processosPorFase} accentColor="#0288d1">
              {isLoading
                ? <Skeleton variant="rectangular" height={268} sx={{ borderRadius: 2 }} />
                : <DistributionChart
                    title=""
                    data={metrics.phaseDistribution}
                    height={268}
                    horizontal={true}
                  />
              }
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

        {/* ── Row 3: Lead time + By unit ───────────────────────────────────── */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={7}>
            <Section>
              <LeadTimeChart data={leadTimeData} loading={isLoading} height={310} />
            </Section>
          </Grid>
          <Grid item xs={12} md={5}>
            <Section
              title={unitMode === 'count' ? strings.overview.processosPorUnidade : 'Tempo Médio por Unidade'}
              accentColor="#7b1fa2"
              headerRight={
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={unitMode}
                  onChange={(_, v) => v && setUnitMode(v as 'count' | 'leadtime')}
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
              {isLoading
                ? <Skeleton variant="rectangular" height={310} sx={{ borderRadius: 2 }} />
                : <DistributionChart
                    title=""
                    data={unitMode === 'count' ? metrics.porUnidade : metrics.leadTimeByUnidade}
                    height={310}
                    maxItems={12}
                    valueLabel={unitMode === 'count' ? 'Processos' : 'Média (dias)'}
                  />
              }
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

        {/* ── Row 5: Top departments ───────────────────────────────────────── */}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Section title={strings.overview.topDepartamentos} accentColor="#5e35b1">
              {isLoading
                ? <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
                : <DistributionChart
                    title=""
                    data={metrics.topDepartamentos}
                    height={220}
                    maxItems={10}
                    horizontal={true}
                  />
              }
            </Section>
          </Grid>
        </Grid>

      </Box>
    </Box>
  )
}
