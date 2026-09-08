// Provides app-wide color mode (light / dark) with localStorage persistence.
// Wrap the app root with <AppThemeProvider>; consume with useColorMode().

import { createContext, useContext, useState, useMemo } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import type { PaletteMode } from '@mui/material'
import { createAppTheme } from './theme'

interface ColorModeCtx {
  mode: PaletteMode
  toggleColorMode: () => void
}

const ColorModeContext = createContext<ColorModeCtx>({
  mode: 'light',
  toggleColorMode: () => {},
})

export function useColorMode() {
  return useContext(ColorModeContext)
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(() => {
    return (localStorage.getItem('sigcon-color-mode') as PaletteMode) ?? 'light'
  })

  const colorMode = useMemo<ColorModeCtx>(() => ({
    mode,
    toggleColorMode: () => {
      setMode((prev) => {
        const next = prev === 'light' ? 'dark' : 'light'
        localStorage.setItem('sigcon-color-mode', next)
        return next
      })
    },
  }), [mode])

  const theme = useMemo(() => createAppTheme(mode), [mode])

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}
