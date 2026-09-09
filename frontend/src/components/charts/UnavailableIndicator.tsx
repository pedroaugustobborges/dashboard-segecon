import { Box, Typography, Tooltip, IconButton, useTheme, alpha } from '@mui/material'
import InfoOutlinedIcon  from '@mui/icons-material/InfoOutlined'
import WarningAmberIcon  from '@mui/icons-material/WarningAmber'
import { strings } from '../../i18n/strings.pt-BR'

interface Props {
  title: string
  missingSource: string
  details?: string
}

export function UnavailableIndicator({ title, missingSource, details }: Props) {
  const theme   = useTheme()
  const isDark  = theme.palette.mode === 'dark'
  const warning = theme.palette.warning.main   // #f57c00 / #ffa726

  return (
    <Box
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        borderRadius: '14px',
        border: `1px dashed ${alpha(warning, isDark ? 0.45 : 0.4)}`,
        bgcolor: alpha(warning, isDark ? 0.07 : 0.05),
        backdropFilter: isDark ? 'blur(8px)' : 'none',
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(warning, isDark ? 0.18 : 0.12),
          border: `1px solid ${alpha(warning, isDark ? 0.35 : 0.25)}`,
          boxShadow: isDark ? `0 0 16px ${alpha(warning, 0.25)}` : 'none',
          mb: 0.5,
        }}
      >
        <WarningAmberIcon sx={{ color: warning, fontSize: 26 }} />
      </Box>

      <Typography
        sx={{ fontSize: '0.875rem', fontWeight: 700, color: 'text.primary', textAlign: 'center' }}
      >
        {title}
      </Typography>

      <Typography
        sx={{ fontSize: '0.8rem', color: 'text.secondary', textAlign: 'center' }}
      >
        {strings.gaps.indicadorIndisponivel}
      </Typography>

      <Typography
        sx={{
          fontSize: '0.72rem',
          color: 'text.disabled',
          textAlign: 'center',
          fontFamily: 'monospace',
          bgcolor: isDark ? alpha('#ffffff', 0.04) : alpha('#000', 0.04),
          px: 1.25,
          py: 0.5,
          borderRadius: '6px',
          border: `1px solid ${isDark ? alpha('#ffffff', 0.07) : alpha('#000', 0.07)}`,
        }}
      >
        {missingSource}
      </Typography>

      {details && (
        <Tooltip title={details} arrow>
          <IconButton size="small" sx={{ color: 'text.disabled', mt: 0.25 }}>
            <InfoOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  )
}
