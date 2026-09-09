// Generic process-detail drawer — opened when the user clicks a chart bar.
// Accepts any slice of ProcessoContrato[] and renders a summary + table.
// Used by: Visão Geral (por unidade, por fase), and can replace PhaseView's
// inline drawer in the future.

import {
  Box, Typography, Drawer, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Chip, IconButton, Divider, useTheme, alpha,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { derivePhaseInfo } from '../../hooks/useDerivedStatus'
import { phaseColors, prioridadeColors } from '../../theme/theme'
import { totalLeadTimeDays, PHASE_LABELS, fmtDate } from '../../utils/processoUtils'
import type { ProcessoContrato, FaseKey } from '../../types/processoContrato.types'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProcessDrawerProps {
  open: boolean
  onClose: () => void
  /** Main heading shown in the drawer header */
  title: string
  /** Optional secondary line below the title (e.g. "Fase 4 – Análise Cotação") */
  subtitle?: string
  /** Left-border / accent colour matching the originating chart */
  accentColor?: string
  processes: ProcessoContrato[]
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Lead-time colour: green ≤ 30 d · amber ≤ 60 d · red > 60 d */
function ltColor(days: number): string {
  if (days <= 30) return '#4caf50'
  if (days <= 60) return '#f59e0b'
  return '#ef4444'
}

/** Sort: active processes first (by phase asc), completed last (by lead time desc). */
function sortProcessos(processes: ProcessoContrato[]): ProcessoContrato[] {
  return [...processes].sort((a, b) => {
    const ai = derivePhaseInfo(a)
    const bi = derivePhaseInfo(b)
    // completed → sink to bottom
    if (ai.status === 'completed' && bi.status !== 'completed') return 1
    if (bi.status === 'completed' && ai.status !== 'completed') return -1
    // both active → sort by phase asc
    if (ai.currentPhase !== null && bi.currentPhase !== null)
      return ai.currentPhase - bi.currentPhase
    // both completed → sort by lead time desc
    const la = totalLeadTimeDays(a) ?? 0
    const lb = totalLeadTimeDays(b) ?? 0
    return lb - la
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProcessDrawer({ open, onClose, title, subtitle, accentColor, processes }: ProcessDrawerProps) {
  const theme   = useTheme()
  const isDark  = theme.palette.mode === 'dark'
  const accent  = accentColor ?? theme.palette.primary.main

  const completed  = processes.filter((p) => derivePhaseInfo(p).status === 'completed')
  const active     = processes.filter((p) => derivePhaseInfo(p).status !== 'completed')

  const completedDays = completed
    .map(totalLeadTimeDays)
    .filter((d): d is number => d !== null && d >= 0)
  const avgDays = completedDays.length
    ? Math.round(completedDays.reduce((s, v) => s + v, 0) / completedDays.length * 10) / 10
    : null

  const sorted = sortProcessos(processes)

  const summaryChips = [
    { label: 'Total',      value: processes.length, color: accent },
    { label: 'Ativos',     value: active.length,    color: '#3b82f6' },
    { label: 'Concluídos', value: completed.length, color: '#4caf50' },
    ...(avgDays !== null ? [{ label: 'Média Lead Time', value: `${avgDays} d`, color: accent }] : []),
  ]

  const TABLE_HEADERS = ['Processo', 'Entidade', 'Prioridade', 'Fase Atual', 'Início Fase 1', 'Lead Time']

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 720 },
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 3, py: 2.5, flexShrink: 0,
          background: isDark
            ? `linear-gradient(135deg, ${alpha(accent, 0.18)} 0%, ${alpha(accent, 0.06)} 100%)`
            : `linear-gradient(135deg, ${alpha(accent, 0.10)} 0%, ${alpha(accent, 0.03)} 100%)`,
          borderBottom: `1px solid ${isDark ? alpha('#fff', 0.08) : alpha('#000', 0.07)}`,
          borderLeft: `3px solid ${accent}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            {subtitle && (
              <Typography sx={{
                fontSize: '0.68rem', fontWeight: 700, color: accent,
                textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5,
              }}>
                {subtitle}
              </Typography>
            )}
            <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {title}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              mt: 0.25,
              border: `1px solid ${isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1)}`,
              borderRadius: '8px',
              '&:hover': { borderColor: alpha(accent, 0.4), color: accent },
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        {/* Summary chips */}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
          {summaryChips.map(({ label, value, color }) => (
            <Box
              key={label}
              sx={{
                px: 1.5, py: 0.6, borderRadius: '8px',
                bgcolor: alpha(color, isDark ? 0.12 : 0.08),
                border: `1px solid ${alpha(color, 0.25)}`,
              }}
            >
              <Typography sx={{ fontSize: '0.65rem', color: isDark ? alpha('#fff', 0.5) : alpha('#000', 0.45), lineHeight: 1 }}>
                {label}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color, lineHeight: 1.4 }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {processes.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.disabled' }}>
            <Typography variant="body2">Nenhum processo encontrado.</Typography>
          </Box>
        ) : (
          <TableContainer
            sx={{
              borderRadius: '12px',
              border: `1px solid ${isDark ? alpha('#fff', 0.07) : alpha('#000', 0.07)}`,
              boxShadow: isDark ? `0 2px 12px ${alpha('#000', 0.3)}` : `0 1px 6px ${alpha('#000', 0.05)}`,
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {TABLE_HEADERS.map((h, i) => (
                    <TableCell
                      key={h}
                      align={i === TABLE_HEADERS.length - 1 ? 'right' : 'left'}
                      sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.map((p, idx) => {
                  const { currentPhase, status } = derivePhaseInfo(p)
                  const lt = totalLeadTimeDays(p)
                  const isCompleted = status === 'completed'
                  const prioColor = prioridadeColors[p.solicitacao_tipo ?? ''] ?? alpha(isDark ? '#fff' : '#000', 0.3)

                  return (
                    <TableRow
                      key={p.id}
                      sx={{
                        bgcolor: idx % 2 === 0 ? 'transparent' : isDark ? alpha('#fff', 0.02) : alpha('#000', 0.015),
                        '&:last-child td': { border: 0 },
                      }}
                    >
                      {/* Processo */}
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {p.solicitacao_numero ?? `#${p.id_controle_sc ?? p.id}`}
                      </TableCell>

                      {/* Entidade */}
                      <TableCell sx={{ fontSize: '0.78rem', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.entidade ?? '—'}
                      </TableCell>

                      {/* Prioridade */}
                      <TableCell>
                        {p.solicitacao_tipo ? (
                          <Chip
                            label={p.solicitacao_tipo}
                            size="small"
                            sx={{
                              height: 20, fontSize: '0.65rem', fontWeight: 700,
                              bgcolor: alpha(prioColor, 0.15),
                              color: prioColor,
                              border: `1px solid ${alpha(prioColor, 0.3)}`,
                            }}
                          />
                        ) : '—'}
                      </TableCell>

                      {/* Fase Atual */}
                      <TableCell>
                        {isCompleted ? (
                          <Chip
                            label="Concluído"
                            size="small"
                            sx={{
                              height: 20, fontSize: '0.65rem', fontWeight: 700,
                              bgcolor: alpha('#4caf50', 0.12), color: '#4caf50',
                              border: `1px solid ${alpha('#4caf50', 0.3)}`,
                            }}
                          />
                        ) : currentPhase !== null ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{
                              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                              bgcolor: phaseColors[currentPhase as FaseKey] ?? accent,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                                {currentPhase}
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                              {PHASE_LABELS[currentPhase as FaseKey]}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>—</Typography>
                        )}
                      </TableCell>

                      {/* Início Fase 1 */}
                      <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {fmtDate(p.fase1_data_inicio_sc)}
                      </TableCell>

                      {/* Lead Time */}
                      <TableCell align="right">
                        {lt !== null ? (
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: ltColor(lt) }}>
                            {lt}d
                          </Typography>
                        ) : (
                          <Chip
                            label="Em andamento"
                            size="small"
                            sx={{
                              height: 18, fontSize: '0.62rem', fontWeight: 600,
                              bgcolor: alpha('#f59e0b', 0.12), color: '#f59e0b',
                              border: `1px solid ${alpha('#f59e0b', 0.3)}`,
                            }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Divider sx={{ my: 2 }} />
        <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', textAlign: 'center' }}>
          Lead Time Total = dias entre Início da Fase 1 e o fim da última fase concluída.
        </Typography>
      </Box>
    </Drawer>
  )
}
