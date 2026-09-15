-- =============================================================================
-- Migration: create extrato_contrato
-- Source   : ressuprimentos.ecompras_extrato_contrato  (RDS)
-- Purpose  : Stores contract extract rows; used by the dashboard to display
--            the "OBJETO" (contrato_objeto) column in ProcessDrawer.
-- Join key : id_controle_contrato  →  processo_contrato.id_controle_contrato
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.extrato_contrato (
    -- ── Primary key ──────────────────────────────────────────────────────────
    id                          BIGINT PRIMARY KEY,

    -- ── Join keys ────────────────────────────────────────────────────────────
    id_controle_catalogo        BIGINT,
    id_controle_contrato        BIGINT,

    -- ── Entity / contract info ───────────────────────────────────────────────
    entidade_codigo             INTEGER,
    entidade_sigla              TEXT,
    entidade_razao_social       TEXT,
    contrato_numero             TEXT,
    contrato_objeto             TEXT,         -- ← displayed as "OBJETO" in the UI
    contrato_gestor             TEXT,
    contrato_equipe             TEXT,
    contrato_data_assinatura    TIMESTAMPTZ,

    -- ── Supplier ─────────────────────────────────────────────────────────────
    fornecedor_cnpj             TEXT,
    fornecedor_razao_social     TEXT,

    -- ── Catalog ──────────────────────────────────────────────────────────────
    catalogo_codigo             TEXT,
    catalogo_aprovacao          TEXT,
    catalogo_status             TEXT,
    catalogo_publicado          BOOLEAN,
    catalogo_data_aprovacao     TIMESTAMPTZ,
    catalogo_data_publicacao    TIMESTAMPTZ,
    catalogo_data_inicio        TIMESTAMPTZ,
    catalogo_data_termino       TIMESTAMPTZ,

    -- ── Item ─────────────────────────────────────────────────────────────────
    item_data_validade          TIMESTAMPTZ,
    item_codigo                 TEXT,
    item_descricao              TEXT,
    item_codigo_corporativo     TEXT,
    item_tipo                   TEXT,
    unidade_medida_descricao    TEXT,

    -- ── Quantities and values ────────────────────────────────────────────────
    valor_unitario              NUMERIC,
    qtde_estimada               NUMERIC,
    qtde_consumida              NUMERIC,
    valor_estimado              NUMERIC,
    valor_consumido             NUMERIC,
    percentual_consumido        NUMERIC,

    -- ── Misc ─────────────────────────────────────────────────────────────────
    numero_processo_origem      TEXT,
    inativo                     BOOLEAN,
    usuario_nome                TEXT,
    forma_pagamento_descricao   TEXT,

    -- ── Audit ────────────────────────────────────────────────────────────────
    criado_em                   TIMESTAMPTZ,
    atualizado_em               TIMESTAMPTZ,
    empresa_id                  INTEGER
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Primary lookup: one id_controle_contrato → contrato_objeto
CREATE INDEX IF NOT EXISTS extrato_contrato_id_controle_contrato_idx
    ON public.extrato_contrato (id_controle_contrato);

CREATE INDEX IF NOT EXISTS extrato_contrato_entidade_sigla_idx
    ON public.extrato_contrato (entidade_sigla);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.extrato_contrato ENABLE ROW LEVEL SECURITY;

-- Admin sees all rows; Analista sees only rows whose entidade_sigla is in
-- their allowed entidades list (same pattern as processo_contrato).
CREATE POLICY "Role-based access to extrato_contrato"
    ON public.extrato_contrato
    FOR SELECT
    TO authenticated
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin'
        OR entidade_sigla = ANY (
            SELECT unnest(entidades) FROM profiles WHERE id = auth.uid()
        )
    );
