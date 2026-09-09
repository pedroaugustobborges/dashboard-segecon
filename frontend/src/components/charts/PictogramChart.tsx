// Pictogram chart — each row is a person; icons represent N processes each.
// Inspired by unit/waffle charts: gives an intuitive, human-scaled view of volume.
// Top entry is accent-coloured; others are muted. Rows light up on hover.

import { useMemo, useState, useEffect } from 'react'
import { Box, Typography, Skeleton, Tooltip, IconButton, useTheme, alpha } from '@mui/material'
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation'
import ChevronLeftIcon  from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

export interface PictogramEntry {
  label: string
  value: number
}

interface PictogramChartProps {
  data: PictogramEntry[]
  loading?: boolean
  accentColor?: string
  /** Maximum rows to display before pagination kicks in (default 50) */
  maxItems?: number
  /** Rows per page (default 5) */
  pageSize?: number
  /** Maximum icons rendered per row (default 12) — scale is derived from this */
  maxIcons?: number
  /** Called when the user clicks an entry row */
  onEntryClick?: (label: string) => void
  /** Icon component rendered as the pictogram unit (default: IconComponent) */
  IconComponent?: React.ElementType
  /** Unit label shown in the legend, e.g. "processo" or "dia" */
  valueLabel?: string
}

const ICON_PX = 20   // icon font-size
const ICON_GAP = 3   // gap between icons (px)

