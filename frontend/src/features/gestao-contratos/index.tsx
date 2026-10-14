import { useState, useMemo } from 'react'
import {
  Box, Grid, Card, CardContent, Typography, Skeleton,
  useTheme, alpha,
} from '@mui/material'
import { GlobalFilterBar } from '../../components/filters/GlobalFilterBar'
import { DistributionChart } from '../../components/charts/DistributionChart'
import { LeadTimeChart } from '../../components/charts/LeadTimeChart'
import { ProcessDrawer } from '../../components/layout/ProcessDrawer'
import { useProcessos } from '../../hooks/useProcessoContrato'
import { useLeadTime } from '../../hooks/useLeadTime'
import { useGlobalFilters } from '../../hooks/useGlobalFilters'
import { derivePhaseInfo } from '../../hooks/useDerivedStatus'
import { PHASE_LABELS } from '../../utils/processoUtils'
import { phaseColors } from '../../theme/theme'
import type { ProcessoContrato, FaseKey } from '../../types/processoContrato.types'

type Segment = 'ativos' | 'concluidos' | 'cancelados'

function Section({
  title, children, accentColor, headerRight,
}: {
  title?: string; children: React.ReactNode; accentColor?: string; headerRight?: React.ReactNode
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const accent = accentColor ?? theme.palette.primary.main
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {title && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 3, height: 16, borderRadius: 2, flexShrink: 0, bgcolor: accent, boxShadow: isDark ? `0 0 8px ${alpha(accent, 0.7)}` : 'none' }} />
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

const PHASE_STARTS: Array<[FaseKey, keyof ProcessoContrato]> = [
  [1, 'fase1_data_inicio_sc'],
  [2, 'fase2_data_inicio_prep_cotacao'],
  [3, 'fase3_data_inicio_cotacao'],
  [4, 'fase4_data_inicio_analise_cotacao'],
  [5, 'fase5_data_inicio_aprovacao_contrato'],
  [6, 'fase6_data_inicio_assinatura_contrato'],
  [7, 'fase7_data_inicio_validacao_anexos_contrato'],
  [8, 'fase8_data_inicio_publicacao_contrato'],
]

function getLastPhase(p: ProcessoContrato): FaseKey | null {
  let last: FaseKey | null = null
  for (const [phase, col] of PHASE_STARTS) {
    if (p[col]) last = phase
  }
  return last
}

export default function GestaoContratosPage() {
  const [filters] = useGlobalFilters()
  const [segment, setSegment] = useState<Segment>('ativos')
  const [phaseDrawer, setPhaseDrawer] = useState<string | null>(null)

  const { data: processos = [], isLoading } = useProcessos({
    ...filters,
    incluirCancelados: true,
  })

  // Separate into groups
  const processosAtivos = useMemo(
    () => processos.filter((p) => {
      if (p.solicitacao_cancelada) return false
      const { status } = derivePhaseInfo(p)
      return status !== 'completed'
    }),
    [processos],
  )
  const processosConcluidos = useMemo(
    () => processos.filter((p) => {
      if (p.solicitacao_cancelada) return false
      const { status } = derivePhaseInfo(p)
      return status === 'completed'
    }),
    [processos],
  )
  const processosCancelados = useMemo(
    () => processos.filter((p) => p.solicitacao_cancelada === true),
    [processos],
  )

  const segmentedProcessos = segment === 'ativos' ? processosAtivos
    : segment === 'concluidos' ? processosConcluidos
    : processosCancelados

  // Phase distribution for the selected segment
  const phaseDistribution = useMemo(() => {
    const phaseCount: Record<number, number> = {}
    for (const p of segmentedProcessos) {
      if (segment === 'ativos') {
        const { currentPhase } = derivePhaseInfo(p)
        if (currentPhase) phaseCount[currentPhase] = (phaseCount[currentPhase] ?? 0) + 1
      } else {
        const last = getLastPhase(p)
        if (last) phaseCount[last] = (phaseCount[last] ?? 0) + 1
      }
    }
    return Object.entries(phaseCount)
      .map(([phase, value]) => ({
        label: PHASE_LABELS[Number(phase) as FaseKey] ?? `Fase ${phase}`,
        value,
        color: phaseColors[Number(phase) as FaseKey],
      }))
  }, [segmentedProcessos, segment])

  // Lead time data for the segment
  const leadTimeData = useLeadTime(segmentedProcessos)

  // Lead time by unit
  const leadTimeByUnit = useMemo(() => {
    const ltByUnit: Record<string, number[]> = {}
    for (const p of segmentedProcessos) {
      const entidade = p.entidade ?? 'N/A'
      const start = p.fase1_data_inicio_sc
      if (!start) continue
      const fases = [
        p.fase1_data_fim_sc, p.fase2_data_fim_prep_cotacao, p.fase3_data_fim_cotacao,
        p.fase4_data_fim_analise_cotacao, p.fase5_data_fim_aprovacao_contrato,
        p.fase6_data_fim_assinatura_contrato, p.fase7_data_fim_validacao_anexos_contrato,
        p.fase8_data_fim_publicacao_contrato,
      ].filter(Boolean)
      const lastFim = fases.length ? fases[fases.length - 1]! : null
      if (!lastFim) continue
      const days = Math.round((new Date(lastFim).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))
      if (days < 0) continue
      if (!ltByUnit[entidade]) ltByUnit[entidade] = []
      ltByUnit[entidade].push(days)
    }
    return Object.entries(ltByUnit)
      .map(([label, days]) => ({
        label,
        value: Math.round(days.reduce((s, v) => s + v, 0) / days.length * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value)
  }, [segmentedProcessos])

  // Phase buttons for stratification
  const PHASE_KEYS: FaseKey[] = [1, 2, 3, 4, 5, 6, 7, 8]
  const phaseButtonData = useMemo(() => {
    return PHASE_KEYS.map((phase) => {
      const label = PHASE_LABELS[phase] ?? `Fase ${phase}`
      const procs = segmentedProcessos.filter((p) => {
        if (segment === 'ativos') {
          const { currentPhase } = derivePhaseInfo(p)
          return currentPhase === phase
        }
        return getLastPhase(p) === phase
      })
      return { phase, label, count: procs.length, processes: procs, color: phaseColors[phase] ?? '#00897b' }
    }).filter((b) => b.count > 0)
  }, [segmentedProcessos, segment])

  const processosByPhaseLabel = useMemo(() => {
    const map = new Map<string, ProcessoContrato[]>()
    for (const b of phaseButtonData) map.set(b.label, b.processes)
    return map
  }, [phaseButtonData])

  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const SEGMENT_CONFIG = [
    { key: 'ativos' as Segment,     label: 'Ativos',     count: processosAtivos.length,    color: '#00897b' },
    { key: 'concluidos' as Segment, label: 'Concluídos', count: processosConcluidos.length, color: '#0288d1' },
    { key: 'cancelados' as Segment, label: 'Cancelados', count: processosCancelados.length, color: '#f44336' },
  ]

  const segmentColor = SEGMENT_CONFIG.find((s) => s.key === segment)?.color ?? '#00897b'

  return (
    <>
      <Box>
        <GlobalFilterBar />
        <Box sx={{ px: 1.5, py: 1.5 }}>

          {/* ── Segment control ──────────────────────────────────────────────── */}
          <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'inline-flex',
                borderRadius: '10px',
                border: `1px solid ${isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1)}`,
                overflow: 'hidden',
                bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
              }}
            >
              {SEGMENT_CONFIG.map(({ key, label, count, color }) => {
                const active = segment === key
                return (
                  <Box
                    key={key}
                    onClick={() => setSegment(key)}
                    sx={{
                      px: 2, py: 1,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: active ? color : 'transparent',
                      transition: 'background-color 0.15s',
                      '&:hover': { bgcolor: active ? color : isDark ? alpha('#fff', 0.06) : alpha('#000', 0.04) },
                      borderRight: key !== 'cancelados' ? `1px solid ${isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1)}` : 'none',
                    }}
                  >
                    <Typography sx={{
                      fontSize: '0.82rem', fontWeight: active ? 700 : 500,
                      color: active ? '#fff' : 'text.primary',
                      transition: 'color 0.15s',
                    }}>
                      {label}
                    </Typography>
                    <Box sx={{
                      px: 0.75, py: 0.1, borderRadius: '6px',
                      bgcolor: active ? alpha('#fff', 0.25) : isDark ? alpha('#fff', 0.08) : alpha('#000', 0.07),
                      minWidth: 26, textAlign: 'center',
                    }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: active ? '#fff' : 'text.secondary', lineHeight: 1.4 }}>
                        {isLoading ? '…' : count}
                      </Typography>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </Box>

          {/* ── Row 1: Phase distribution + Lead time by phase ───────────────── */}
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={6}>
              <Section title="Distribuição por Fase" accentColor={segmentColor}>
                {isLoading ? (
                  <Skeleton variant="rectangular" height={268} sx={{ borderRadius: 2 }} />
                ) : (
                  <DistributionChart
                    title=""
                    data={phaseDistribution}
                    height={268}
                    horizontal={true}
                    onBarClick={(label) => setPhaseDrawer(label)}
                  />
                )}
              </Section>
            </Grid>
            <Grid item xs={12} md={6}>
              <Section accentColor={segmentColor}>
                <LeadTimeChart data={leadTimeData} loading={isLoading} height={268} />
              </Section>
            </Grid>
          </Grid>

          {/* ── Row 2: Lead time by unit + Estratificação por fases ──────────── */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Section title="Lead Time por Unidade (dias, média)" accentColor="#7b1fa2">
                {isLoading ? (
                  <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
                ) : (
                  <DistributionChart
                    title=""
                    data={leadTimeByUnit}
                    height={280}
                    valueLabel="dias"
                  />
                )}
              </Section>
            </Grid>
            <Grid item xs={12} md={6}>
              <Section title="Estratificação por Fase" accentColor={segmentColor}>
                {isLoading ? (
                  <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
                ) : phaseButtonData.length === 0 ? (
                  <Typography sx={{ fontSize: '0.82rem', color: 'text.disabled', py: 4, textAlign: 'center' }}>
                    Nenhum processo no segmento selecionado.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {phaseButtonData.map(({ phase, label, count, color }) => (
                      <Box
                        key={phase}
                        onClick={() => setPhaseDrawer(label)}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          px: 1.5,
                          py: 1,
                          borderRadius: '8px',
                          border: `1px solid ${isDark ? alpha(color, 0.25) : alpha(color, 0.2)}`,
                          bgcolor: isDark ? alpha(color, 0.06) : alpha(color, 0.04),
                          cursor: 'pointer',
                          transition: 'background-color 0.15s, border-color 0.15s',
                          '&:hover': {
                            bgcolor: isDark ? alpha(color, 0.14) : alpha(color, 0.09),
                            borderColor: alpha(color, 0.4),
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <Box sx={{
                            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                            bgcolor: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                              {phase}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: '0.82rem', color: 'text.primary', fontWeight: 500 }}>
                            {label}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color }}>
                          {count}
                        </Typography>
                      </Box>
                    ))}
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 0.5 }}>
                      Clique em uma fase para ver os contratos.
                    </Typography>
                  </Box>
                )}
              </Section>
            </Grid>
          </Grid>

        </Box>
      </Box>

      {/* ── Drill-down drawer ────────────────────────────────────────────────── */}
      <ProcessDrawer
        open={phaseDrawer !== null}
        onClose={() => setPhaseDrawer(null)}
        title={phaseDrawer ?? ''}
        subtitle={`Gestão de Contratos — ${SEGMENT_CONFIG.find((s) => s.key === segment)?.label}`}
        accentColor={segmentColor}
        processes={phaseDrawer ? (processosByPhaseLabel.get(phaseDrawer) ?? []) : []}
      />
    </>
  )
}
