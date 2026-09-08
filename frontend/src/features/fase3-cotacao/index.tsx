import { PhaseView } from '../../components/layout/PhaseView'
import { strings } from '../../i18n/strings.pt-BR'

export default function Fase3() {
  return (
    <PhaseView
      phaseKey={3}
      title={strings.nav.fase3}
      subtitle={strings.phases.fase3Full}
      statusColumn="cotacao_status"
      statusColumnLabel="Status da Cotação"
    />
  )
}
