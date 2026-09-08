"""
etl_rds_to_supabase.py
=======================
Extrai dados do RDS PostgreSQL (schema ressuprimentos) de 2026-01-01 até hoje
e faz upsert nas tabelas do Supabase:
  - processo_contrato
  - fase1_analise_contrato

Dependências:
    pip install psycopg2-binary python-dotenv supabase

Uso:
    python etl_rds_to_supabase.py
"""

import os
import logging
from datetime import date, datetime, timezone
from decimal import Decimal

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from supabase import create_client, Client

# ============================================================
# CONFIG
# ============================================================

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

RDS_CONFIG = dict(
    host="db-rds-postgres.cx4bovrfmkbp.sa-east-1.rds.amazonaws.com",
    database="db_rds_01",
    user="gest_contratos",
    password="asdgRTFG98",
    port="5432",
)

SUPABASE_URL = f"https://{os.environ['PROJECT_SUPABASE_ID']}.supabase.co"
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_SECRET_KEY"]  # bypasses RLS for inserts

DATA_INICIO = date(2024, 1, 1)
DATA_FIM    = date.today()
BATCH_SIZE  = 200  # rows per upsert call

# Source table → (date filter column, destination table)
TABELAS = {
    "ressuprimentos.ecompras_processo_contrato": {
        "destino":      "processo_contrato",
        "coluna_data":  "solicitacao_data_importacao",  # operational date
    },
    "ressuprimentos.ecompras_processo_contrato_fase1_analise_contrato": {
        "destino":      "fase1_analise_contrato",
        "coluna_data":  "data_log",
    },
    "ressuprimentos.ecompras_contrato_catalogo": {
        "destino":      "contrato_catalogo",
        "coluna_data":  "data_inicio",
    },
}


# ============================================================
# HELPERS
# ============================================================

def serialize(value):
    """Converts non-JSON-serializable types returned by psycopg2."""
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value


def serialize_row(row: dict) -> dict:
    return {k: serialize(v) for k, v in row.items()}


def extrair_rds(cur, tabela_src: str, coluna_data: str) -> list[dict]:
    schema, nome = tabela_src.split(".", 1)
    logger.info(f"  Extraindo {tabela_src} ({coluna_data} entre {DATA_INICIO} e {DATA_FIM}) ...")

    cur.execute(f"""
        SELECT *
        FROM "{schema}"."{nome}"
        WHERE "{coluna_data}" >= %s
          AND "{coluna_data}" <  %s + INTERVAL '1 day'
        ORDER BY "{coluna_data}"
    """, (DATA_INICIO, DATA_FIM))

    rows = [serialize_row(dict(r)) for r in cur.fetchall()]
    logger.info(f"  {len(rows)} linhas extraídas de {tabela_src}")
    return rows


def upsert_supabase(supabase: Client, tabela_dst: str, rows: list[dict]):
    if not rows:
        logger.warning(f"  Nenhuma linha para inserir em '{tabela_dst}'")
        return

    total    = len(rows)
    enviados = 0

    for i in range(0, total, BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        supabase.table(tabela_dst).upsert(batch, on_conflict="id").execute()
        enviados += len(batch)
        logger.info(f"  [{tabela_dst}] {enviados}/{total} linhas enviadas")

    logger.info(f"  Upsert concluído: {total} linhas em '{tabela_dst}'")


# ============================================================
# MAIN
# ============================================================

def main():
    logger.info("=" * 70)
    logger.info("  etl_rds_to_supabase.py")
    logger.info(f"  Período : {DATA_INICIO}  →  {DATA_FIM}")
    logger.info(f"  Destino : {SUPABASE_URL}")
    logger.info("=" * 70)

    # ── Conecta ao RDS ────────────────────────────────────────
    try:
        conn = psycopg2.connect(**RDS_CONFIG)
        conn.set_session(readonly=True, autocommit=True)
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        logger.info("  Conexão ao RDS: OK")
    except psycopg2.OperationalError as e:
        logger.error(f"  FALHA NA CONEXÃO RDS: {e}")
        return

    # ── Conecta ao Supabase ───────────────────────────────────
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("  Conexão ao Supabase: OK\n")
    except Exception as e:
        logger.error(f"  FALHA NA CONEXÃO SUPABASE: {e}")
        cur.close(); conn.close()
        return

    # ── ETL por tabela ────────────────────────────────────────
    resultados = {}

    for tabela_src, cfg in TABELAS.items():
        logger.info("-" * 70)
        try:
            rows = extrair_rds(cur, tabela_src, cfg["coluna_data"])
            upsert_supabase(supabase, cfg["destino"], rows)
            resultados[tabela_src] = {"ok": True, "linhas": len(rows)}
        except Exception as e:
            logger.error(f"  ERRO em {tabela_src}: {e}")
            resultados[tabela_src] = {"ok": False, "linhas": 0, "erro": str(e)}

    cur.close()
    conn.close()

    # ── Resumo ────────────────────────────────────────────────
    logger.info("\n" + "=" * 70)
    logger.info("  RESUMO")
    logger.info("=" * 70)
    for src, res in resultados.items():
        status = "✓" if res["ok"] else "✗"
        logger.info(f"  {status}  {src}  →  {res['linhas']} linhas")
        if not res["ok"]:
            logger.warning(f"     {res.get('erro')}")
    logger.info("=" * 70)


if __name__ == "__main__":
    main()
