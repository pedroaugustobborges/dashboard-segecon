// Column definitions for the Solicitação tab of the process detail table.
// Imported by the page so the table component stays generic.

import { Box, Chip, Tooltip } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { ColumnDef } from '../../components/tables/ProcessDetailTable'
import type { ProcessoRow } from './useProcessoTableRows'
import { strings } from '../../i18n/strings.pt-BR'

export const solicitacaoColumns: ColumnDef<ProcessoRow>[] = [
  {
    key: 'entidade',
    header: strings.processos.colUnidade,
    getValue: (r) => r.entidade,
    width: 90,
  },
  {
    key: 'solicitacao_numero',
    header: strings.processos.colNumeroProcesso,
    getValue: (r) => r.solicitacao_numero,
    width: 160,
  },
  {
    key: 'faseLabel',
    header: strings.processos.colFaseAtual,
    getValue: (r) => r.faseLabel,
    renderCell: (r) => (
      <Chip
        label={r.faseLabel}
        size="small"
        sx={{
          bgcolor: r.faseColor + '1a',  // 10% opacity background
          color: r.faseColor,
          fontWeight: 600,
          fontSize: '0.7rem',
          border: `1px solid ${r.faseColor}40`,
        }}
      />
    ),
    width: 140,
  },
  {
    key: 'diasNaFase',
    header: strings.processos.colDiasNaFase,
    getValue: (r) => r.diasNaFase,
    renderCell: (r) =>
      r.diasNaFase !== null ? (
        <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {r.diasNaFase}d
        </Box>
      ) : '—',
    align: 'right',
    width: 90,
  },
  {
    key: 'solicitacao_tipo',
    header: strings.processos.colPrioridade,
    getValue: (r) => r.solicitacao_tipo,
    renderCell: (r) => (
      <Chip
        label={r.solicitacao_tipo || '—'}
        size="small"
        sx={{
          bgcolor: r.prioridadeColor + '1a',
          color: r.prioridadeColor,
          fontWeight: 600,
          fontSize: '0.7rem',
          border: `1px solid ${r.prioridadeColor}40`,
        }}
      />
    ),
    width: 100,
  },
  {
    key: 'responsavel',
    header: strings.processos.colResponsavel,
    getValue: (r) => r.responsavel ?? '',
    renderCell: (r) =>
      r.responsavel !== null ? (
        r.responsavel || strings.status.naoAtribuido
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled' }}>
          <span>—</span>
          <Tooltip title={strings.processos.responsavelIndisponivel} arrow>
            <InfoOutlinedIcon sx={{ fontSize: 14, cursor: 'help' }} />
          </Tooltip>
        </Box>
      ),
    width: 180,
  },
  {
    key: 'catalogo_precos_codigo',
    header: strings.processos.colCodCatalogo,
    getValue: (r) => r.catalogo_precos_codigo,
    width: 160,
  },
  {
    key: 'catalogo_precos_numero_contrato',
    header: strings.processos.colNumeroContrato,
    getValue: (r) => r.catalogo_precos_numero_contrato,
    width: 200,
  },
  {
    key: 'solicitacao_departamento',
    header: strings.processos.colDepartamento,
    getValue: (r) => r.solicitacao_departamento,
    width: 180,
  },
  {
    key: 'valorFormatted',
    header: strings.processos.colValorEstimado,
    getValue: (r) => r.solicitacao_valor_estimado,
    renderCell: (r) => r.valorFormatted,
    align: 'right',
    width: 140,
  },
  {
    key: 'cotacao_status',
    header: strings.processos.colStatusCotacao,
    getValue: (r) => r.cotacao_status,
    width: 130,
  },
]
