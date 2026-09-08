import { Box, Grid, Card, CardContent, Typography, Skeleton } from '@mui/material'
import { GlobalFilterBar } from '../../components/filters/GlobalFilterBar'
import { KpiCard } from '../../components/charts/KpiCard'
import { DistributionChart } from '../../components/charts/DistributionChart'
import { LeadTimeChart } from '../../components/charts/LeadTimeChart'
import { PriorityPieChart } from '../../components/charts/PriorityPieChart'
import { useProcessos } from '../../hooks/useProcessoContrato'
import { useLeadTime } from '../../hooks/useLeadTime'
import { useGlobalFilters } from '../../hooks/useGlobalFilters'
import { useOverviewData } from './useOverviewData'
import { prioridadeColors } from '../../theme/theme'
import { strings } from '../../i18n/strings.pt-BR'

// Section card wrapper with title
function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {title && (
          <Typography variant="subtitle2" fontWeight={600} mb={2} color="text.primary">
            {title}
          </Typography>
        )}
        {children}
      </CardContent>
    </Card>
  )
}

export default function OverviewPage() {
  const [filters] = useGlobalFilters()

  // Fetch all processos matching global filters (include cancelled so KPIs are complete)
  const { data: processos = [], isLoading, isError } = useProcessos({
    ...filters,
    incluirCancelados: true, // always fetch all; KPI logic handles exclusion
  })

  const metrics = useOverviewData(processos)
  const leadTimeData = useLeadTime(processos.filter((p) => !p.solicitacao_cancelada))

  const kpiColor = (key: 'ativos' | 'cancelados' | 'concluidos' | 'valor') => {
    const map = { ativos: '#00897b', cancelados: '#d32f2f', concluidos: '#0288d1', valor: '#7b1fa2' }
    return map[key]
  }

  return (
    <Box>
      <GlobalFilterBar />

      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Page title */}
        <Typography variant="h5" fontWeight={700} mb={3}>
          {strings.overview.title}
        </Typography>

        {isError && (
          <Typography color="error" mb={2}>{strings.errors.carregamentoFalhou}</Typography>
        )}

        {/* ── Row 1: KPI cards ── */}
        <Grid container spacing={2.5} mb={3}>
          {([
            { key: 'ativos',     label: strings.overview.totalAtivos,        value: metrics.totalAtivos,      color: kpiColor('ativos')     },
            { key: 'cancelados', label: strings.overview.totalCancelados,     value: metrics.totalCancelados,  color: kpiColor('cancelados') },
            { key: 'concluidos', label: strings.overview.totalConcluidos,     value: metrics.totalConcluidos,  color: kpiColor('concluidos') },
            { key: 'valor',      label: strings.overview.valorTotalEstimado,  value: metrics.valorFormatted,   color: kpiColor('valor')      },
          ] as const).map(({ key, label, value, color }) => (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <KpiCard label={label} value={value} color={color} loading={isLoading} />
            </Grid>
          ))}
        </Grid>

        {/* ── Row 2: Phase funnel + Priority donut ── */}
        <Grid container spacing={2.5} mb={3}>
          <Grid item xs={12} md={8}>
            <Section title={strings.overview.processosPorFase}>
              {isLoading
                ? <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
                : <DistributionChart
                    title=""
                    data={metrics.phaseDistribution}
                    height={260}
                    horizontal={true}
                  />
              }
            </Section>
          </Grid>
          <Grid item xs={12} md={4}>
            <Section>
              <PriorityPieChart
                title={strings.overview.prioridadeBreakdown}
                data={metrics.porPrioridade}
                loading={isLoading}
                colorMap={prioridadeColors}
                height={260}
              />
            </Section>
          </Grid>
        </Grid>

        {/* ── Row 3: By unit + Lead time ── */}
        <Grid container spacing={2.5} mb={3}>
          <Grid item xs={12} md={5}>
            <Section title={strings.overview.processosPorUnidade}>
              {isLoading
                ? <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
                : <DistributionChart
                    title=""
                    data={metrics.porUnidade}
                    height={320}
                    maxItems={15}
                  />
              }
            </Section>
          </Grid>
          <Grid item xs={12} md={7}>
            <Section>
              <LeadTimeChart data={leadTimeData} loading={isLoading} height={320} />
            </Section>
          </Grid>
        </Grid>

        {/* ── Row 4: Status donuts ── */}
        <Grid container spacing={2.5} mb={3}>
          <Grid item xs={12} md={6}>
            <Section>
              <PriorityPieChart
                title={strings.overview.analiseContratoStatus}
                data={metrics.analiseContratoItems}
                loading={isLoading}
                height={240}
                innerRadius={50}
              />
            </Section>
          </Grid>
          <Grid item xs={12} md={6}>
            <Section>
              <PriorityPieChart
                title={strings.overview.aprovacaoSolicitacaoStatus}
                data={metrics.aprovacaoItems}
                loading={isLoading}
                height={240}
                innerRadius={50}
              />
            </Section>
          </Grid>
        </Grid>

        {/* ── Row 5: Top departments ── */}
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Section title={strings.overview.topDepartamentos}>
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
