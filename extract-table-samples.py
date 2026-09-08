"""
extract-table-samples.py
=========================
Extrai as primeiras 50 linhas de cada tabela do schema 'ressuprimentos'
e salva como CSV na pasta 'table-headers/' para análise da estrutura.

Baseado no mesmo RDS/usuário de check-acesso-ressuprimentos.py.
"""

import os
import csv
import logging
from pathlib import Path

import psycopg2
import psycopg2.extras

# ============================================================
# CONFIGURAÇÕES
# ============================================================

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

TABELAS_ALVO = [
    "ressuprimentos.ecompras_contrato",
    "ressuprimentos.ecompras_contrato_aditivo",
    "ressuprimentos.ecompras_contrato_catalogo",
    "ressuprimentos.ecompras_contrato_equipe",
    "ressuprimentos.ecompras_contrato_gestor",
    "ressuprimentos.ecompras_contrato_ordem_compra",
    "ressuprimentos.ecompras_extrato_contrato",
    "ressuprimentos.ecompras_processo_contrato",
    "ressuprimentos.ecompras_processo_contrato_fase1_analise_contrato",
    "ressuprimentos.ecompras_processo_contrato_fase1_analise_contrato_reserva",
    "ressuprimentos.ecompras_processo_contrato_fase1_aprovacao_solicitacao",
    "ressuprimentos.ecompras_processo_contrato_solicitacao_reserva",
]

LIMIT = 50

# Pasta de saída: table-headers/ relativa ao diretório deste script
OUTPUT_DIR = Path(__file__).parent / "table-headers"


# ============================================================
# EXTRAÇÃO
# ============================================================

def extrair_tabela(cur, tabela: str) -> tuple[list[str], list[dict]]:
    """
    Executa SELECT * FROM <tabela> LIMIT 50.
    Retorna (colunas, linhas) onde linhas é lista de dicts.
    Levanta exceção se sem acesso.
    """
    schema, nome = tabela.split(".", 1)
    cur.execute(f'SELECT COUNT(*) FROM "{schema}"."{nome}"')
    total = cur.fetchone()["count"]
    offset = max(0, total - LIMIT)
    cur.execute(f'SELECT * FROM "{schema}"."{nome}" OFFSET %s LIMIT %s', (offset, LIMIT))
    rows = [dict(r) for r in cur.fetchall()]
    cols = [desc.name for desc in cur.description] if cur.description else []
    return cols, rows


def salvar_csv(tabela: str, cols: list[str], rows: list[dict]):
    nome_arquivo = tabela.replace(".", "__") + ".csv"
    caminho = OUTPUT_DIR / nome_arquivo

    with open(caminho, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=cols)
        writer.writeheader()
        writer.writerows(rows)

    logger.info(f"  Salvo: {caminho.name}  ({len(rows)} linhas, {len(cols)} colunas)")
    return caminho


# ============================================================
# MAIN
# ============================================================

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    logger.info("=" * 70)
    logger.info("  extract-table-samples.py")
    logger.info(f"  Usuário : {RDS_CONFIG['user']}")
    logger.info(f"  Host    : {RDS_CONFIG['host']}")
    logger.info(f"  Tabelas : {len(TABELAS_ALVO)}  |  Limite: {LIMIT} linhas cada")
    logger.info(f"  Saída   : {OUTPUT_DIR}")
    logger.info("=" * 70)

    try:
        conn = psycopg2.connect(**RDS_CONFIG)
        conn.set_session(readonly=True, autocommit=True)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        logger.info("  Conexão ao RDS: OK\n")
    except psycopg2.OperationalError as e:
        logger.error(f"  FALHA NA CONEXÃO: {e}")
        return

    ok, falhou = [], []

    for tabela in TABELAS_ALVO:
        logger.info(f"  Extraindo {tabela} ...")
        try:
            cols, rows = extrair_tabela(cur, tabela)
            salvar_csv(tabela, cols, rows)
            ok.append(tabela)
        except psycopg2.Error as e:
            cur.execute("ROLLBACK")
            msg = str(e).strip().replace("\n", " ")
            logger.warning(f"  FALHA em {tabela}: {msg}")
            falhou.append((tabela, msg))

    cur.close()
    conn.close()

    logger.info("\n" + "=" * 70)
    logger.info("  RESUMO")
    logger.info("=" * 70)
    logger.info(f"  Extraídas com sucesso : {len(ok)}/{len(TABELAS_ALVO)}")
    for t in ok:
        logger.info(f"    ✓  {t}")

    if falhou:
        logger.info(f"\n  Com falha : {len(falhou)}/{len(TABELAS_ALVO)}")
        for t, err in falhou:
            logger.warning(f"    ✗  {t}")
            logger.warning(f"       {err}")

    logger.info(f"\n  CSVs salvos em: {OUTPUT_DIR}/")
    logger.info("=" * 70)


if __name__ == "__main__":
    main()
