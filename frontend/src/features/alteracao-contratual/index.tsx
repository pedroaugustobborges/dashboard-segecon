import { Box, Typography, Card, CardContent } from '@mui/material'
import { UnavailableIndicator } from '../../components/charts/UnavailableIndicator'
import { strings } from '../../i18n/strings.pt-BR'

export default function AlteracaoContratual() {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        {strings.nav.alteracaoContratual}
      </Typography>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <UnavailableIndicator
            title={strings.nav.alteracaoContratual}
            missingSource="Tabela: alteracao_contratual (não disponível)"
            details={strings.gaps.aguardandoFonteDados}
          />
        </CardContent>
      </Card>
    </Box>
  )
}
