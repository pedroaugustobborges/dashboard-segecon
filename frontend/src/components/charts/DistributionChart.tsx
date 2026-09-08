// Generic distribution chart: shows data as a horizontal bar chart.
// Supports an optional color mapping (e.g. prioridadeColors).
// Used for: processos por unidade, top departamentos, status por fase, etc.

import { useMemo } from 'react'
import { Box, Typography, Skeleton, ToggleButtonGroup, ToggleButton } from '@mui/material'
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
  horizontal?: boolean       // true = horizontal bars (default for lists)
  colorMap?: Record<string, string>  // key → color override
  maxItems?: number          // limit displayed items (default 10)
  height?: number
  segmentKey?: string        // label of current toggle (for external control)
  segments?: string[]        // available segment labels
  onSegmentChange?: (seg: string) => void
}

const DEFAULT_COLORS = ['#00897b','#0288d1','#7b1fa2','#f57c00','#388e3c','#c62828','#5e35b1','#0097a7','#e91e63','#607d8b']

export function DistributionChart({
  title, data, loading, horizontal = true, colorMap, maxItems = 12,
  height = 300, segmentKey, segments, onSegmentChange,
}: DistributionChartProps) {
  const sliced = useMemo(() => data.slice(0, maxItems), [data, maxItems])

  if (loading) {
    return (
      <Box>
        <Skeleton width="50%" height={24} />
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

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {title}
        </Typography>
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

      <ResponsiveContainer width="100%" height={height}>
        {horizontal ? (
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
            <RTooltip
              formatter={(v) => [v, 'Processos']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <BarChart data={chartData} margin={{ left: 0, right: 8, top: 0, bottom: 32 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" />
            <YAxis tick={{ fontSize: 11 }} />
            <RTooltip
              formatter={(v) => [v, 'Processos']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
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
