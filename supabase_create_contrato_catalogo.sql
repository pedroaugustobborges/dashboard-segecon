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
