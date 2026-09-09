// Generic distribution chart — horizontal or vertical bar chart.
// Dark-mode aware: grid lines and tooltip adapt to palette.
// Used for: processos por unidade, top departamentos, status por fase, etc.

import { useMemo } from 'react'
import { Box, Typography, Skeleton, ToggleButtonGroup, ToggleButton, useTheme, alpha } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import type { DistributionItem } from '../../types/indicadores.types'
import { strings } from '../../i18n/strings.pt-BR'

interface DistributionChartProps {
  title: string
  data: DistributionItem[]
  loading?: boolean
  horizontal?: boolean
  colorMap?: Record<string, string>
  maxItems?: number
  height?: number
  segmentKey?: string
  segments?: string[]
  onSegmentChange?: (seg: string) => void
}

const DEFAULT_COLORS = [
  '#00897b','#0288d1','#7b1fa2','#f57c00',
  '#388e3c','#c62828','#5e35b1','#0097a7','#e91e63','#607d8b',
]

export function DistributionChart({
  title, data, loading, horizontal = true, colorMap, maxItems = 12,
  height = 300, segmentKey, segments, onSegmentChange,
}: DistributionChartProps) {
  const theme  = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const gridColor    = isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.07)
  const tickColor    = isDark ? '#8b949e' : '#6b7280'
  const tooltipBg    = isDark ? '#1c2128' : '#ffffff'
  const tooltipBorder = isDark ? alpha('#ffffff', 0.10) : alpha('#000000', 0.10)

  const sliced = useMemo(() => data.slice(0, maxItems), [data, maxItems])

  if (loading) {
    return (
      <Box>
        {title && <Skeleton width="50%" height={24} />}
        <Skeleton variant="rectangular" height={height} sx={{ mt: 1, borderRadius: 2 }} />
      </Box>
    )
  }

  if (!data.length) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height, color: 'text.disabled' }}>
        <Typography variant="body2">{strings.errors.semDados}</Typography>
      </Box>
    )
  }

  const chartData = sliced.map((item, i) => ({
    name: item.label,
    value: item.value,
    color: colorMap?.[item.label] ?? item.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }))

  const tooltipStyle = {
    backgroundColor: tooltipBg,
    border: `1px solid ${tooltipBorder}`,
    borderRadius: 10,
    fontSize: 12,
    boxShadow: isDark ? `0 8px 24px ${alpha('#000', 0.5)}` : `0 4px 16px ${alpha('#000', 0.12)}`,
    color: isDark ? '#e6edf3' : '#1a1a2e',
  }

  return (
    <Box>
      {(title || (segments && segments.length > 1)) && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          {title && (
            <Typography variant="subtitle2" fontWeight={600}>
              {title}
            </Typography>
          )}
          {segments && segments.length > 1 && onSegmentChange && (
            <ToggleButtonGroup
              size="small"
              exclusive
              value={segmentKey}
              onChange={(_, v) => v && onSegmentChange(v)}
              sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1, fontSize: '0.7rem' } }}
            >
              {segments.map((s) => (
                <ToggleButton key={s} value={s}>{s}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}
        </Box>
      )}

      <ResponsiveContainer width="100%" height={height}>
        {horizontal ? (
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 28, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
            <XAxis type="number" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
            <RTooltip
              formatter={(v) => [v, 'Processos']}
              contentStyle={tooltipStyle}
              cursor={{ fill: isDark ? alpha('#ffffff', 0.04) : alpha('#000000', 0.04) }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <BarChart data={chartData} margin={{ left: 4, right: 4, top: 4, bottom: 36 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: tickColor }} interval={0} angle={-30} textAnchor="end" axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
            <RTooltip
              formatter={(v) => [v, 'Processos']}
              contentStyle={tooltipStyle}
              cursor={{ fill: isDark ? alpha('#ffffff', 0.04) : alpha('#000000', 0.04) }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </Box>
  )
}
