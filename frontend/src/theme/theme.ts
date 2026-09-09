import { createTheme, alpha } from '@mui/material/styles'
import type { PaletteMode } from '@mui/material'

// ── Brand color tokens ────────────────────────────────────────────────────────
const teal = {
  50:  '#e0f7f6',
  100: '#b2ece9',
  400: '#26a69a',
  500: '#00897b',
  600: '#00796b',
  700: '#00695c',
}

// ── Semantic chart colors — referenced by every chart, never hardcoded ────────
// Keys must match the exact solicitacao_tipo values stored in the database.
// Scale: yellow (planned) → red (urgent) → dark-red (immediate).
export const prioridadeColors: Record<string, string> = {
  Imediata:   '#f59e0b',  // amber-400 — yellow, high visibility but not alarm
  Urgente:    '#ef4444',  // red-500   — clear red alarm signal
  Programada: '#3b82f6',  // blue-500  — calm blue, planned/steady
}

export const phaseColors: Record<number, string> = {
  1: '#00897b',
  2: '#0288d1',
  3: '#7b1fa2',
  4: '#f57c00',
  5: '#388e3c',
  6: '#c62828',
  7: '#5e35b1',
  8: '#0097a7',
}

// ── Theme factory — called once per mode change ───────────────────────────────
export function createAppTheme(mode: PaletteMode) {
  const isDark = mode === 'dark'

  // Surface tokens differ per mode
  const bg      = isDark ? '#0d1117' : '#f0f2f5'
  const paper   = isDark ? '#161b22' : '#ffffff'
  const paper2  = isDark ? '#1c2128' : '#f8fafc'
  const primary = isDark ? teal[400] : teal[500]

  // Border glow: in dark, bright white edge; in light, glass-white shimmer
  const cardBorder = isDark
    ? `1px solid ${alpha('#ffffff', 0.10)}`
    : `1px solid ${alpha('#ffffff', 0.85)}`
  const cardBg = isDark
    ? `linear-gradient(145deg, ${alpha('#ffffff', 0.05)} 0%, ${alpha('#ffffff', 0.02)} 100%)`
    : `linear-gradient(145deg, #ffffff 0%, #f9fbfc 100%)`
  const cardShadow = isDark
    ? `0 0 0 1px ${alpha('#26a69a', 0.08)}, 0 2px 4px ${alpha('#000', 0.5)}, 0 8px 24px ${alpha('#000', 0.35)}`
    : `0 1px 0 ${alpha('#000', 0.04)}, 0 4px 16px ${alpha('#000', 0.07)}`

  return createTheme({
    palette: {
      mode,
      primary: {
        main:  primary,
        light: isDark ? teal[400] : teal[100],
        dark:  teal[700],
      },
      background: {
        default: bg,
        paper,
      },
      divider: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.08),
      text: {
        primary:   isDark ? '#e6edf3' : '#1a1a2e',
        secondary: isDark ? '#8b949e' : '#6b7280',
        disabled:  isDark ? '#484f58' : '#9ca3af',
      },
      action: {
        hover:    isDark ? alpha('#ffffff', 0.06) : alpha('#000000', 0.04),
        selected: isDark ? alpha(teal[400], 0.16) : alpha(teal[500], 0.10),
      },
      error:   { main: '#f44336' },
      warning: { main: '#ff9800' },
      success: { main: '#4caf50' },
      info:    { main: '#2196f3' },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button:  { fontWeight: 600, textTransform: 'none' as const },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      // ── Cards — glass-morphism border + luminous shadow ────────────────────
      MuiCard: {
        styleOverrides: {
          root: {
            border:          cardBorder,
            boxShadow:       cardShadow,
            backgroundImage: cardBg,
            backgroundColor: paper,
            borderRadius:    16,
            transition:      'box-shadow 0.2s ease, transform 0.2s ease',
            '&:hover': {
              boxShadow: isDark
                ? `0 0 0 1px ${alpha('#26a69a', 0.20)}, 0 4px 8px ${alpha('#000', 0.6)}, 0 12px 32px ${alpha('#000', 0.4)}`
                : `0 1px 0 ${alpha('#000', 0.04)}, 0 8px 28px ${alpha('#000', 0.11)}`,
            },
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            '&:last-child': { paddingBottom: 20 },
          },
        },
      },
      // ── Paper ─────────────────────────────────────────────────────────────
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: paper,
          },
          outlined: {
            border: cardBorder,
          },
        },
      },
      // ── Buttons ───────────────────────────────────────────────────────────
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontWeight: 600,
            textTransform: 'none',
          },
          containedPrimary: {
            background: isDark
              ? `linear-gradient(135deg, ${teal[400]} 0%, ${teal[600]} 100%)`
              : `linear-gradient(135deg, ${teal[500]} 0%, ${teal[700]} 100%)`,
            boxShadow: isDark
              ? `0 0 12px ${alpha(teal[400], 0.35)}`
              : `0 2px 8px ${alpha(teal[500], 0.30)}`,
            '&:hover': {
              boxShadow: isDark
                ? `0 0 20px ${alpha(teal[400], 0.5)}`
                : `0 4px 12px ${alpha(teal[500], 0.40)}`,
            },
          },
        },
      },
      // ── Chips ─────────────────────────────────────────────────────────────
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 8,
          },
        },
      },
      // ── Table ─────────────────────────────────────────────────────────────
      MuiTableCell: {
        styleOverrides: {
          root: {
            fontSize: '0.8125rem',
            borderColor: isDark ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06),
          },
          head: {
            backgroundColor: isDark ? paper2 : '#f8fafc',
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: isDark ? '#8b949e' : '#6b7280',
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            border: cardBorder,
            boxShadow: isDark ? `0 2px 12px ${alpha('#000', 0.35)}` : `0 1px 6px ${alpha('#000', 0.06)}`,
          },
        },
      },
      // ── Inputs ────────────────────────────────────────────────────────────
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: isDark ? alpha('#ffffff', 0.04) : alpha('#000000', 0.02),
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? alpha('#ffffff', 0.12) : alpha('#000000', 0.15),
              transition: 'border-color 0.2s',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? alpha('#ffffff', 0.25) : alpha('#000000', 0.28),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: primary,
              boxShadow: `0 0 0 3px ${alpha(primary, 0.18)}`,
            },
          },
        },
      },
      // ── Autocomplete ──────────────────────────────────────────────────────
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: cardBorder,
            boxShadow: isDark
              ? `0 8px 32px ${alpha('#000', 0.5)}`
              : `0 8px 24px ${alpha('#000', 0.12)}`,
          },
        },
      },
      // ── List / Sidebar items ───────────────────────────────────────────────
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            transition: 'background-color 0.15s, box-shadow 0.15s',
          },
        },
      },
      // ── Drawer ────────────────────────────────────────────────────────────
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
          },
        },
      },
      // ── Divider ───────────────────────────────────────────────────────────
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.08),
          },
        },
      },
      // ── Tooltip ───────────────────────────────────────────────────────────
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: '0.75rem',
            backgroundColor: isDark ? '#2d333b' : '#1a1a2e',
            boxShadow: `0 4px 16px ${alpha('#000', 0.3)}`,
          },
          arrow: {
            color: isDark ? '#2d333b' : '#1a1a2e',
          },
        },
      },
      // ── Switch ────────────────────────────────────────────────────────────
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-thumb': {
              boxShadow: `0 2px 6px ${alpha('#000', 0.25)}`,
            },
          },
        },
      },
    },
  })
}

// Convenience default (light) — kept for any file that still imports `theme` directly
export const theme = createAppTheme('light')
