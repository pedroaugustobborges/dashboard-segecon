import { useState } from 'react'
import { Box, Typography, Tabs, Tab, useTheme, alpha } from '@mui/material'
import { GlobalFilterBar } from '../../components/filters/GlobalFilterBar'
import { ProcessDetailTable } from '../../components/tables/ProcessDetailTable'
import { UnavailableIndicator } from '../../components/charts/UnavailableIndicator'
import { useProcessos } from '../../hooks/useProcessoContrato'
import { useFase1Analise } from '../../hooks/useFase1AnaliseContrato'
import { useGlobalFilters } from '../../hooks/useGlobalFilters'
import { useProcessoTableRows, type ProcessoRow } from './useProcessoTableRows'
import { solicitacaoColumns } from './solicitacaoColumns'
import { strings } from '../../i18n/strings.pt-BR'

interface TabPanelProps {
  index: number
  value: number
  children: React.ReactNode
}

function TabPanel({ index, value, children }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 2.5 }}>
      {value === index && children}
    </Box>
  )
}

export default function ProcessosPage() {
  const theme  = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const primary = theme.palette.primary.main

  const [tab, setTab] = useState(0)
  const [filters] = useGlobalFilters()

  // Fetch all processes (include cancelled — table has its own visibility)
  const { data: processos = [], isLoading: processosLoading } = useProcessos({
    ...filters,
    incluirCancelados: true,
  })

  // Fetch fase1 records for responsável join
  const scIds = processos
    .map((p) => p.id_controle_sc)
    .filter((id): id is number => id !== null)

  const { data: fase1Records = [], isLoading: fase1Loading } = useFase1Analise(scIds)

  const isLoading = processosLoading || fase1Loading

  const rows = useProcessoTableRows(processos, fase1Records)

  const tabLabels = [
    strings.processos.tabSolicitacao,
    strings.processos.tabVigencia,
    strings.processos.tabConsumo,
    strings.processos.tabPagamento,
  ]

  return (
    <Box>
      <GlobalFilterBar />

      <Box sx={{ px: 1.5, py: 1.5 }}>
        <Typography variant="h5" fontWeight={700} mb={2.5}>
          {strings.processos.title}
        </Typography>

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <Box
          sx={{
            mb: 0,
            borderBottom: `1px solid ${isDark ? alpha('#ffffff', 0.07) : alpha('#000', 0.08)}`,
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              minHeight: 40,
              '& .MuiTabs-indicator': {
                height: 2,
                borderRadius: '2px 2px 0 0',
                bgcolor: primary,
                boxShadow: isDark ? `0 0 8px ${alpha(primary, 0.6)}` : 'none',
              },
              '& .MuiTab-root': {
                minHeight: 40,
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.01em',
                textTransform: 'none',
                color: 'text.secondary',
                px: 2,
                py: 0,
                borderRadius: '8px 8px 0 0',
                transition: 'color 0.15s, background-color 0.15s',
                '&:hover': {
                  color: 'text.primary',
                  bgcolor: isDark ? alpha('#ffffff', 0.04) : alpha('#000', 0.03),
                },
                '&.Mui-selected': {
                  color: primary,
                  fontWeight: 700,
                },
              },
            }}
          >
            {tabLabels.map((label) => (
              <Tab key={label} label={label} disableRipple />
            ))}
          </Tabs>
        </Box>

        {/* Tab 0: Solicitação — real data */}
        <TabPanel value={tab} index={0}>
          <ProcessDetailTable
            columns={solicitacaoColumns as ColumnDefAny}
            rows={rows as unknown as Record<string, unknown>[]}
            loading={isLoading}
            searchFields={['entidade', 'solicitacao_numero', 'solicitacao_departamento', 'responsavel'] as Array<keyof Record<string, unknown>>}
            filename="segecon_processos"
            rowKey={(r) => (r as unknown as ProcessoRow).id}
          />
        </TabPanel>

        {/* Tab 1: Vigência — Gap */}
        <TabPanel value={tab} index={1}>
          <Box sx={{ mt: 4 }}>
            <UnavailableIndicator
              title={strings.processos.tabVigencia}
              missingSource={strings.vigenciaGap}
              details={strings.gaps.aguardandoFonteDados}
            />
          </Box>
        </TabPanel>

        {/* Tab 2: Consumo — Gap */}
        <TabPanel value={tab} index={2}>
          <Box sx={{ mt: 4 }}>
            <UnavailableIndicator
              title={strings.processos.tabConsumo}
              missingSource={strings.consumoGap}
              details={strings.gaps.aguardandoFonteDados}
            />
          </Box>
        </TabPanel>

        {/* Tab 3: Pagamento — Gap */}
        <TabPanel value={tab} index={3}>
          <Box sx={{ mt: 4 }}>
            <UnavailableIndicator
              title={strings.processos.tabPagamento}
              missingSource={strings.pagamentoGap}
              details={strings.gaps.aguardandoFonteDados}
            />
          </Box>
        </TabPanel>
      </Box>
    </Box>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ColumnDefAny = any
