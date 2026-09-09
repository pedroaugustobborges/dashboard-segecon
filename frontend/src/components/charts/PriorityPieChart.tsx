// Reusable donut/pie chart — used for priority breakdown and status donuts.
// Dark-mode aware: tooltip and legend adapt to palette.

import { Box, Typography, Skeleton, useTheme, alpha } from '@mui/material'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { DistributionItem } from '../../types/indicadores.types'
import { strings } from '../../i18n/strings.pt-BR'

interface PriorityPieChartProps {
  title: string
  data: DistributionItem[]
  loading?: boolean
  colorMap?: Record<string, string>
  height?: number
  innerRadius?: number   // 0 = pie, >0 = donut
}

const DEFAULT_COLORS = [
  '#00897b','#0288d1','#7b1fa2','#f57c00',
  '#388e3c','#c62828','#5e35b1','#0097a7',
]

export function PriorityPieChart({
  title, data, loading, colorMap, height = 240, innerRadius = 48,
}: PriorityPieChartProps) {
  const theme  = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const tooltipStyle = {
    backgroundColor: isDark ? '#1c2128' : '#ffffff',
    border: `1px solid ${isDark ? alpha('#ffffff', 0.10) : alpha('#000000', 0.10)}`,
    borderRadius: 10,
    fontSize: 12,
    boxShadow: isDark ? `0 8px 24px ${alpha('#000', 0.5)}` : `0 4px 16px ${alpha('#000', 0.12)}`,
    color: isDark ? '#e6edf3' : '#1a1a2e',
  }

  if (loading) {
    return (
      <Box>
        <Skeleton width="60%" height={20} />
        <Skeleton variant="circular" width={height * 0.65} height={height * 0.65} sx={{ mx: 'auto', mt: 1.5 }} />
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

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <Box>
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 1, color: 'text.primary', letterSpacing: '-0.01em' }}>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={innerRadius + 44}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={colorMap?.[entry.label] ?? entry.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                opacity={0.92}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, name) => {
              const n = Number(v)
              return [`${n} (${((n / total) * 100).toFixed(1)}%)`, name]
            }}
            contentStyle={tooltipStyle}
            cursor={false}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: 11,
              fontWeight: 500,
              color: isDark ? '#8b949e' : '#6b7280',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  )
}
