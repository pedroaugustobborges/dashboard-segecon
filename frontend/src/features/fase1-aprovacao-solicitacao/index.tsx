import { UnavailableIndicator } from '../../components/charts/UnavailableIndicator'
import { PhaseView } from '../../components/layout/PhaseView'
import { strings } from '../../i18n/strings.pt-BR'
import { Box } from '@mui/material'

export default function Fase1AprovacaoSolicitacao() {
  return (
    <PhaseView
      phaseKey={1}
      title={strings.nav.fase1AprovacaoSolicitacao}
      subtitle={strings.phases.fase1Full}
      statusColumn="fase1_status_aprovacao_solicitacao"
      statusColumnLabel="Status – Aprovação da Solicitação"
      gapIndicators={
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <UnavailableIndicator
            title={strings.faseIndicators.gap2ResponsavelTitle}
            missingSource={strings.faseIndicators.gap2ResponsavelSource}
            details={strings.faseIndicators.gap2ResponsavelDetails}
          />
          <UnavailableIndicator
            title={strings.faseIndicators.gap1Title}
            missingSource={strings.faseIndicators.gap1Source}
            details={strings.faseIndicators.gap1Details}
          />
        </Box>
      }
    />
  )
}