export function PictogramChart({
  data,
  loading,
  accentColor,
  maxItems = 200,
  pageSize = 5,
  maxIcons = 12,
  onEntryClick,
  IconComponent = MedicalInformationIcon,
  valueLabel = 'processo',
}: PictogramChartProps) {
  const theme  = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const accent = accentColor ?? theme.palette.primary.main

  const [page, setPage] = useState(0)

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.value - a.value).slice(0, maxItems),
    [data, maxItems],
  )

  // Reset to first page when data changes
  useEffect(() => { setPage(0) }, [data])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated  = sorted.slice(page * pageSize, (page + 1) * pageSize)

  const maxVal    = sorted[0]?.value ?? 1
  // How many real processes each icon represents
  const iconUnit  = Math.max(1, Math.ceil(maxVal / maxIcons))
  // Total icon slots for the track background (always maxIcons wide)
  const trackIcons = maxIcons

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Skeleton width={160} height={14} />
            <Skeleton width={32} height={14} />
            <Skeleton width={`${60 - i * 5}%`} height={14} />
          </Box>
        ))}
      </Box>
    )
  }

  if (!sorted.length) {
    return (
      <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 4 }}>
        Sem dados disponíveis.
      </Typography>
    )
  }

  return (
    <Box>
      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          mb: 2.5,
          px: 1.25,
          py: 0.5,
          borderRadius: '8px',
          bgcolor: isDark ? alpha(accent, 0.08) : alpha(accent, 0.06),
          border: `1px solid ${alpha(accent, 0.18)}`,
        }}
      >
        <IconComponent sx={{ fontSize: 13, color: accent }} />
        <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 500 }}>
          = {iconUnit} {valueLabel}{iconUnit !== 1 && valueLabel === 'processo' ? 's' : ''}
        </Typography>
      </Box>

      {/* ── Rows ───────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {paginated.map((entry, idx) => {
          const globalIdx = page * pageSize + idx
          const isTop     = globalIdx === 0
          const iconCount = Math.max(1, Math.round(entry.value / iconUnit))
          const iconColor = isTop
            ? accent
            : isDark ? alpha('#fff', 0.20) : alpha('#000', 0.18)
          const hoverColor = isTop ? accent : alpha(accent, 0.55)

          return (
            <Tooltip
              key={entry.label}
              title={`${entry.label}: ${entry.value} ${valueLabel}${entry.value !== 1 && valueLabel === 'processo' ? 's' : ''}`}
              placement="top"
              arrow
            >
              <Box
                onClick={() => onEntryClick?.(entry.label)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1,
                  py: 0.6,
                  borderRadius: '10px',
                  transition: 'background-color 0.15s',
                  cursor: onEntryClick ? 'pointer' : 'default',
                  '&:hover': {
                    bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03),
                    '& .pict-icon': { color: hoverColor },
                    '& .pict-name': { color: isTop ? accent : 'text.primary' },
                  },
                }}
              >
                {/* Rank badge */}
                <Typography
                  sx={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: isTop ? accent : 'text.disabled',
                    width: 16,
                    flexShrink: 0,
                    textAlign: 'right',
                    lineHeight: 1,
                  }}
                >
                  {globalIdx + 1}
                </Typography>

                {/* Name */}
                <Typography
                  className="pict-name"
                  sx={{
                    fontSize: '0.78rem',
                    fontWeight: isTop ? 700 : 400,
                    color: isTop ? 'text.primary' : 'text.secondary',
                    width: 150,
                    flexShrink: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s',
                  }}
                >
                  {entry.label}
                </Typography>

                {/* Count */}
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: isTop ? accent : 'text.disabled',
                    width: 28,
                    flexShrink: 0,
                    textAlign: 'right',
                  }}
                >
                  {entry.value}
                </Typography>

                {/* Icon track — ghost icons as background scale + real icons on top */}
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  {/* Ghost track (full scale reference) */}
                  <Box sx={{ display: 'flex', gap: `${ICON_GAP}px`, position: 'absolute', left: 0 }}>
                    {Array.from({ length: trackIcons }, (_, i) => (
                      <IconComponent
                        key={i}
                        sx={{
                          fontSize: ICON_PX,
                          color: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05),
                        }}
                      />
                    ))}
                  </Box>

                  {/* Filled icons */}
                  <Box sx={{ display: 'flex', gap: `${ICON_GAP}px`, position: 'relative' }}>
                    {Array.from({ length: Math.min(iconCount, trackIcons) }, (_, i) => (
                      <IconComponent
                        key={i}
                        className="pict-icon"
                        sx={{
                          fontSize: ICON_PX,
                          color: iconColor,
                          filter: isTop && isDark
                            ? `drop-shadow(0 0 4px ${alpha(accent, 0.45)})`
                            : 'none',
                          transition: 'color 0.15s ease, filter 0.15s ease',
                        }}
                      />
                    ))}
                    {/* Spacer to keep row width stable when iconCount < trackIcons */}
                    {iconCount < trackIcons && (
                      <Box
                        sx={{
                          width: (trackIcons - iconCount) * (ICON_PX + ICON_GAP) - ICON_GAP,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Overflow indicator when value > maxIcons * iconUnit */}
                {iconCount >= trackIcons && entry.value > trackIcons * iconUnit && (
                  <Typography sx={{ fontSize: '0.65rem', color: accent, fontWeight: 700, ml: 0.5 }}>
                    +{entry.value - trackIcons * iconUnit}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          )
        })}
      </Box>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mt: 2 }}>
          <IconButton
            size="small"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            sx={{
              border: `1px solid ${isDark ? alpha('#fff', 0.12) : alpha('#000', 0.12)}`,
              borderRadius: '8px',
              '&:not(:disabled):hover': { borderColor: alpha(accent, 0.4), color: accent },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 16 }} />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <Box
                key={i}
                onClick={() => setPage(i)}
                sx={{
                  width: i === page ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: i === page ? accent : isDark ? alpha('#fff', 0.2) : alpha('#000', 0.15),
                  cursor: 'pointer',
                  transition: 'width 0.2s ease, background-color 0.2s ease',
                  '&:hover': { bgcolor: i === page ? accent : alpha(accent, 0.5) },
                }}
              />
            ))}
          </Box>

          <IconButton
            size="small"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            sx={{
              border: `1px solid ${isDark ? alpha('#fff', 0.12) : alpha('#000', 0.12)}`,
              borderRadius: '8px',
              '&:not(:disabled):hover': { borderColor: alpha(accent, 0.4), color: accent },
            }}
          >
            <ChevronRightIcon sx={{ fontSize: 16 }} />
          </IconButton>

          <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} de {sorted.length}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
