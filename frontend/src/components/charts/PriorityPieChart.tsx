// Reusable donut/pie chart. Used for priority breakdown and status donuts.

import { Box, Typography, Skeleton } from '@mui/material'
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

const DEFAULT_COLORS = ['#00897b','#0288d1','#7b1fa2','#f57c00','#388e3c','#c62828','#5e35b1','#0097a7']

export function PriorityPieChart({
  title, data, loading, colorMap, height = 240, innerRadius = 48,
}: PriorityPieChartProps) {
  if (loading) {
    return (
      <Box>
        <Skeleton width="60%" height={20} />
        <Skeleton variant="circular" width={height * 0.7} height={height * 0.7} sx={{ mx: 'auto', mt: 1 }} />
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
      <Typography variant="subtitle2" fontWeight={600} mb={1}>
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
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={colorMap?.[entry.label] ?? entry.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, name) => {
              const n = Number(v)
              return [`${n} (${((n / total) * 100).toFixed(1)}%)`, name]
            }}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  )
}
