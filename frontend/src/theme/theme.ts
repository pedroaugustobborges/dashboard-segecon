import { createTheme } from '@mui/material/styles'

// Color tokens — defined once, referenced everywhere
const tokens = {
  teal: {
    50:  '#e0f7f6',
    100: '#b2ece9',
    500: '#00897b',
    600: '#00796b',
    700: '#00695c',
  },
  grey: {
    50:  '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    800: '#424242',
    900: '#212121',
  },
  error:   '#d32f2f',
  warning: '#f57c00',
  success: '#388e3c',
}

// Semantic color mapping for solicitacao_tipo (Prioridade)
// Used consistently across EVERY chart — configured once here
export const prioridadeColors: Record<string, string> = {
  Imediata: '#0288d1', // clinical blue
  Urgente:  '#f57c00', // warning orange
  Programa: '#00897b', // teal
}

// Distinct colors for the 8 phases of the procurement process
export const phaseColors: Record<number, string> = {
  1: '#00897b', // teal — Fase 1
  2: '#0288d1', // clinical blue — Fase 2
  3: '#7b1fa2', // purple — Fase 3
  4: '#f57c00', // orange — Fase 4
  5: '#388e3c', // green — Fase 5
  6: '#c62828', // red — Fase 6
  7: '#5e35b1', // deep purple — Fase 7
  8: '#0097a7', // cyan — Fase 8
}

export const theme = createTheme({
  palette: {
    primary: {
      main:  tokens.teal[500],
      light: tokens.teal[100],
      dark:  tokens.teal[700],
    },
    background: {
      default: '#f4f6f8',
      paper:   '#ffffff',
    },
    error:   { main: tokens.error },
    warning: { main: tokens.warning },
    success: { main: tokens.success },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle2: { fontWeight: 500 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow:       '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)',
          border:          '1px solid',
          borderColor:     'rgba(255,255,255,0.9)',
          backgroundImage: 'linear-gradient(145deg, #ffffff 0%, #f9fbfc 100%)',
          borderRadius:    14,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight:    600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
        },
      },
    },
  },
})
