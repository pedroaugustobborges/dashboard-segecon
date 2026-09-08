// Global filter bar — sticky at top of every data page.
// All state is in the URL (via useGlobalFilters).
// Analista users have their Unidade filter locked to their assigned entidades.

import {
  Box, Autocomplete, TextField, Chip, FormControlLabel, Switch,
  Button, Divider, Paper, useTheme,
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/pt-br'
import { useGlobalFilters } from '../../hooks/useGlobalFilters'
import { useDistinctEntidades } from '../../hooks/useProcessoContrato'
import { useUserRole } from '../../hooks/useUserRole'
import { strings } from '../../i18n/strings.pt-BR'

const PRIORIDADE_OPTIONS = ['Imediata', 'Urgente', 'Programa']

export function GlobalFilterBar() {
  const theme = useTheme()
  const [filters, setFilters] = useGlobalFilters()
  const { data: allEntidades = [], isLoading: entidadesLoading } = useDistinctEntidades()
  const { isAnalista, scopedEntidades } = useUserRole()

  // Analista: lock entidades to their assigned ones
  const entidadeOptions = isAnalista ? scopedEntidades : allEntidades
  const entidadesLocked = isAnalista

  function handleClear() {
    setFilters({
      entidades: isAnalista ? scopedEntidades : [],
      solicitacao_tipo: [],
      dataInicio: undefined,
      dataFim: undefined,
      incluirCancelados: false,
      departamentos: [],
    })
  }

  const hasActiveFilters = Boolean(
    (filters.entidades?.length && !isAnalista) ||
    filters.solicitacao_tipo?.length ||
    filters.dataInicio ||
    filters.dataFim ||
    filters.incluirCancelados,
  )

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          top: 64, // below the AppBar (TOPBAR_HEIGHT)
          zIndex: theme.zIndex.appBar - 1,
          borderRadius: 0,
          borderBottom: `1px solid ${theme.palette.divider}`,
          px: 3,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mr: 1 }}>
          <FilterListIcon fontSize="small" />
        </Box>

        {/* Unidade (entidade) */}
        <Autocomplete
          multiple
          size="small"
          options={entidadeOptions}
          value={filters.entidades ?? []}
          onChange={(_, v) => setFilters({ ...filters, entidades: v })}
          disabled={entidadesLocked || entidadesLoading}
          renderInput={(params) => (
            <TextField {...params} label={strings.filters.unidade} sx={{ minWidth: 200 }} />
          )}
          renderTags={(value, getTagProps) =>
            value.map((opt, i) => {
              const tagProps = getTagProps({ index: i })
              return <Chip {...tagProps} label={opt} size="small" />
            })
          }
          limitTags={2}
        />

        {/* Prioridade */}
        <Autocomplete
          multiple
          size="small"
          options={PRIORIDADE_OPTIONS}
          value={filters.solicitacao_tipo ?? []}
          onChange={(_, v) => setFilters({ ...filters, solicitacao_tipo: v })}
          renderInput={(params) => (
            <TextField {...params} label={strings.filters.prioridade} sx={{ minWidth: 160 }} />
          )}
          renderTags={(value, getTagProps) =>
            value.map((opt, i) => {
              const tagProps = getTagProps({ index: i })
              return <Chip {...tagProps} label={opt} size="small" />
            })
          }
          limitTags={2}
        />

        {/* Date range */}
        <DatePicker
          label={`${strings.filters.periodo} (de)`}
          value={filters.dataInicio ? dayjs(filters.dataInicio) : null}
          onChange={(v: Dayjs | null) => setFilters({ ...filters, dataInicio: v?.format('YYYY-MM-DD') })}
          slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
        />
        <DatePicker
          label={`${strings.filters.periodo} (até)`}
          value={filters.dataFim ? dayjs(filters.dataFim) : null}
          onChange={(v: Dayjs | null) => setFilters({ ...filters, dataFim: v?.format('YYYY-MM-DD') })}
          slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
        />

        {/* Cancelados toggle */}
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={filters.incluirCancelados ?? false}
              onChange={(e) => setFilters({ ...filters, incluirCancelados: e.target.checked })}
            />
          }
          label={<Box component="span" sx={{ fontSize: '0.8rem' }}>{strings.filters.incluirCancelados}</Box>}
        />

        {/* Clear */}
        {hasActiveFilters && (
          <>
            <Divider orientation="vertical" flexItem />
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClear}
              color="inherit"
              sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}
            >
              {strings.filters.limpar}
            </Button>
          </>
        )}
      </Paper>
    </LocalizationProvider>
  )
}
