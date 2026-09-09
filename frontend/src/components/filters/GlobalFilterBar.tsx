// Global filter bar — sticky at top of every data page.
// Glassmorphism background, colored selection chips, active-filter badge.
// All state is in the URL (via useGlobalFilters).
// Analista users have their Unidade filter locked to their assigned entidades.

import {
  Box, Autocomplete, TextField, Chip, FormControlLabel, Switch,
  Button, Divider, useTheme, alpha, Typography, Badge,
} from '@mui/material'
import TuneIcon  from '@mui/icons-material/Tune'
import ClearIcon from '@mui/icons-material/Clear'
import { DatePicker }         from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs }       from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { type Dayjs }  from 'dayjs'
import 'dayjs/locale/pt-br'
import { useGlobalFilters }      from '../../hooks/useGlobalFilters'
import { useDistinctEntidades }  from '../../hooks/useProcessoContrato'
import { useUserRole }           from '../../hooks/useUserRole'
import { prioridadeColors }      from '../../theme/theme'
import { strings }               from '../../i18n/strings.pt-BR'

const PRIORIDADE_OPTIONS = ['Imediata', 'Urgente', 'Programa']

// Shared input sx: make all fields the same height / border style
const inputSx = { height: 36 }

export function GlobalFilterBar() {
  const theme  = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const primary = theme.palette.primary.main

  const [filters, setFilters] = useGlobalFilters()
  const { data: allEntidades = [], isLoading: entidadesLoading } = useDistinctEntidades()
  const { isAnalista, scopedEntidades } = useUserRole()

  const entidadeOptions = isAnalista ? scopedEntidades : allEntidades
  const entidadesLocked = isAnalista

  function handleClear() {
    setFilters({
      entidades:        isAnalista ? scopedEntidades : [],
      solicitacao_tipo: [],
      dataInicio:       undefined,
      dataFim:          undefined,
      incluirCancelados: false,
      departamentos:    [],
    })
  }

  // Count active filters for the badge
  const activeCount =
    ((filters.entidades?.length && !isAnalista) ? 1 : 0) +
    (filters.solicitacao_tipo?.length ? 1 : 0) +
    (filters.dataInicio ? 1 : 0) +
    (filters.dataFim ? 1 : 0) +
    (filters.incluirCancelados ? 1 : 0)

  const hasActiveFilters = activeCount > 0

  // Shared outer sx for grouped filter sections
  const groupSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    bgcolor: isDark ? alpha('#ffffff', 0.04) : alpha('#000000', 0.025),
    border: `1px solid ${isDark ? alpha('#ffffff', 0.07) : alpha('#000000', 0.07)}`,
    borderRadius: '12px',
    px: 1.5,
    py: 0.5,
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: theme.zIndex.appBar - 1,
          borderBottom: `1px solid ${isDark ? alpha('#ffffff', 0.07) : alpha('#000000', 0.07)}`,
          px: 1.5,
          py: 0.75,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          // Single row — scrolls horizontally on very small screens instead of wrapping
          flexWrap: 'nowrap',
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          // Frosted glass
          bgcolor: isDark ? alpha('#161b22', 0.88) : alpha('#ffffff', 0.88),
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: isDark
            ? `0 1px 0 ${alpha('#ffffff', 0.04)}, 0 2px 12px ${alpha('#000', 0.3)}`
            : `0 1px 0 ${alpha('#000', 0.04)}, 0 2px 8px ${alpha('#000', 0.04)}`,
        }}
      >
        {/* Filter icon + label */}
        <Badge
          badgeContent={activeCount}
          color="primary"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.6rem',
              height: 16,
              minWidth: 16,
              boxShadow: isDark ? `0 0 8px ${alpha(primary, 0.6)}` : 'none',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: hasActiveFilters ? primary : 'text.secondary',
              transition: 'color 0.15s',
            }}
          >
            <TuneIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Filtros
            </Typography>
          </Box>
        </Badge>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.25, my: 0.5 }} />

        {/* ── Unidade ── */}
        <Autocomplete
          multiple
          size="small"
          options={entidadeOptions}
          value={filters.entidades ?? []}
          onChange={(_, v) => setFilters({ ...filters, entidades: v })}
          disabled={entidadesLocked || entidadesLoading}
          limitTags={2}
          renderInput={(params) => (
            <TextField
              {...params}
              label={strings.filters.unidade}
              sx={{
                minWidth: 160,
                '& .MuiInputBase-root': inputSx,
              }}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((opt, i) => {
              const { key, ...tagProps } = getTagProps({ index: i })
              return (
                <Chip
                  key={key}
                  {...tagProps}
                  label={opt}
                  size="small"
                  sx={{
                    bgcolor: alpha(primary, isDark ? 0.22 : 0.12),
                    color: primary,
                    border: `1px solid ${alpha(primary, isDark ? 0.35 : 0.25)}`,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 22,
                    '& .MuiChip-deleteIcon': { color: primary, opacity: 0.7 },
                  }}
                />
              )
            })
          }
        />

        {/* ── Prioridade ── */}
        <Autocomplete
          multiple
          size="small"
          options={PRIORIDADE_OPTIONS}
          value={filters.solicitacao_tipo ?? []}
          onChange={(_, v) => setFilters({ ...filters, solicitacao_tipo: v })}
          limitTags={2}
          renderInput={(params) => (
            <TextField
              {...params}
              label={strings.filters.prioridade}
              sx={{
                minWidth: 135,
                '& .MuiInputBase-root': inputSx,
              }}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((opt, i) => {
              const { key, ...tagProps } = getTagProps({ index: i })
              const chipColor = prioridadeColors[opt] ?? primary
              return (
                <Chip
                  key={key}
                  {...tagProps}
                  label={opt}
                  size="small"
                  sx={{
                    bgcolor: alpha(chipColor, isDark ? 0.22 : 0.12),
                    color: chipColor,
                    border: `1px solid ${alpha(chipColor, isDark ? 0.35 : 0.25)}`,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 22,
                    '& .MuiChip-deleteIcon': { color: chipColor, opacity: 0.7 },
                  }}
                />
              )
            })
          }
        />

        {/* ── Date range group ── */}
        <Box sx={groupSx}>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {strings.filters.periodo}
          </Typography>
          <DatePicker
            value={filters.dataInicio ? dayjs(filters.dataInicio) : null}
            onChange={(v: Dayjs | null) => setFilters({ ...filters, dataInicio: v?.format('YYYY-MM-DD') })}
            slotProps={{
              textField: {
                size: 'small',
                placeholder: 'De',
                label: undefined,
                sx: {
                  width: 112,
                  '& .MuiInputBase-root': { ...inputSx, bgcolor: 'transparent' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: primary },
                },
              },
            }}
          />
          <Box sx={{ width: 12, height: 1, bgcolor: 'divider', flexShrink: 0 }} />
          <DatePicker
            value={filters.dataFim ? dayjs(filters.dataFim) : null}
            onChange={(v: Dayjs | null) => setFilters({ ...filters, dataFim: v?.format('YYYY-MM-DD') })}
            slotProps={{
              textField: {
                size: 'small',
                placeholder: 'Até',
                label: undefined,
                sx: {
                  width: 112,
                  '& .MuiInputBase-root': { ...inputSx, bgcolor: 'transparent' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: primary },
                },
              },
            }}
          />
        </Box>

        {/* ── Cancelados toggle ── */}
        <Box sx={groupSx}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={filters.incluirCancelados ?? false}
                onChange={(e) => setFilters({ ...filters, incluirCancelados: e.target.checked })}
                sx={{
                  '& .MuiSwitch-thumb': {
                    boxShadow: filters.incluirCancelados && isDark
                      ? `0 0 6px ${alpha(primary, 0.6)}`
                      : undefined,
                  },
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                {strings.filters.incluirCancelados}
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Box>

        {/* ── Clear ── */}
        {hasActiveFilters && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.25, my: 0.5 }} />
            <Button
              size="small"
              startIcon={<ClearIcon sx={{ fontSize: '14px !important' }} />}
              onClick={handleClear}
              variant="outlined"
              color="error"
              sx={{
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                px: 1.25,
                py: 0.5,
                whiteSpace: 'nowrap',
                borderColor: alpha(theme.palette.error.main, isDark ? 0.4 : 0.3),
                color: 'error.main',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                  borderColor: 'error.main',
                },
              }}
            >
              {strings.filters.limpar}
            </Button>
          </>
        )}
      </Box>
    </LocalizationProvider>
  )
}
