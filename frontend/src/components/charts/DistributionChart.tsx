// Generic distribution chart — horizontal or vertical bar chart.
// Dark-mode aware: grid lines and tooltip adapt to palette.
// Supports optional per-page pagination when pageSize is provided.

import { useMemo, useState, useEffect } from 'react'
import {
  Box, Typography, Skeleton, ToggleButtonGroup, ToggleButton,
  IconButton, useTheme, alpha,
} from '@mui/material'
import ChevronLeftIcon  from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import type { DistributionItem } from '../../types/indicadores.types'
import { strings } from '../../i18n/strings.pt-BR'

interface ChartEntry {
  name: string
  value: number
  color: string
  median?: number
}

function BarTooltip({
  active, payload, valueLabel, bg, border, textColor, subColor,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload: ChartEntry }>
  valueLabel: string
  bg: string
  border: string
  textColor: string
  subColor: string
}) {
  if (!active || !payload?.length) return null
  const { value, payload: entry } = payload[0]
  return (
    <Box sx={{
      bgcolor: bg, border: `1px solid ${border}`, borderRadius: '10px',
      px: 1.5, py: 1, minWidth: 120,
    }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: textColor, mb: 0.25, lineHeight: 1.3 }}>
        {entry.name}
      </Typography>
      <Typography sx={{ fontSize: 12, color: textColor }}>
        {valueLabel}: <strong>{value}</strong>
      </Typography>
      {entry.median !== undefined && (
        <Typography sx={{ fontSize: 11, color: subColor, mt: 0.25 }}>
          Mediana: {entry.median} dias
        </Typography>
      )}
    </Box>
  )
}

interface DistributionChartProps {
  title: string
  data: DistributionItem[]
  loading?: boolean
  horizontal?: boolean
  colorMap?: Record<string, string>
  maxItems?: number
  pageSize?: number
  height?: number
  valueLabel?: string
  onBarClick?: (label: string) => void
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
  pageSize, height = 300, valueLabel = 'Processos', onBarClick,
  segmentKey, segments, onSegmentChange,
}: DistributionChartProps) {
  const theme   = useTheme()
  const isDark  = theme.palette.mode === 'dark'
  const primary = theme.palette.primary.main

  const gridColor     = isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.07)
  const tickColor     = isDark ? '#8b949e' : '#6b7280'
  const tooltipBg     = isDark ? '#1c2128' : '#ffffff'
  const tooltipBorder = isDark ? alpha('#ffffff', 0.10) : alpha('#000000', 0.10)
  const tooltipText   = isDark ? '#e6edf3' : '#1a1a2e'
  const tooltipSub    = isDark ? alpha('#ffffff', 0.55) : alpha('#000000', 0.45)

  const [page, setPage] = useState(0)

  // Reset to first page whenever the dataset changes
  useEffect(() => { setPage(0) }, [data])

  const totalPages   = pageSize !== undefined ? Math.ceil(data.length / pageSize) : 1
  const isPaginated  = pageSize !== undefined && data.length > 0

  const displayData = useMemo(() => {
    if (pageSize !== undefined) {
      return data.slice(page * pageSize, (page + 1) * pageSize)
    }
    return data.slice(0, maxItems)
  }, [data, page, pageSize, maxItems])

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

  const chartData: ChartEntry[] = displayData.map((item, i) => ({
    name: item.label,
    value: item.value,
    color: colorMap?.[item.label] ?? item.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    median: item.median,
  }))

  const tooltipRenderer = (props: { active?: boolean; payload?: Array<{ value: number; payload: ChartEntry }> }) => (
    <BarTooltip
      {...props}
      valueLabel={valueLabel}
      bg={tooltipBg}
      border={tooltipBorder}
      textColor={tooltipText}
      subColor={tooltipSub}
    />
  )

  // Range label e.g. "6 – 10 de 23"
  const rangeStart = isPaginated ? page * pageSize! + 1 : 1
  const rangeEnd   = isPaginated ? Math.min((page + 1) * pageSize!, data.length) : data.length

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
              content={tooltipRenderer}
              cursor={{ fill: isDark ? alpha('#ffffff', 0.04) : alpha('#000000', 0.04) }}
            />
            <Bar
              dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}
              onClick={onBarClick ? (d: ChartEntry) => onBarClick(d.name) : undefined}
              style={{ cursor: onBarClick ? 'pointer' : undefined }}
            >
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
              content={tooltipRenderer}
              cursor={{ fill: isDark ? alpha('#ffffff', 0.04) : alpha('#000000', 0.04) }}
            />
            <Bar
              dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}
              onClick={onBarClick ? (d: ChartEntry) => onBarClick(d.name) : undefined}
              style={{ cursor: onBarClick ? 'pointer' : undefined }}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* ── Pagination controls ───────────────────────────────────────────── */}
      {isPaginated && totalPages > 1 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 1.5,
            pt: 1.5,
            borderTop: `1px solid ${gridColor}`,
          }}
        >
          {/* Range label */}
          <Typography
            sx={{
              fontSize: '0.72rem',
              color: 'text.disabled',
              letterSpacing: '0.01em',
              minWidth: 80,
            }}
          >
            {rangeStart}–{rangeEnd} <Box component="span" sx={{ opacity: 0.6 }}>de</Box> {data.length}
          </Typography>

          {/* Dot indicators + arrows */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Pill dots */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <Box
                  key={i}
                  onClick={() => setPage(i)}
                  sx={{
                    width: i === page ? 18 : 6,
                    height: 6,
                    borderRadius: '999px',
                    bgcolor: i === page
                      ? primary
                      : isDark ? alpha('#ffffff', 0.18) : alpha('#000000', 0.12),
                    cursor: 'pointer',
                    transition: 'width 0.22s ease, background-color 0.15s',
                    '&:hover': {
                      bgcolor: i === page ? primary : isDark ? alpha('#ffffff', 0.32) : alpha('#000000', 0.24),
                    },
                  }}
                />
              ))}
            </Box>

            {/* Chevron buttons */}
            <IconButton
              size="small"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              sx={{
                width: 26, height: 26,
                border: `1px solid ${isDark ? alpha('#ffffff', 0.1) : alpha('#000000', 0.1)}`,
                borderRadius: '8px',
                color: 'text.secondary',
                transition: 'border-color 0.15s, color 0.15s',
                '&:hover:not(:disabled)': {
                  borderColor: alpha(primary, 0.5),
                  color: primary,
                  bgcolor: alpha(primary, 0.06),
                },
                '&:disabled': { opacity: 0.3 },
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: 16 }} />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              sx={{
                width: 26, height: 26,
                border: `1px solid ${isDark ? alpha('#ffffff', 0.1) : alpha('#000000', 0.1)}`,
                borderRadius: '8px',
                color: 'text.secondary',
                transition: 'border-color 0.15s, color 0.15s',
                '&:hover:not(:disabled)': {
                  borderColor: alpha(primary, 0.5),
                  color: primary,
                  bgcolor: alpha(primary, 0.06),
                },
                '&:disabled': { opacity: 0.3 },
              }}
            >
              <ChevronRightIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  )
}
