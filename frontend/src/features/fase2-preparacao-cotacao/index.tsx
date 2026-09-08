import { PhaseView } from '../../components/layout/PhaseView'
import { strings } from '../../i18n/strings.pt-BR'

export default function Fase2() {
  return (
    <PhaseView
      phaseKey={2}
      title={strings.nav.fase2}
      subtitle={strings.phases.fase2Full}
    />
  )
}
