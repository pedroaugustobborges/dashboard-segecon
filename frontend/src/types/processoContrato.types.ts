// Types match the Supabase schema verbatim — DB identifiers are NOT renamed.

export interface ProcessoContrato {
  id: number
  id_controle_sc: number | null
  id_controle_catalogo: number | null
  id_controle_contrato: number | null
  entidade: string | null
  solicitacao_tipo: 'Imediata' | 'Urgente' | 'Programada' | string | null
  solicitacao_numero: string | null
  solicitacao_tipo_compra: string | null
  solicitacao_data_importacao: string | null
  solicitacao_numero_compra_conjunta: string | null
  solicitacao_quantidade_itens: number | null
  solicitacao_valor_estimado: number | null
  solicitacao_classificacao: string | null
  solicitacao_comprador_responsavel: string | null
  solicitacao_departamento: string | null
  justificativa_aquisicao: string | null
  resultado_gerado: boolean | null
  resultado_publicado: boolean | null
  solicitacao_cancelada: boolean | null
  cotacao_cancelada: boolean | null
  cotacao_finalizada: boolean | null
  cotacao_finalizada_data: string | null
  cotacao_status: string | null
  catalogo_precos_codigo: string | null
  catalogo_precos_numero_contrato: string | null
  fornecedor_razao_social: string | null
  fornecedor_cnpj: string | null
  fornecedor_faturamento_minimo: number | null
  fornecedor_situacao_status: string | null
  fornecedor_situacao_motivo: string | null
  fase1_solicitante: string | null
  fase1_status_analise_contrato: string | null
  fase1_status_aprovacao_solicitacao: string | null
  fase1_cargo_aprovador_atual: string | null
  fase1_estimativa_valor: number | null
  fase1_data_inicio_sc: string | null
  fase1_data_fim_sc: string | null
  fase2_data_inicio_prep_cotacao: string | null
  fase2_data_fim_prep_cotacao: string | null
  fase3_data_inicio_cotacao: string | null
  fase3_data_fim_cotacao: string | null
  fase4_data_inicio_analise_cotacao: string | null
  fase4_data_fim_analise_cotacao: string | null
  fase5_data_inicio_aprovacao_contrato: string | null
  fase5_data_fim_aprovacao_contrato: string | null
  fase6_data_inicio_assinatura_contrato: string | null
  fase6_data_fim_assinatura_contrato: string | null
  fase7_data_inicio_validacao_anexos_contrato: string | null
  fase7_data_fim_validacao_anexos_contrato: string | null
  fase8_data_inicio_publicacao_contrato: string | null
  fase8_data_fim_publicacao_contrato: string | null
  criado_em: string
  atualizado_em: string
  empresa_id: number | null
}

export interface Fase1AnaliseContrato {
  id: number
  id_controle_sc: number | null
  id_controle_catalogo: number | null
  id_controle_contrato: number | null
  entidade: string | null
  nome: string | null
  observacao: string | null
  nro_revisao: number | null
  revisor: boolean | null
  cargo: string | null
  de_acordo: boolean | null
  data_log: string | null
  criado_em: string
  atualizado_em: string
  empresa_id: number | null
}

export interface ContratoCatalogo {
  id: number
  id_controle_contrato: number | null
  id_controle_catalogo: number | null
  entidade: string | null
  codigo: string | null
  nome: string | null
  data_inicio: string | null
  data_termino: string | null
  status: string | null
  valor_estimado: number | null
  valor_consumido: number | null
  percentual_consumido: number | null
  criado_em: string
  atualizado_em: string
  empresa_id: number | null
}

// Derived types (computed, not from DB)
export type FaseKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type FaseStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface DerivedPhaseInfo {
  currentPhase: FaseKey | null
  status: FaseStatus
}
