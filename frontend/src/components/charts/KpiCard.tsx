import { Card, CardContent, Typography, Box, Skeleton, Tooltip } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

interface KpiCardProps {
  label: string
  value: number | string
  unit?: string
  delta?: number          // % change, positive = up, negative = down
  deltaLabel?: string     // e.g. "vs. mês anterior"
  color?: string          // accent color for the left border
  tooltip?: string
  loading?: boolean
  formatValue?: (v: number | string) => string
}

export function KpiCard({
  label, value, unit, delta, deltaLabel, color, tooltip, loading, formatValue,
}: KpiCardProps) {
  const displayValue = formatValue ? formatValue(value) : value

  if (loading) {
    return (
      <Card sx={{ borderLeft: '4px solid', borderColor: color ?? 'primary.main', height: '100%' }}>
        <CardContent>
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={48} sx={{ mt: 1 }} />
          <Skeleton width="50%" height={16} sx={{ mt: 0.5 }} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      sx={{
        borderLeft: '4px solid',
        borderColor: color ?? 'primary.main',
        height: '100%',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500} textTransform="uppercase" letterSpacing="0.05em">
            {label}
          </Typography>
          {tooltip && (
            <Tooltip title={tooltip} arrow>
              <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled', ml: 0.5, mt: 0.25 }} />
            </Tooltip>
          )}
        </Box>

        <Typography variant="h4" fontWeight={700} color="text.primary" lineHeight={1.1}>
          {displayValue}
          {unit && (
            <Typography component="span" variant="body1" color="text.secondary" ml={0.5}>
              {unit}
            </Typography>
          )}
        </Typography>

        {delta !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            {delta >= 0
              ? <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
              : <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
            }
            <Typography variant="caption" color={delta >= 0 ? 'success.main' : 'error.main'} fontWeight={600}>
              {delta > 0 ? '+' : ''}{delta}%
            </Typography>
            {deltaLabel && (
              <Typography variant="caption" color="text.disabled">
                {deltaLabel}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
