// Heatmap chart — rows = entities/analysts, columns = phases.
// Built with pure MUI/CSS (no chart library) for full style control.
// Cell intensity encodes process count; each column uses its phase colour.

import { useMemo } from 'react'
import { Box, Typography, Skeleton, Tooltip, useTheme, alpha } from '@mui/material'

export interface HeatmapRow {
  entity: string
  total: number
  cells: {
    phase:  number
    label:  string   // short phase label for the column header
    count:  number
    color:  string   // phase color
  }[]
}

interface HeatmapChartProps {
  data:      HeatmapRow[]
  loading?:  boolean
  height?:   number
  /** If true, only rows that have at least one non-zero cell are shown */
  hideEmpty?: boolean
}

const LABEL_W   = 76    // px — entity name column (first name only)
const TOTAL_W   = 36    // px — total column
const CELL_H    = 28    // px — row height
const HEADER_H  = 36    // px

/** Returns the first word of a name, title-cased. */
function firstName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? name
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

export function HeatmapChart({
  data,
  loading,
  height = 310,
  hideEmpty = true,
}: HeatmapChartProps) {
  const theme  = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const filtered = useMemo(
    () => (hideEmpty ? data.filter((r) => r.total > 0) : data),
    [data, hideEmpty],
  )

  const maxCount = useMemo(
    () => Math.max(1, ...filtered.flatMap((r) => r.cells.map((c) => c.count))),
    [filtered],
  )

  const phases = filtered[0]?.cells ?? []

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />
  }

  if (!filtered.length) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height, color: 'text.disabled' }}>
        <Typography variant="body2">Sem processos ativos.</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height, display: 'flex', flexDirection: 'column' }}>

      {/* ── Scrollable grid ─────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

        {/* Column headers (sticky) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            height: HEADER_H,
            position: 'sticky',
            top: 0,
            zIndex: 2,
            bgcolor: 'background.paper',
            borderBottom: `1px solid ${isDark ? alpha('#fff', 0.07) : alpha('#000', 0.07)}`,
            pb: 0.5,
          }}
        >
          {/* Label spacer */}
          <Box sx={{ width: LABEL_W, flexShrink: 0 }} />

          {/* Phase column headers */}
          {phases.map((cell) => (
            <Tooltip key={cell.phase} title={cell.label} placement="top" arrow>
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.4,
                  cursor: 'default',
                }}
              >
                {/* Color dot */}
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: cell.color,
                    boxShadow: isDark ? `0 0 6px ${alpha(cell.color, 0.7)}` : 'none',
                  }}
                />
                <Typography
                  sx={{
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    color: cell.color,
                    lineHeight: 1,
                    letterSpacing: '0.02em',
                  }}
                >
                  F{cell.phase}
                </Typography>
              </Box>
            </Tooltip>
          ))}

          {/* Total header */}
          <Box sx={{ width: TOTAL_W, flexShrink: 0, textAlign: 'right', pr: 0.5 }}>
            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'text.disabled', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Tot.
            </Typography>
          </Box>
        </Box>

        {/* Data rows */}
        {filtered.map((row, ri) => (
          <Box
            key={row.entity}
            sx={{
              display: 'flex',
              alignItems: 'center',
              height: CELL_H + 4,
              px: 0,
              bgcolor: ri % 2 === 0
                ? 'transparent'
                : isDark ? alpha('#fff', 0.015) : alpha('#000', 0.012),
              '&:hover': {
                bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03),
              },
              transition: 'background-color 0.12s',
            }}
          >
            {/* Entity label — first name only; full name in tooltip */}
            <Tooltip title={row.entity} placement="right" arrow>
              <Typography
                sx={{
                  width: LABEL_W,
                  flexShrink: 0,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  pr: 0.75,
                  lineHeight: 1,
                }}
              >
                {firstName(row.entity)}
              </Typography>
            </Tooltip>

            {/* Cells */}
            {row.cells.map((cell) => {
              const intensity = cell.count === 0 ? 0 : 0.14 + 0.76 * (cell.count / maxCount)
              const textDark  = intensity > 0.52
              const cellBg    = cell.count === 0
                ? (isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03))
                : alpha(cell.color, intensity)

              return (
                <Tooltip
                  key={cell.phase}
                  title={
                    cell.count > 0
                      ? `${row.entity} · F${cell.phase}: ${cell.count} processo${cell.count !== 1 ? 's' : ''}`
                      : ''
                  }
                  placement="top"
                  arrow
                  disableHoverListener={cell.count === 0}
                >
                  <Box
                    sx={{
                      flex: 1,
                      height: CELL_H,
                      mx: '2px',
                      borderRadius: '5px',
                      bgcolor: cellBg,
                      border: cell.count > 0
                        ? `1px solid ${alpha(cell.color, isDark ? intensity + 0.15 : intensity - 0.05)}`
                        : `1px solid ${isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: cell.count > 0 ? 'default' : 'default',
                      transition: 'transform 0.12s ease, box-shadow 0.12s ease',
                      '&:hover': cell.count > 0 ? {
                        transform: 'scaleY(1.12)',
                        boxShadow: `0 2px 10px ${alpha(cell.color, 0.35)}`,
                        zIndex: 1,
                      } : {},
                    }}
                  >
                    {cell.count > 0 && (
                      <Typography
                        sx={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          lineHeight: 1,
                          color: textDark
                            ? 'rgba(255,255,255,0.92)'
                            : cell.color,
                          userSelect: 'none',
                        }}
                      >
                        {cell.count}
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              )
            })}

            {/* Row total */}
            <Box sx={{ width: TOTAL_W, flexShrink: 0, textAlign: 'right', pr: 0.5 }}>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary' }}>
                {row.total}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 0.75,
          pt: 1,
          borderTop: `1px solid ${isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06)}`,
        }}
      >
        <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>Menos</Typography>
        <Box
          sx={{
            width: 72,
            height: 6,
            borderRadius: 1,
            background: `linear-gradient(to right,
              ${alpha(theme.palette.primary.main, 0.10)},
              ${alpha(theme.palette.primary.main, 0.90)})`,
          }}
        />
        <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>Mais</Typography>
      </Box>
    </Box>
  )
}
