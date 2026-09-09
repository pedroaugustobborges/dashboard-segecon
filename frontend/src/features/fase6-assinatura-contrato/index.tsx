import { PhaseView } from '../../components/layout/PhaseView'
import { UnavailableIndicator } from '../../components/charts/UnavailableIndicator'
import { strings } from '../../i18n/strings.pt-BR'
import { Box } from '@mui/material'

export default function Fase6() {
  return (
    <PhaseView
      phaseKey={6}
      title={strings.nav.fase6}
      gapIndicators={
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <UnavailableIndicator
            title={strings.faseIndicators.gap2ResponsavelTitle}
            missingSource={strings.faseIndicators.gap2ResponsavelSource}
            details={strings.faseIndicators.gap2ResponsavelDetails}
          />
          <UnavailableIndicator
            title={strings.faseIndicators.gap3SubstatusTitle}
            missingSource={strings.faseIndicators.gap3SubstatusSource}
            details={strings.faseIndicators.gap3SubstatusDetails}
          />
        </Box>
      }
    />
  )
}
