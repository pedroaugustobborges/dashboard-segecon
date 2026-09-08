"""
check-acesso-ressuprimentos.py
===============================
Verifica se o usuário 'gest_contratos' tem acesso às tabelas do schema
'ressuprimentos' no RDS PostgreSQL.

Três camadas de verificação (da mais simples à mais confiável):
  1. information_schema.tables      — tabela visível pelo usuário?
  2. information_schema.role_table_grants — grant SELECT existe?
  3. SELECT ... LIMIT 1             — acesso real confirmado na prática

Saída:
  - Log colorido no terminal
  - ressuprimentos_acesso_YYYY-MM-DD.csv em ~/Downloads/
"""

import os
import csv
import logging
from datetime import date

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

DOWNLOADS = os.path.expanduser("~/Downloads")
HOJE      = date.today().isoformat()


# ============================================================
# UTILITÁRIOS
# ============================================================

def separador(titulo=""):
    logger.info("=" * 70)
    if titulo:
        logger.info(f"  {titulo}")
        logger.info("=" * 70)


def salvar_csv(nome_arquivo: str, linhas: list):
    if not linhas:
        logger.warning(f"  Sem dados — {nome_arquivo} não gerado")
        return
    caminho = os.path.join(DOWNLOADS, nome_arquivo)
    with open(caminho, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(linhas[0].keys()))
        writer.writeheader()
        writer.writerows(linhas)
    logger.info(f"  -> {caminho}  ({len(linhas)} linhas)")


# ============================================================
# VERIFICAÇÃO CAMADA 1 — information_schema.tables
# ============================================================

