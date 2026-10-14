import { useState, useMemo, useEffect } from 'react'
import {
  Box, Typography, Grid, Skeleton, Chip, Drawer,
  Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, LinearProgress, IconButton, useTheme, alpha, Tooltip,
} from '@mui/material'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import CloseIcon from '@mui/icons-material/Close'
import type { ContratoCatalogo } from '../../types/processoContrato.types'
import { fetchGestoresByContratoIds } from '../../services/contratoCatalogo'

// Days until a date ISO string. Negative = already expired.
function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const ms = new Date(dateStr).getTime() - Date.now()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('pt-BR') : '—'

const fmtBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
})

const BUCKETS = [
  { days: 120, label: 'até 120 dias', urgency: 0 },
  { days: 90,  label: 'até 90 dias',  urgency: 1 },
  { days: 60,  label: 'até 60 dias',  urgency: 2 },
  { days: 30,  label: 'até 30 dias',  urgency: 3 },
] as const

const BUCKET_COLORS = ['#b45309', '#d97706', '#ea580c', '#dc2626']

interface Props {
  catalogo: ContratoCatalogo[]
  loading: boolean
}

export function VigenciaWidget({ catalogo, loading }: Props) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [drawerBucket, setDrawerBucket] = useState<number | null>(null) // days threshold

  // Active contracts with a termino date that is in the future but within 120 days
  const upcomingContracts = useMemo(() => {
    return catalogo.filter((c) => {
      if (!c.data_termino) return false
      const d = daysUntil(c.data_termino)
      if (d === null) return false
      return d >= 0 && d <= 120
    })
  }, [catalogo])

  const bucketContracts = useMemo(() => {
    const map = new Map<number, ContratoCatalogo[]>()
    for (const b of BUCKETS) map.set(b.days, [])

    // Assign each contract to the single most-urgent bucket it qualifies for.
    // Buckets sorted ascending (30 → 60 → 90 → 120) so the first match is the tightest.
    const sortedBuckets = [...BUCKETS].sort((a, b) => a.days - b.days)
    for (const c of upcomingContracts) {
      const d = daysUntil(c.data_termino)
      if (d === null) continue
      const bucket = sortedBuckets.find((b) => d <= b.days)
      if (bucket) map.get(bucket.days)!.push(c)
    }
    return map
  }, [upcomingContracts])

  const drawerContracts = drawerBucket !== null ? (bucketContracts.get(drawerBucket) ?? []) : []
  const drawerLabel = BUCKETS.find((b) => b.days === drawerBucket)?.label ?? ''

  // Fetch gestores when the drawer opens
  const [gestorMap, setGestorMap] = useState<Map<number, string>>(new Map())
  useEffect(() => {
    if (drawerBucket === null || drawerContracts.length === 0) return
    const ids = drawerContracts
      .map((c) => c.id_controle_contrato)
      .filter((id): id is number => id !== null)
    if (!ids.length) return
    fetchGestoresByContratoIds(ids).then(setGestorMap).catch(() => {/* silently ignore */})
  }, [drawerBucket, drawerContracts])

  return (
    <>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <EventBusyIcon sx={{ fontSize: 16, color: BUCKET_COLORS[2] }} />
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary' }}>
            Vigência — contratos que vencem em
          </Typography>
        </Box>

        {loading ? (
          <Grid container spacing={1.5}>
            {BUCKETS.map((b) => (
              <Grid item xs={6} sm={3} key={b.days}>
                <Skeleton variant="rectangular" height={72} sx={{ borderRadius: '8px' }} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={1.5}>
            {BUCKETS.map((b, i) => {
              const count = bucketContracts.get(b.days)?.length ?? 0
              const color = BUCKET_COLORS[i]
              return (
                <Grid item xs={6} sm={3} key={b.days}>
                  <Box
                    onClick={() => setDrawerBucket(b.days)}
                    sx={{
                      borderLeft: `4px solid ${color}`,
                      borderRadius: '0 8px 8px 0',
                      bgcolor: isDark ? alpha(color, 0.12) : alpha(color, 0.06),
                      border: `1px solid ${alpha(color, isDark ? 0.25 : 0.18)}`,
                      borderLeftWidth: 4,
                      px: 1.75,
                      py: 1.25,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s, border-color 0.15s',
                      '&:hover': {
                        bgcolor: isDark ? alpha(color, 0.2) : alpha(color, 0.1),
                        borderColor: alpha(color, 0.45),
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color, lineHeight: 1.1 }}>
                      {count}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.25 }}>
                      {b.label}
                    </Typography>
                  </Box>
                </Grid>
              )
            })}
          </Grid>
        )}
        {!loading && upcomingContracts.length === 0 && (
          <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled', mt: 1 }}>
            Nenhum contrato com vigência vencendo nos próximos 120 dias.
          </Typography>
        )}
      </Box>

      {/* ── Vigência Drawer ─────────────────────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={drawerBucket !== null}
        onClose={() => setDrawerBucket(null)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 780 }, bgcolor: 'background.default', display: 'flex', flexDirection: 'column' },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3, py: 2.5, flexShrink: 0,
            background: isDark
              ? `linear-gradient(135deg, ${alpha(BUCKET_COLORS[2], 0.18)} 0%, ${alpha(BUCKET_COLORS[2], 0.06)} 100%)`
              : `linear-gradient(135deg, ${alpha(BUCKET_COLORS[2], 0.10)} 0%, ${alpha(BUCKET_COLORS[2], 0.03)} 100%)`,
            borderBottom: `1px solid ${isDark ? alpha('#fff', 0.08) : alpha('#000', 0.07)}`,
            borderLeft: `3px solid ${BUCKET_COLORS[2]}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: BUCKET_COLORS[2], textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>
                Vigência de Contratos
              </Typography>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Contratos vencendo {drawerLabel}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setDrawerBucket(null)}
              size="small"
              sx={{
                mt: 0.25,
                border: `1px solid ${isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1)}`,
                borderRadius: '8px',
                '&:hover': { borderColor: alpha(BUCKET_COLORS[2], 0.4), color: BUCKET_COLORS[2] },
              }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, flexWrap: 'wrap' }}>
            <Box sx={{ px: 1.5, py: 0.6, borderRadius: '8px', bgcolor: alpha(BUCKET_COLORS[2], isDark ? 0.12 : 0.08), border: `1px solid ${alpha(BUCKET_COLORS[2], 0.25)}` }}>
              <Typography sx={{ fontSize: '0.65rem', color: isDark ? alpha('#fff', 0.5) : alpha('#000', 0.45), lineHeight: 1 }}>Contratos</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: BUCKET_COLORS[2], lineHeight: 1.4 }}>{drawerContracts.length}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Table */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {drawerContracts.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.disabled' }}>
              <Typography variant="body2">Nenhum contrato encontrado.</Typography>
            </Box>
          ) : (
            <TableContainer sx={{ borderRadius: '12px', border: `1px solid ${isDark ? alpha('#fff', 0.07) : alpha('#000', 0.07)}` }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['Contrato / Nome', 'Gestor do Contrato', 'Unidade', 'Início', 'Término', 'Dias Restantes', 'Valor Estimado', 'Consumido'].map((h) => (
                      <TableCell key={h} sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...drawerContracts]
                    .sort((a, b) => {
                      const da = daysUntil(a.data_termino) ?? 999
                      const db = daysUntil(b.data_termino) ?? 999
                      return da - db
                    })
                    .map((c, idx) => {
                      const days = daysUntil(c.data_termino)
                      const urgentColor = days !== null && days <= 30 ? '#dc2626' : days !== null && days <= 60 ? '#ea580c' : days !== null && days <= 90 ? '#d97706' : '#b45309'
                      return (
                        <TableRow
                          key={c.id}
                          sx={{
                            bgcolor: idx % 2 === 0 ? 'transparent' : isDark ? alpha('#fff', 0.02) : alpha('#000', 0.015),
                            '&:last-child td': { border: 0 },
                          }}
                        >
                          <TableCell sx={{ maxWidth: 220 }}>
                            <Tooltip title={c.nome ?? ''} placement="top" enterDelay={400} disableInteractive>
                              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 210 }}>
                                {c.nome ?? '—'}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.78rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.id_controle_contrato != null
                              ? (gestorMap.get(c.id_controle_contrato) ?? '—')
                              : '—'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{c.entidade ?? '—'}</TableCell>
                          <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{fmtDate(c.data_inicio)}</TableCell>
                          <TableCell sx={{ fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap', color: urgentColor }}>{fmtDate(c.data_termino)}</TableCell>
                          <TableCell>
                            {days !== null ? (
                              <Chip
                                label={`${days}d`}
                                size="small"
                                sx={{
                                  height: 20, fontSize: '0.65rem', fontWeight: 700,
                                  bgcolor: alpha(urgentColor, 0.12), color: urgentColor,
                                  border: `1px solid ${alpha(urgentColor, 0.3)}`,
                                }}
                              />
                            ) : '—'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap', textAlign: 'right' }}>
                            {c.valor_estimado != null ? fmtBRL.format(c.valor_estimado) : '—'}
                          </TableCell>
                          <TableCell sx={{ minWidth: 130 }}>
                            {c.percentual_consumido != null ? (
                              <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                                  <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>{c.percentual_consumido.toFixed(1)}%</Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(c.percentual_consumido, 100)}
                                  sx={{
                                    height: 4, borderRadius: 2,
                                    bgcolor: alpha(urgentColor, 0.15),
                                    '& .MuiLinearProgress-bar': { bgcolor: urgentColor, borderRadius: 2 },
                                  }}
                                />
                              </Box>
                            ) : '—'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Drawer>
    </>
  )
}
