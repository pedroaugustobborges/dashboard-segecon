// Generic, prop-driven process detail table.
// Used by every "Detalhamento" view across all phases.
// Supports: column definitions, sorting, client-side pagination, text search, CSV export.

import { useState, useMemo } from 'react'
import {
  Box, Table, TableHead, TableBody, TableRow, TableCell,
  TableSortLabel, TablePagination, TableContainer, Paper,
  TextField, InputAdornment, IconButton, Tooltip, Skeleton,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import DownloadIcon from '@mui/icons-material/Download'
import { exportToCsv } from '../../services/exportCsv'
import { strings } from '../../i18n/strings.pt-BR'

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
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)
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

  // Loading state
  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 0.5, borderRadius: 1 }} />
        ))}
      </Box>
    )
  }

  return (
    <Box>
      {/* Toolbar: search + export */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder={strings.processos.search}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ flex: 1, maxWidth: 480 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Tooltip title={strings.processos.exportCsv}>
          <IconButton onClick={handleExport} size="small" color="primary">
            <DownloadIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="caption" color="text.secondary">
          {sorted.length} {strings.processos.of} {rows.length}
        </Typography>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  align={col.align ?? 'left'}
                  sx={{ fontWeight: 700, whiteSpace: 'nowrap', width: col.width, bgcolor: 'grey.50' }}
                >
                  {col.sortable !== false ? (
                    <TableSortLabel
                      active={sortKey === col.key}
                      direction={sortKey === col.key ? sortDir : 'asc'}
                      onClick={() => handleSort(col.key)}
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
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                  {strings.processos.noResults}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  hover
                  sx={{ '&:last-child td': { border: 0 } }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} align={col.align ?? 'left'} sx={{ whiteSpace: 'nowrap' }}>
                      {col.renderCell ? col.renderCell(row) : (col.getValue(row) ?? '—')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
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
      />
    </Box>
  )
}