def verificar_visibilidade(cur, schema: str, tabelas: list[str]) -> set[str]:
    """
    Retorna o conjunto de tabelas que o usuário ENXERGA via information_schema.
    Uma tabela visível aqui não garante SELECT — só que ela existe na sessão.
    """
    logger.info("  [Camada 1] Consultando information_schema.tables ...")

    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = %s
        ORDER BY table_name
    """, (schema,))

    visiveis = {r["table_name"] for r in cur.fetchall()}
    logger.info(f"  Tabelas visíveis no schema '{schema}': {len(visiveis)}")
    for t in sorted(visiveis):
        logger.info(f"    {schema}.{t}")

    esperadas = {t.split(".")[-1] for t in tabelas}
    nao_visiveis = esperadas - visiveis
    if nao_visiveis:
        logger.warning(f"  Não visíveis (possível falta de USAGE no schema): {nao_visiveis}")

    return visiveis


# ============================================================
# VERIFICAÇÃO CAMADA 2 — information_schema.role_table_grants
# ============================================================

def verificar_grants(cur, schema: str, tabelas: list[str]) -> set[str]:
    """
    Retorna o conjunto de tabelas onde o usuário corrente tem privilege SELECT
    registrado explicitamente (via GRANT).
    """
    logger.info("  [Camada 2] Consultando role_table_grants (SELECT privileges) ...")

    cur.execute("""
        SELECT table_name, privilege_type, grantee
        FROM information_schema.role_table_grants
        WHERE table_schema  = %s
          AND privilege_type = 'SELECT'
          AND grantee        = current_user
        ORDER BY table_name
    """, (schema,))

    com_grant = {r["table_name"] for r in cur.fetchall()}
    logger.info(f"  Tabelas com GRANT SELECT para '{RDS_CONFIG['user']}': {len(com_grant)}")
    for t in sorted(com_grant):
        logger.info(f"    {schema}.{t}  [GRANT SELECT]")

    return com_grant


# ============================================================
# VERIFICAÇÃO CAMADA 3 — SELECT real em cada tabela
# ============================================================

def verificar_select_real(cur, tabelas: list[str]) -> dict[str, dict]:
    """
    Tenta executar SELECT * FROM <tabela> LIMIT 1 para cada tabela.
    Retorna dict: tabela → {acesso: bool, colunas: int|None, erro: str|None}
    """
    logger.info("  [Camada 3] Testando SELECT real (LIMIT 1) em cada tabela ...")
    resultados = {}

    for tabela in tabelas:
        schema, nome = tabela.split(".", 1)
        try:
            cur.execute(f'SELECT * FROM "{schema}"."{nome}" LIMIT 1')
            colunas = len(cur.description) if cur.description else 0
            cur.fetchall()  # limpa o cursor
            resultados[tabela] = {"acesso": True, "colunas": colunas, "erro": None}
            logger.info(f"    OK  {tabela:<70}  ({colunas} colunas)")
        except psycopg2.Error as e:
            # Volta ao estado limpo após erro
            cur.execute("ROLLBACK")
            msg = str(e).strip().replace("\n", " ")
            resultados[tabela] = {"acesso": False, "colunas": None, "erro": msg}
            logger.warning(f"    FAIL {tabela}")
            logger.warning(f"         {msg}")

    return resultados


# ============================================================
# VERIFICAÇÃO CAMADA EXTRA — colunas de cada tabela acessível
# ============================================================

def listar_colunas(cur, tabelas_ok: list[str]) -> dict[str, list]:
    """Para cada tabela acessível, lista colunas via information_schema."""
    logger.info("  [Extra] Listando colunas das tabelas acessíveis ...")
    colunas_por_tabela = {}

    for tabela in tabelas_ok:
        schema, nome = tabela.split(".", 1)
        cur.execute("""
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = %s
              AND table_name   = %s
            ORDER BY ordinal_position
        """, (schema, nome))
        cols = [dict(r) for r in cur.fetchall()]
        colunas_por_tabela[tabela] = cols
        logger.info(f"    {tabela}: {len(cols)} colunas")
        for c in cols:
            tipo = c["data_type"]
            if c["character_maximum_length"]:
                tipo += f"({c['character_maximum_length']})"
            logger.info(f"      {c['column_name']:<50} {tipo}")

    return colunas_por_tabela


# ============================================================
# GERAR GRANTS NECESSÁRIOS
# ============================================================

def gerar_grants_necessarios(tabelas_sem_acesso: list[str], usuario: str) -> list[str]:
    """Imprime e retorna os comandos GRANT que a TI precisa executar."""
    if not tabelas_sem_acesso:
        return []

    schema = tabelas_sem_acesso[0].split(".")[0]
    grants = [
        f"-- Execute no banco de dados '{RDS_CONFIG['database']}' como superusuário:",
        f"GRANT USAGE ON SCHEMA {schema} TO {usuario};",
    ]
    for tabela in tabelas_sem_acesso:
        grants.append(f"GRANT SELECT ON {tabela} TO {usuario};")

    logger.info("")
    logger.info("  AÇÃO NECESSÁRIA — comandos para a TI executar no RDS:")
    logger.info("  " + "-" * 65)
    for g in grants:
        logger.info(f"  {g}")
    logger.info("  " + "-" * 65)

    return grants


# ============================================================
# MAIN
# ============================================================

def main():
    separador("check-acesso-ressuprimentos.py")
    logger.info(f"  Usuário : {RDS_CONFIG['user']}")
    logger.info(f"  Host    : {RDS_CONFIG['host']}")
    logger.info(f"  Database: {RDS_CONFIG['database']}")
    logger.info(f"  Tabelas : {len(TABELAS_ALVO)} alvos no schema 'ressuprimentos'")

    # Conecta (somente leitura)
    try:
        conn = psycopg2.connect(**RDS_CONFIG)
        conn.set_session(readonly=True, autocommit=True)
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        logger.info("  Conexão ao RDS: OK")
    except psycopg2.OperationalError as e:
        logger.error(f"  FALHA NA CONEXÃO: {e}")
        logger.error("  Verifique host, porta, usuário e senha.")
        return

    schema = "ressuprimentos"

    # ── Camada 1 ──────────────────────────────────────────────
    separador("Camada 1 — Visibilidade (information_schema.tables)")
    visiveis = verificar_visibilidade(cur, schema, TABELAS_ALVO)

    # ── Camada 2 ──────────────────────────────────────────────
    separador("Camada 2 — Grants explícitos (role_table_grants)")
    com_grant = verificar_grants(cur, schema, TABELAS_ALVO)

    # ── Camada 3 ──────────────────────────────────────────────
    separador("Camada 3 — SELECT real (teste definitivo)")
    resultado_select = verificar_select_real(cur, TABELAS_ALVO)

    # ── Colunas das tabelas acessíveis ───────────────────────
    tabelas_ok = [t for t, r in resultado_select.items() if r["acesso"]]
    if tabelas_ok:
        separador("Colunas das tabelas acessíveis")
        listar_colunas(cur, tabelas_ok)

    cur.close()
    conn.close()

    # ── Resumo ────────────────────────────────────────────────
    separador("RESUMO FINAL")

    tabelas_sem_acesso = [t for t, r in resultado_select.items() if not r["acesso"]]
    usuario = RDS_CONFIG["user"]

    linhas_csv = []
    for tabela in TABELAS_ALVO:
        nome = tabela.split(".")[-1]
        res  = resultado_select[tabela]
        linhas_csv.append({
            "tabela":           tabela,
            "visivel_schema":   "SIM" if nome in visiveis  else "NAO",
            "grant_select":     "SIM" if nome in com_grant else "NAO",
            "select_real":      "SIM" if res["acesso"]     else "NAO",
            "colunas":          res["colunas"] or "",
            "erro":             res["erro"] or "",
        })

    for linha in linhas_csv:
        status = "✓ ACESSO OK" if linha["select_real"] == "SIM" else "✗ SEM ACESSO"
        logger.info(f"  {status}  {linha['tabela']}")

    logger.info("")
    logger.info(f"  Total com acesso : {len(tabelas_ok)}/{len(TABELAS_ALVO)}")
    logger.info(f"  Total sem acesso : {len(tabelas_sem_acesso)}/{len(TABELAS_ALVO)}")

    # ── Grants necessários ────────────────────────────────────
    if tabelas_sem_acesso:
        separador("Comandos GRANT para a TI")
        grants = gerar_grants_necessarios(tabelas_sem_acesso, usuario)

        # Salva os grants em arquivo .sql para enviar à TI
        sql_path = os.path.join(DOWNLOADS, f"grants_ressuprimentos_{HOJE}.sql")
        with open(sql_path, "w", encoding="utf-8") as f:
            f.write("\n".join(grants) + "\n")
        logger.info(f"  Arquivo SQL salvo em: {sql_path}")

    # ── CSV de resultado ──────────────────────────────────────
    nome_csv = f"ressuprimentos_acesso_{HOJE}.csv"
    salvar_csv(nome_csv, linhas_csv)

    separador("CONCLUÍDO")
    logger.info(f"  Resultados em: {DOWNLOADS}/")


if __name__ == "__main__":
    main()
