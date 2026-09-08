import { PhaseView } from '../../components/layout/PhaseView'
import { strings } from '../../i18n/strings.pt-BR'

export default function Fase4() {
  return (
    <PhaseView
      phaseKey={4}
      title={strings.nav.fase4}
      subtitle={strings.phases.fase4Full}
    />
  )
}
