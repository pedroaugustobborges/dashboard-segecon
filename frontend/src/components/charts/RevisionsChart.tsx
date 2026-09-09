// Shows how many processes had 0, 1, 2, 3+ revisions in Fase 1 / Análise Contrato.
// Derived from fase1_analise_contrato records grouped by id_controle_sc.

import { useMemo } from 'react'
import { Box, Typography, Skeleton, Chip, Tooltip, useTheme, alpha } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Cell,
} from 'recharts'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { Fase1AnaliseContrato } from '../../types/processoContrato.types'
import { strings } from '../../i18n/strings.pt-BR'

interface Props {
  fase1Records: Fase1AnaliseContrato[]
  loading?: boolean
  height?: number
}

const BAR_COLORS = ['#00897b', '#0288d1', '#f57c00', '#c62828']

export function RevisionsChart({ fase1Records, loading, height = 220 }: Props) {
  const theme  = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const gridColor    = isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.07)
  const tickColor    = isDark ? alpha('#ffffff', 0.45) : alpha('#000000', 0.45)
  const tooltipBg    = isDark ? '#1c2128' : '#ffffff'
  const tooltipBorder = isDark ? alpha('#ffffff', 0.12) : alpha('#000000', 0.10)

  const { chartData, avgRevisions } = useMemo(() => {
    const revPerProcess = new Map<number, Set<number>>()
    for (const rec of fase1Records) {
      if (rec.id_controle_sc === null) continue
      if (!revPerProcess.has(rec.id_controle_sc)) revPerProcess.set(rec.id_controle_sc, new Set())
      revPerProcess.get(rec.id_controle_sc)!.add(rec.nro_revisao ?? 0)
    }

    const countBucket: Record<string, number> = {}
    let total = 0
    for (const revSet of revPerProcess.values()) {
      const revCount = revSet.size
      const key = revCount >= 4 ? '4+' : String(revCount)
      countBucket[key] = (countBucket[key] ?? 0) + 1
      total += revCount
    }

    const avg = revPerProcess.size > 0 ? Math.round((total / revPerProcess.size) * 10) / 10 : 0

    const order = ['0', '1', '2', '3', '4+']
    const chartData = order
      .filter((k) => countBucket[k] !== undefined)
      .map((k) => ({ name: `${k} rev.`, value: countBucket[k] ?? 0 }))

    return { chartData, avgRevisions: avg }
  }, [fase1Records])

  if (loading) return <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography
          sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary' }}
        >
          {strings.faseIndicators.revisoes}
        </Typography>
        <Chip
          label={`${strings.faseIndicators.media}: ${avgRevisions}`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontSize: '0.7rem', height: 20 }}
        />
        <Tooltip title={strings.faseIndicators.revisoesTip} arrow>
          <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
        </Tooltip>
      </Box>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={gridColor}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: tickColor }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: tickColor }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <RTooltip
            formatter={(v) => [v, strings.faseIndicators.processos]}
            contentStyle={{
              fontSize: 12,
              borderRadius: 10,
              background: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              boxShadow: isDark
                ? `0 8px 24px ${alpha('#000', 0.5)}`
                : `0 4px 16px ${alpha('#000', 0.12)}`,
              color: isDark ? '#e6edf3' : '#1a1a1a',
            }}
            cursor={{ fill: alpha('#ffffff', isDark ? 0.05 : 0.06) }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[Math.min(i, BAR_COLORS.length - 1)]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
