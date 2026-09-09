// Lead time per phase — horizontal bar chart with custom tooltip.
// Dark-mode aware: grid lines, tooltip, and labels adapt to palette.

import { Box, Typography, Skeleton, Tooltip as MuiTooltip, Chip, useTheme, alpha } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import type { LeadTimeData } from '../../types/indicadores.types'
import { phaseColors } from '../../theme/theme'
import { strings }     from '../../i18n/strings.pt-BR'

interface LeadTimeChartProps {
  data: LeadTimeData[]
  loading?: boolean
  height?: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: LeadTimeData & { meanDays: number } }>
  isDark?: boolean
}

function CustomTooltip({ active, payload, isDark }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const bg     = isDark ? '#1c2128' : '#ffffff'
  const border = isDark ? alpha('#ffffff', 0.10) : alpha('#000000', 0.10)
  return (
    <Box
      sx={{
        bgcolor: bg,
        p: 1.75,
        borderRadius: 2.5,
        border: `1px solid ${border}`,
        boxShadow: isDark ? `0 8px 28px ${alpha('#000', 0.55)}` : `0 4px 20px ${alpha('#000', 0.13)}`,
        minWidth: 170,
      }}
    >
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, mb: 0.75, color: isDark ? '#e6edf3' : '#1a1a2e' }}>
        {d.phaseName}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
        {[
          { label: 'Média',   value: `${d.mean} dias` },
          { label: 'Mediana', value: `${d.median.toFixed(1)} dias` },
          { label: 'Mín',     value: `${d.min.toFixed(0)} dias` },
          { label: 'Máx',     value: `${d.max.toFixed(0)} dias` },
        ].map(({ label, value }) => (
          <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Typography sx={{ fontSize: '0.72rem', color: isDark ? '#8b949e' : '#6b7280' }}>{label}</Typography>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: isDark ? '#e6edf3' : '#1a1a2e' }}>{value}</Typography>
          </Box>
        ))}
      </Box>
      {d.inProgressCount > 0 && (
        <Typography sx={{ fontSize: '0.68rem', color: 'warning.main', mt: 0.75, pt: 0.75, borderTop: `1px solid ${border}` }}>
          {d.inProgressCount} em andamento (excluídos da média)
        </Typography>
      )}
    </Box>
  )
}

export function LeadTimeChart({ data, loading, height = 280 }: LeadTimeChartProps) {
  const theme  = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const gridColor = isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.07)
  const tickColor = isDark ? '#8b949e' : '#6b7280'
  const labelColor = isDark ? '#8b949e' : '#6b7280'

  if (loading) {
    return <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />
  }

  const chartData = data.map((d) => ({ ...d, meanDays: d.mean }))

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          {strings.overview.leadTimePorFase}
        </Typography>
        <MuiTooltip
          title="Média de dias em processos já concluídos em cada fase. Processos em andamento não são incluídos."
          arrow
          placement="top"
        >
          <Chip
            label="média"
            size="small"
            sx={{
              fontSize: '0.6rem',
              height: 18,
              cursor: 'help',
              bgcolor: isDark ? alpha('#ffffff', 0.07) : alpha('#000', 0.05),
              border: `1px solid ${isDark ? alpha('#ffffff', 0.10) : alpha('#000', 0.08)}`,
            }}
          />
        </MuiTooltip>
      </Box>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 52, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: tickColor }}
            unit=" d"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="phaseName"
            width={112}
            tick={{ fontSize: 10, fill: tickColor }}
            axisLine={false}
            tickLine={false}
          />
          <RTooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: isDark ? alpha('#ffffff', 0.04) : alpha('#000000', 0.04) }} />
          <Bar dataKey="meanDays" radius={[0, 6, 6, 0]} maxBarSize={20}>
            <LabelList
              dataKey="meanDays"
              position="right"
              formatter={(v: unknown) => `${v}d`}
              style={{ fontSize: 10, fill: labelColor, fontWeight: 600 }}
            />
            {chartData.map((_entry, i) => (
              <Cell key={i} fill={phaseColors[(i + 1) as keyof typeof phaseColors] ?? '#00897b'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
