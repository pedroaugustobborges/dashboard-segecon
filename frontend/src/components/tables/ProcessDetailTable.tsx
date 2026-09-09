// Generic, prop-driven process detail table.
// Used by every "Detalhamento" view across all phases.
// Supports: column definitions, sorting, client-side pagination, text search, CSV export.

import { useState, useMemo } from 'react'
import {
  Box, Table, TableHead, TableBody, TableRow, TableCell,
  TableSortLabel, TablePagination, TableContainer,
  TextField, InputAdornment, IconButton, Tooltip, Skeleton,
  Typography, useTheme, alpha, Chip,
} from '@mui/material'
import SearchIcon      from '@mui/icons-material/Search'
import DownloadIcon    from '@mui/icons-material/FileDownload'
import InboxIcon       from '@mui/icons-material/Inbox'
import { exportToCsv } from '../../services/exportCsv'
import { strings }     from '../../i18n/strings.pt-BR'

export interface ColumnDef<T> {
  key: string
  header: string
  getValue: (row: T) => string | number | null | undefined  // used for sorting + CSV
  renderCell?: (row: T) => React.ReactNode                  // optional custom renderer
  sortable?: boolean
  width?: number | string
  align?: 'left' | 'right' | 'center'
}

interface ProcessDetailTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[]
  rows: T[]
  loading?: boolean
  searchFields?: Array<keyof T>   // fields to search across
  filename?: string               // CSV download filename (no extension)
  rowKey: (row: T) => string | number
}

type SortDir = 'asc' | 'desc'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export function ProcessDetailTable<T extends Record<string, unknown>>({
  columns, rows, loading, searchFields = [], filename = 'processos', rowKey,
}: ProcessDetailTableProps<T>) {
  const theme   = useTheme()
  const isDark  = theme.palette.mode === 'dark'
  const primary = theme.palette.primary.main

  const [search, setSearch]         = useState('')
  const [sortKey, setSortKey]       = useState<string | null>(null)
  const [sortDir, setSortDir]       = useState<SortDir>('asc')
  const [page, setPage]             = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  // Filter by search text
  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter((row) =>
      searchFields.some((field) => {
        const val = row[field]
        return val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      }),
    )
  }, [rows, search, searchFields])

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const col = columns.find((c) => c.key === sortKey)
    if (!col) return filtered
    return [...filtered].sort((a, b) => {
      const av = col.getValue(a) ?? ''
      const bv = col.getValue(b) ?? ''
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'pt-BR')
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir, columns])

  // Paginate
  const paginated = useMemo(
    () => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage],
  )

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPage(0)
  }

  function handleExport() {
    const exportRows = sorted.map((row) => {
      const obj: Record<string, unknown> = {}
      columns.forEach((col) => { obj[col.key] = col.getValue(row) ?? '' })
      return obj
    })
    const headerMap = Object.fromEntries(columns.map((c) => [c.key, c.header]))
    exportToCsv(filename, exportRows as Record<string, unknown>[], headerMap)
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={40} sx={{ mb: 2, borderRadius: 2 }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={44} sx={{ mb: 0.5, borderRadius: 1 }} />
        ))}
      </Box>
    )
  }

  const headerBg   = isDark ? alpha('#ffffff', 0.05) : alpha('#000000', 0.025)
  const rowHoverBg = isDark ? alpha(primary, 0.09)   : alpha(primary, 0.04)
  const borderColor = isDark ? alpha('#ffffff', 0.07) : alpha('#000000', 0.08)

  return (
    <Box>
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>

        {/* Search field */}
        <TextField
          size="small"
          placeholder={strings.processos.search}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{
            flex: 1,
            maxWidth: 440,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              bgcolor: isDark ? alpha('#ffffff', 0.04) : alpha('#000', 0.025),
              '& fieldset': { borderColor },
              '&:hover fieldset': { borderColor: alpha(primary, 0.4) },
              '&.Mui-focused fieldset': {
                borderColor: primary,
                boxShadow: `0 0 0 3px ${alpha(primary, 0.12)}`,
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Row count */}
        <Chip
          label={`${sorted.length} / ${rows.length}`}
          size="small"
          sx={{
            fontSize: '0.72rem',
            fontWeight: 600,
            height: 26,
            bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#000', 0.04),
            border: `1px solid ${borderColor}`,
            color: 'text.secondary',
          }}
        />

        {/* Export */}
        <Tooltip title={strings.processos.exportCsv}>
          <IconButton
            onClick={handleExport}
            size="small"
            sx={{
              border: `1px solid ${borderColor}`,
              borderRadius: '10px',
              color: 'text.secondary',
              bgcolor: isDark ? alpha('#ffffff', 0.04) : alpha('#000', 0.02),
              '&:hover': {
                color: primary,
                borderColor: alpha(primary, 0.4),
                bgcolor: alpha(primary, 0.08),
              },
              transition: 'all 0.15s ease',
            }}
          >
            <DownloadIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <TableContainer
        sx={{
          borderRadius: '14px',
          border: `1px solid ${borderColor}`,
          boxShadow: isDark
            ? `0 4px 24px ${alpha('#000', 0.3)}`
            : `0 2px 12px ${alpha('#000', 0.06)}`,
          overflow: 'hidden',
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  align={col.align ?? 'left'}
                  sx={{
                    width: col.width,
                    whiteSpace: 'nowrap',
                    bgcolor: headerBg,
                    borderBottom: `1px solid ${borderColor}`,
                    py: 1.25,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {col.sortable !== false ? (
                    <TableSortLabel
                      active={sortKey === col.key}
                      direction={sortKey === col.key ? sortDir : 'asc'}
                      onClick={() => handleSort(col.key)}
                      sx={{
                        '&.Mui-active': { color: primary },
                        '&.Mui-active .MuiTableSortLabel-icon': { color: primary },
                        '& .MuiTableSortLabel-icon': { fontSize: 14 },
                      }}
                    >
                      {col.header}
                    </TableSortLabel>
                  ) : (
                    col.header
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1.5,
                      py: 7,
                      color: 'text.disabled',
                    }}
                  >
                    <InboxIcon sx={{ fontSize: 40, opacity: 0.4 }} />
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {strings.processos.noResults}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, idx) => (
                <TableRow
                  key={rowKey(row)}
                  sx={{
                    bgcolor: idx % 2 === 1
                      ? (isDark ? alpha('#ffffff', 0.015) : alpha('#000', 0.008))
                      : 'transparent',
                    '&:hover': { bgcolor: rowHoverBg },
                    '&:last-child td': { border: 0 },
                    transition: 'background-color 0.12s ease',
                  }}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      align={col.align ?? 'left'}
                      sx={{
                        whiteSpace: 'nowrap',
                        py: 1,
                        fontSize: '0.8125rem',
                        borderBottom: `1px solid ${borderColor}`,
                        color: 'text.primary',
                      }}
                    >
                      {col.renderCell ? col.renderCell(row) : (col.getValue(row) ?? '—')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      <TablePagination
        component="div"
        count={sorted.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0) }}
        rowsPerPageOptions={PAGE_SIZE_OPTIONS}
        labelRowsPerPage={strings.processos.rowsPerPage}
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} ${strings.processos.of} ${count}`}
        sx={{
          mt: 0.5,
          '& .MuiTablePagination-toolbar': { px: 0 },
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontSize: '0.78rem',
            color: 'text.secondary',
          },
        }}
      />
    </Box>
  )
}
