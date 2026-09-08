import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from './theme/theme'
import { AuthProvider } from './features/auth/AuthContext'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import LoginPage from './features/auth/LoginPage'
import OverviewPage from './features/overview/index'
import Fase1AnaliseContrato from './features/fase1-analise-contrato/index'
import Fase1AprovacaoSolicitacao from './features/fase1-aprovacao-solicitacao/index'
import Fase2 from './features/fase2-preparacao-cotacao/index'
import Fase3 from './features/fase3-cotacao/index'
import Fase4 from './features/fase4-analise-cotacao/index'
import Fase5 from './features/fase5-aprovacao-contrato/index'
import Fase6 from './features/fase6-assinatura-contrato/index'
import Fase7 from './features/fase7-validacao-anexos/index'
import Fase8 from './features/fase8-publicacao/index'
import AlteracaoContratual from './features/alteracao-contratual/index'
import GestaoUsuario from './features/gestao-usuario/index'
import ProcessosPage from './features/processos/index'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      retry: 2,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route index element={<Navigate to="/visao-geral" replace />} />
                  <Route path="/visao-geral" element={<OverviewPage />} />
                  <Route path="/processos" element={<ProcessosPage />} />
                  <Route path="/fase1-analise-contrato" element={<Fase1AnaliseContrato />} />
                  <Route path="/fase1-aprovacao-solicitacao" element={<Fase1AprovacaoSolicitacao />} />
                  <Route path="/fase2" element={<Fase2 />} />
                  <Route path="/fase3" element={<Fase3 />} />
                  <Route path="/fase4" element={<Fase4 />} />
                  <Route path="/fase5" element={<Fase5 />} />
                  <Route path="/fase6" element={<Fase6 />} />
                  <Route path="/fase7" element={<Fase7 />} />
                  <Route path="/fase8" element={<Fase8 />} />
                  <Route path="/alteracoes-contratuais" element={<AlteracaoContratual />} />
                  <Route element={<ProtectedRoute requiredRole="Admin" />}>
                    <Route path="/gestao-usuario" element={<GestaoUsuario />} />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/visao-geral" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
