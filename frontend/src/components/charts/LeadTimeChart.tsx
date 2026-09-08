// Displays average lead time in days per phase as a horizontal bar chart.
// Completed phases and in-progress counts shown separately in tooltip.

import { Box, Typography, Skeleton, Tooltip as MuiTooltip, Chip } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import type { LeadTimeData } from '../../types/indicadores.types'
import { phaseColors } from '../../theme/theme'
import { strings } from '../../i18n/strings.pt-BR'

interface LeadTimeChartProps {
  data: LeadTimeData[]
  loading?: boolean
  height?: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: LeadTimeData & { meanDays: number } }>
  label?: string
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 2, boxShadow: 3, fontSize: 12 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>
        {d.phaseName}
      </Typography>
      <Typography variant="caption" display="block">Média: <b>{d.mean} dias</b></Typography>
      <Typography variant="caption" display="block">Mediana: <b>{d.median.toFixed(1)} dias</b></Typography>
      <Typography variant="caption" display="block">Mín / Máx: {d.min.toFixed(0)} / {d.max.toFixed(0)} dias</Typography>
      {d.inProgressCount > 0 && (
        <Typography variant="caption" display="block" color="warning.main" mt={0.5}>
          {d.inProgressCount} em andamento (não incluídos na média)
        </Typography>
      )}
    </Box>
  )
}

export function LeadTimeChart({ data, loading, height = 280 }: LeadTimeChartProps) {
  if (loading) {
    return <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />
  }

  const chartData = data.map((d) => ({
    ...d,
    meanDays: d.mean,
  }))

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {strings.overview.leadTimePorFase}
        </Typography>
        <MuiTooltip title="Média de dias em processos já concluídos em cada fase. Processos em andamento não são incluídos na média." arrow>
          <Chip label="média" size="small" sx={{ fontSize: '0.6rem', height: 18, cursor: 'help' }} />
        </MuiTooltip>
      </Box>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 48, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 11 }} unit=" d" />
          <YAxis type="category" dataKey="phaseName" width={110} tick={{ fontSize: 10 }} />
          <RTooltip content={<CustomTooltip />} />
          <Bar dataKey="meanDays" radius={[0, 4, 4, 0]} maxBarSize={20}>
            <LabelList dataKey="meanDays" position="right" formatter={(v: unknown) => `${v}d`} style={{ fontSize: 10 }} />
            {chartData.map((_entry, i) => (
              <Cell key={i} fill={phaseColors[(i + 1) as keyof typeof phaseColors] ?? '#00897b'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
