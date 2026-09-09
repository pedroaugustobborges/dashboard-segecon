// Treemap chart — hierarchical view of processes by phase → entity.
// Uses Recharts Treemap with a fully custom SVG content renderer so tiles
// match the dashboard's dark/light palette exactly.

import React from 'react'
import { Box, Typography, Skeleton, useTheme, alpha } from '@mui/material'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'

export interface TreemapGroup {
  name: string
  color?: string
  children: { name: string; size: number; color?: string; [key: string]: any }[]
  [key: string]: any
}

interface TreemapChartProps {
  data: TreemapGroup[]
  loading?: boolean
  height?: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function truncate(text: string, maxPx: number, fontSize = 9): string {
  const max = Math.floor(maxPx / (fontSize * 0.58))
  return text.length <= max ? text : text.slice(0, max - 1) + '…'
}

function renderContent(props: any, isDark: boolean): React.ReactElement {
  const { x, y, width, height, depth, name, value, color } = props
  if (!width || !height || width < 4 || height < 4) return null

  const c       = color ?? '#00897b'
  const textRgb = '255,255,255'

  // ── Depth 1: Phase group ────────────────────────────────────────────────────
  if (depth === 1) {
    return (
      <g>
        <rect
          x={x + 1} y={y + 1}
          width={Math.max(0, width - 2)} height={Math.max(0, height - 2)}
          fill={alpha(c, isDark ? 0.14 : 0.09)}
          stroke={alpha(c, isDark ? 0.45 : 0.32)}
          strokeWidth={1.5}
          rx={9}
        />
        {width > 36 && height > 14 && (
          <text
            x={x + 9} y={y + 14}
            fill={c}
            fontSize={9}
            fontWeight={800}
            letterSpacing={0.8}
            style={{ textTransform: 'uppercase', fontFamily: 'inherit' }}
          >
            {truncate(name, width - 16, 9)}
          </text>
        )}
      </g>
    )
  }

  // ── Depth 2: Entity leaf ────────────────────────────────────────────────────
  if (depth === 2) {
    const innerW    = width - 4
    const innerH    = height - 4
    const showName  = innerW > 28 && innerH > 14
    const showCount = innerW > 22 && innerH > 26
    const cx        = x + width / 2
    const cy        = y + height / 2

    return (
      <g>
        <rect
          x={x + 2} y={y + 2}
          width={Math.max(0, innerW)} height={Math.max(0, innerH)}
          fill={alpha(c, isDark ? 0.42 : 0.28)}
          stroke={alpha(c, isDark ? 0.60 : 0.45)}
          strokeWidth={1}
          rx={6}
        />
        {showName && (
          <text
            x={cx}
            y={showCount ? cy - 4 : cy + 4}
            textAnchor="middle"
            fill={`rgba(${textRgb},${isDark ? 0.92 : 0.88})`}
            fontSize={9}
            fontWeight={600}
            style={{ fontFamily: 'inherit' }}
          >
            {truncate(name, innerW - 6, 9)}
          </text>
        )}
        {showCount && (
          <text
            x={cx} y={cy + 10}
            textAnchor="middle"
            fill={`rgba(${textRgb},${isDark ? 0.60 : 0.55})`}
            fontSize={8}
            fontWeight={700}
            style={{ fontFamily: 'inherit' }}
          >
            {value}
          </text>
        )}
      </g>
    )
  }

  return <></>
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, isDark }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item || item.depth === 1 || !item.name) return null
  const c = item.color ?? '#00897b'

  return (
    <Box
      sx={{
        px: 1.5, py: 1,
        bgcolor: isDark ? alpha('#1a1e2a', 0.97) : alpha('#fff', 0.97),
        border: `1px solid ${alpha(c, 0.30)}`,
        borderRadius: '8px',
        boxShadow: `0 4px 20px ${alpha('#000', isDark ? 0.45 : 0.12)}`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c, flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.primary' }}>
          {item.name}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', pl: '16px' }}>
        {item.value} processo{item.value !== 1 ? 's' : ''}
      </Typography>
    </Box>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export function TreemapChart({ data, loading, height = 310 }: TreemapChartProps) {
  const theme  = useTheme()
  const isDark = theme.palette.mode === 'dark'

  if (loading) {
    return <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />
  }

  if (!data.length) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height, color: 'text.disabled' }}>
        <Typography variant="body2">Sem processos ativos.</Typography>
      </Box>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Treemap
        data={data}
        dataKey="size"
        aspectRatio={4 / 3}
        content={(props: any) => renderContent(props, isDark) as any}
      >
        <Tooltip
          content={(props: any) => <CustomTooltip {...props} isDark={isDark} />}
          cursor={false}
        />
      </Treemap>
    </ResponsiveContainer>
  )
}
