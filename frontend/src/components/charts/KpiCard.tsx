// KPI metric card — icon + label + big number + optional delta badge.
// Accent color controls the icon container tint, background glow, and hover shadow.

import { Card, CardContent, Typography, Box, Skeleton, Tooltip, useTheme, alpha } from '@mui/material'
import TrendingUpIcon   from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

interface KpiCardProps {
  label: string
  value: number | string
  unit?: string
  delta?: number
  deltaLabel?: string
  color?: string
  tooltip?: string
  loading?: boolean
  icon?: React.ReactNode
  formatValue?: (v: number | string) => string
  onClick?: () => void
}

export function KpiCard({
  label, value, unit, delta, deltaLabel, color, tooltip, loading, icon, formatValue, onClick,
}: KpiCardProps) {
  const theme  = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const accent = color ?? theme.palette.primary.main
  const displayValue = formatValue ? formatValue(value) : value

  if (loading) {
    return (
      <Card sx={{ height: '100%', minHeight: 140 }}>
        <CardContent>
          <Skeleton variant="rounded" width={44} height={44} sx={{ mb: 2, borderRadius: '14px' }} />
          <Skeleton width="65%" height={14} />
          <Skeleton width="50%" height={44} sx={{ mt: 0.75 }} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        minHeight: 140,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isDark
            ? `0 0 0 1px ${alpha(accent, 0.30)}, 0 8px 32px ${alpha('#000', 0.55)}, 0 0 20px ${alpha(accent, 0.12)}`
            : `0 8px 28px ${alpha(accent, 0.18)}, 0 1px 0 ${alpha('#000', 0.04)}`,
        },
      }}
    >
      {/* Decorative radial glow — top-right corner */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: -28,
          right: -28,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(accent, isDark ? 0.20 : 0.13)} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <CardContent sx={{ position: 'relative', p: 2, '&:last-child': { pb: 2 } }}>
        {/* Icon + tooltip */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          {icon ? (
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                bgcolor: alpha(accent, isDark ? 0.18 : 0.10),
                border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.20)}`,
                boxShadow: isDark ? `0 0 18px ${alpha(accent, 0.22)}` : 'none',
                '& svg': { fontSize: 24, color: accent },
              }}
            >
              {icon}
            </Box>
          ) : (
            // Fallback: glowing accent pill (no icon provided)
            <Box
              sx={{
                width: 36, height: 4, borderRadius: 2,
                bgcolor: accent,
                boxShadow: isDark ? `0 0 10px ${alpha(accent, 0.7)}` : 'none',
                mt: 1,
              }}
            />
          )}

          {tooltip && (
            <Tooltip title={tooltip} arrow placement="top">
              <InfoOutlinedIcon sx={{ fontSize: 15, color: 'text.disabled', mt: 0.5, cursor: 'help' }} />
            </Tooltip>
          )}
        </Box>

        {/* Label */}
        <Typography
          sx={{
            fontSize: '0.67rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'text.secondary',
            mb: 0.5,
            lineHeight: 1.3,
          }}
        >
          {label}
        </Typography>

        {/* Value */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, flexWrap: 'wrap' }}>
          <Typography
            sx={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              color: 'text.primary',
            }}
          >
            {displayValue}
          </Typography>
          {unit && (
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: 'text.secondary', lineHeight: 1 }}>
              {unit}
            </Typography>
          )}
        </Box>

        {/* Clickable hint */}
        {onClick && (
          <Typography
            sx={{
              mt: 1.25,
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.03em',
              color: accent,
              opacity: 0.65,
              transition: 'opacity 0.15s',
              '.MuiCard-root:hover &': { opacity: 1 },
            }}
          >
            Ver processos →
          </Typography>
        )}

        {/* Delta badge */}
        {delta !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.4,
                px: 0.8,
                py: 0.3,
                borderRadius: '7px',
                bgcolor: alpha(delta >= 0 ? '#4caf50' : '#f44336', isDark ? 0.18 : 0.10),
                border: `1px solid ${alpha(delta >= 0 ? '#4caf50' : '#f44336', isDark ? 0.32 : 0.20)}`,
              }}
            >
              {delta >= 0
                ? <TrendingUpIcon sx={{ fontSize: 12, color: 'success.main' }} />
                : <TrendingDownIcon sx={{ fontSize: 12, color: 'error.main' }} />}
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: delta >= 0 ? 'success.main' : 'error.main', lineHeight: 1 }}>
                {delta > 0 ? '+' : ''}{delta}%
              </Typography>
            </Box>
            {deltaLabel && (
              <Typography variant="caption" color="text.disabled">{deltaLabel}</Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
