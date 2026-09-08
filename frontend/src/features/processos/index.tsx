import { useState } from 'react'
import { Box, Typography, Tabs, Tab } from '@mui/material'
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
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
      {value === index && children}
    </Box>
  )
}

export default function ProcessosPage() {
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

  return (
    <Box>
      <GlobalFilterBar />

      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" fontWeight={700} mb={2}>
          {strings.processos.title}
        </Typography>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}
        >
          <Tab label={strings.processos.tabSolicitacao} />
          <Tab label={strings.processos.tabVigencia} />
          <Tab label={strings.processos.tabConsumo} />
          <Tab label={strings.processos.tabPagamento} />
        </Tabs>

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

        {/* Tab 1: Vigência — Gap 5 */}
        <TabPanel value={tab} index={1}>
          <Box sx={{ mt: 4 }}>
            <UnavailableIndicator
              title={strings.processos.tabVigencia}
              missingSource={strings.vigenciaGap}
              details={strings.gaps.aguardandoFonteDados}
            />
          </Box>
        </TabPanel>

        {/* Tab 2: Consumo — Gap 5 */}
        <TabPanel value={tab} index={2}>
          <Box sx={{ mt: 4 }}>
            <UnavailableIndicator
              title={strings.processos.tabConsumo}
              missingSource={strings.consumoGap}
              details={strings.gaps.aguardandoFonteDados}
            />
          </Box>
        </TabPanel>

        {/* Tab 3: Pagamento — Gap 5 */}
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
