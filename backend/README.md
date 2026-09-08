# Backend — SEGECON

The backend is **Supabase** (PostgreSQL + PostgREST + Auth).

## Tables

| Table | Description |
|---|---|
| `processo_contrato` | Main procurement process table — one row per SC/contract process |
| `fase1_analise_contrato` | Contract analysis audit log rows (revisions, approvers) |
| `contrato_catalogo` | Active catalog contracts with value and consumption tracking |

## ETL

Python ETL scripts sync data from the hospital RDS (PostgreSQL, `ressuprimentos` schema) into Supabase via the REST API.

See `../etl_rds_to_supabase.py` (project root) for the sync script.

## Types

The `types/` subdirectory is a placeholder for any future server-side type generation (e.g., `supabase gen types typescript`).
