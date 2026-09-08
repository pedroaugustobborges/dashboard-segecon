import { Typography, Tooltip, IconButton, Paper } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { strings } from '../../i18n/strings.pt-BR'

interface Props {
  title: string          // pt-BR indicator title
  missingSource: string  // e.g. "Tabela: processo_contrato_fase1_aprovacao_solicitacao"
  details?: string       // optional longer explanation
}

export function UnavailableIndicator({ title, missingSource, details }: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        borderStyle: 'dashed',
        borderColor: 'warning.main',
        bgcolor: 'warning.50',
        color: 'text.secondary',
      }}
    >
      <WarningAmberIcon sx={{ color: 'warning.main', fontSize: 36 }} />
      <Typography variant="subtitle2" fontWeight={600} textAlign="center">
        {title}
      </Typography>
      <Typography variant="body2" textAlign="center">
        {strings.gaps.indicadorIndisponivel}
      </Typography>
      <Typography variant="caption" textAlign="center" color="text.disabled">
        {missingSource}
      </Typography>
      {details && (
        <Tooltip title={details} arrow>
          <IconButton size="small">
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Paper>
  )
}
