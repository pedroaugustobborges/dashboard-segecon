import { Card, CardContent, Grid } from '@mui/material'
import { PhaseView } from '../../components/layout/PhaseView'
import { RevisionsChart } from '../../components/charts/RevisionsChart'
import { UnavailableIndicator } from '../../components/charts/UnavailableIndicator'
import { strings } from '../../i18n/strings.pt-BR'
import type { Fase1AnaliseContrato } from '../../types/processoContrato.types'

export default function Fase1AnaliseContrato() {
  return (
    <PhaseView
      phaseKey={1}
      title={strings.nav.fase1AnaliseContrato}
      statusColumn="fase1_status_analise_contrato"
      statusColumnLabel="Status – Análise Contrato"
      showResponsavelChart
      extraIndicators={(fase1Records: Fase1AnaliseContrato[]) => (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <RevisionsChart fase1Records={fase1Records} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      gapIndicators={
        <UnavailableIndicator
          title={strings.faseIndicators.gap1Title}
          missingSource={strings.faseIndicators.gap1Source}
          details={strings.faseIndicators.gap1Details}
        />
      }
    />
  )
}
