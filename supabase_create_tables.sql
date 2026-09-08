-- ============================================================
-- supabase_create_tables.sql
-- Replicates the structure of:
--   ressuprimentos.ecompras_processo_contrato                              → processo_contrato
--   ressuprimentos.ecompras_processo_contrato_fase1_analise_contrato       → fase1_analise_contrato
--   ressuprimentos.ecompras_contrato_catalogo                              → contrato_catalogo
--
-- Paste this into the Supabase SQL Editor and run.
-- ============================================================


-- ------------------------------------------------------------
-- TABLE: processo_contrato
-- Source: ressuprimentos.ecompras_processo_contrato (54 cols)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS processo_contrato (
    id                                          INTEGER         PRIMARY KEY,

    -- Vínculos com outros controles
    id_controle_sc                              INTEGER,
    id_controle_catalogo                        INTEGER,
    id_controle_contrato                        INTEGER,

    -- Identificação da entidade / solicitação
    entidade                                    TEXT,
    solicitacao_tipo                            TEXT,
    solicitacao_numero                          TEXT,
    solicitacao_tipo_compra                     TEXT,
    solicitacao_data_importacao                 TIMESTAMPTZ,
    solicitacao_numero_compra_conjunta          TEXT,
    solicitacao_quantidade_itens                INTEGER,
    solicitacao_valor_estimado                  NUMERIC(18, 2),
    solicitacao_classificacao                   TEXT,
    solicitacao_comprador_responsavel           TEXT,
    solicitacao_departamento                    TEXT,
    justificativa_aquisicao                     TEXT,

    -- Flags de resultado / status
    resultado_gerado                            BOOLEAN,
    resultado_publicado                         BOOLEAN,
    solicitacao_cancelada                       BOOLEAN,
    cotacao_cancelada                           BOOLEAN,
    cotacao_finalizada                          BOOLEAN,
    cotacao_finalizada_data                     TIMESTAMPTZ,
    cotacao_status                              TEXT,

    -- Catálogo de preços
    catalogo_precos_codigo                      TEXT,
    catalogo_precos_numero_contrato             TEXT,

    -- Fornecedor
    fornecedor_razao_social                     TEXT,
    fornecedor_cnpj                             TEXT,
    fornecedor_faturamento_minimo               NUMERIC(18, 2),
    fornecedor_situacao_status                  TEXT,
    fornecedor_situacao_motivo                  TEXT,

    -- Fase 1 — Análise / Aprovação de SC
    fase1_solicitante                           TEXT,
    fase1_status_analise_contrato               TEXT,
    fase1_status_aprovacao_solicitacao          TEXT,
    fase1_cargo_aprovador_atual                 TEXT,
    fase1_estimativa_valor                      NUMERIC(18, 2),
    fase1_data_inicio_sc                        TIMESTAMPTZ,
    fase1_data_fim_sc                           TIMESTAMPTZ,

    -- Fase 2 — Preparação de cotação
    fase2_data_inicio_prep_cotacao              TIMESTAMPTZ,
    fase2_data_fim_prep_cotacao                 TIMESTAMPTZ,

    -- Fase 3 — Cotação
    fase3_data_inicio_cotacao                   TIMESTAMPTZ,
    fase3_data_fim_cotacao                      TIMESTAMPTZ,

    -- Fase 4 — Análise de cotação
    fase4_data_inicio_analise_cotacao           TIMESTAMPTZ,
    fase4_data_fim_analise_cotacao              TIMESTAMPTZ,

    -- Fase 5 — Aprovação de contrato
    fase5_data_inicio_aprovacao_contrato        TIMESTAMPTZ,
    fase5_data_fim_aprovacao_contrato           TIMESTAMPTZ,

    -- Fase 6 — Assinatura de contrato
    fase6_data_inicio_assinatura_contrato       TIMESTAMPTZ,
    fase6_data_fim_assinatura_contrato          TIMESTAMPTZ,

    -- Fase 7 — Validação de anexos
    fase7_data_inicio_validacao_anexos_contrato TIMESTAMPTZ,
    fase7_data_fim_validacao_anexos_contrato    TIMESTAMPTZ,

    -- Fase 8 — Publicação de contrato
    fase8_data_inicio_publicacao_contrato       TIMESTAMPTZ,
    fase8_data_fim_publicacao_contrato          TIMESTAMPTZ,

    -- Auditoria
    criado_em                                   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em                               TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    empresa_id                                  INTEGER
);

-- Enable RLS — blocks all access by default; only authenticated users are allowed via the policy below
ALTER TABLE processo_contrato ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read processo_contrato"
    ON processo_contrato
    FOR SELECT
    TO authenticated
    USING (true);


-- ------------------------------------------------------------
-- TABLE: fase1_analise_contrato
-- Source: ressuprimentos.ecompras_processo_contrato_fase1_analise_contrato (15 cols)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fase1_analise_contrato (
    id                  INTEGER         PRIMARY KEY,

    -- Vínculos
    id_controle_sc      INTEGER,
    id_controle_catalogo INTEGER,
    id_controle_contrato INTEGER,

    -- Identificação
    entidade            TEXT,
    nome                TEXT,
    observacao          TEXT,

    -- Revisão
    nro_revisao         INTEGER,
    revisor             BOOLEAN,
    cargo               TEXT,
    de_acordo           BOOLEAN,
    data_log            TIMESTAMPTZ,

    -- Auditoria
    criado_em           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    empresa_id          INTEGER
);

-- Enable RLS — blocks all access by default; only authenticated users are allowed via the policy below
ALTER TABLE fase1_analise_contrato ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read fase1_analise_contrato"
    ON fase1_analise_contrato
    FOR SELECT
    TO authenticated
    USING (true);


-- ------------------------------------------------------------
-- TABLE: contrato_catalogo
-- Source: ressuprimentos.ecompras_contrato_catalogo (15 cols)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contrato_catalogo (
    id                      INTEGER         PRIMARY KEY,

    -- Vínculos
    id_controle_contrato    INTEGER,
    id_controle_catalogo    INTEGER,

    -- Identificação
    entidade                TEXT,
    codigo                  TEXT,
    nome                    TEXT,

    -- Vigência
    data_inicio             TIMESTAMPTZ,
    data_termino            TIMESTAMPTZ,
    status                  TEXT,

    -- Valores
    valor_estimado          NUMERIC(18, 2),
    valor_consumido         NUMERIC(18, 2),
    percentual_consumido    NUMERIC(10, 4),

    -- Auditoria
    criado_em               TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    empresa_id              INTEGER
);

ALTER TABLE contrato_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read contrato_catalogo"
    ON contrato_catalogo
    FOR SELECT
    TO authenticated
    USING (true);
