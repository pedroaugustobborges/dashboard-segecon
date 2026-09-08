# SEGECON — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│  ┌──────────────────────────────────────────┐                   │
│  │  React 18 + TypeScript + Vite            │                   │
│  │  MUI v6 · TanStack Query · React Router  │                   │
│  └──────────────┬───────────────────────────┘                   │
└─────────────────│───────────────────────────────────────────────┘
                  │ HTTPS (PostgREST + Auth REST)
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase (hosted)                                              │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │  PostgREST   │  │  Supabase Auth  │  │  Storage (future) │  │
│  │  (auto API)  │  │  (JWT + RLS)    │  │                   │  │
│  └──────┬───────┘  └────────┬────────┘  └───────────────────┘  │
│         └──────────┬────────┘                                   │
│                    ▼                                            │
│         ┌──────────────────┐                                    │
│         │  PostgreSQL DB   │                                    │
│         │  (Supabase-mgd)  │                                    │
│         └──────────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘

                        ▲
                        │ ETL (Python · psycopg2 + supabase-py)
                        │ writes via service-role key (bypasses RLS)
                        │
┌───────────────────────┴─────────────────────────────────────────┐
│  Hospital RDS (AWS PostgreSQL)                                  │
│  schema: ressuprimentos                                         │
│  Tables: solicita_compra, cotacao, contrato, ...                │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Structure

```
frontend/src/
├── App.tsx                        # Root routing + providers
├── main.tsx                       # ReactDOM entry point
├── components/
│   ├── charts/
│   │   ├── KpiCard.tsx            # Metric card with optional delta trend
│   │   ├── DistributionChart.tsx  # Bar/pie for priority or status distribution
│   │   ├── LeadTimeChart.tsx      # Box-plot lead time per phase
│   │   ├── RevisionsChart.tsx     # Revision count trend chart
│   │   └── UnavailableIndicator.tsx  # Shared "gap" placeholder component
│   ├── tables/
│   │   └── ProcessDetailTable.tsx # Sortable/filterable process detail table
│   ├── filters/
│   │   ├── GlobalFilterBar.tsx    # Container for all filter controls
│   │   ├── EntityFilter.tsx       # Unidade (entidade) multi-select
│   │   ├── PriorityFilter.tsx     # Prioridade (solicitacao_tipo) filter
│   │   ├── DateRangeFilter.tsx    # Date range picker (MUI X Date Pickers)
│   │   └── ResponsibleFilter.tsx  # Comprador responsável filter
│   └── layout/
│       ├── AppShell.tsx           # Sidebar + topbar wrapper with Outlet
│       ├── PhaseView.tsx          # Generic per-phase layout (KPIs, charts, table) — used by all 9 phase pages
│       ├── PhaseTabs.tsx          # Phase tab navigation
│       └── PageHeader.tsx         # Page title + breadcrumb
├── features/
│   ├── processos/                 # Detalhamento de Processos — 4-tab detail table
│   │   ├── index.tsx              # Page with Solicitação / Vigência / Consumo / Pagamento tabs
│   │   ├── useProcessoTableRows.ts # Enriched row builder (phase derivation + responsável join)
│   │   └── solicitacaoColumns.tsx  # Column definitions for the Solicitação tab
│   ├── overview/                  # Visão Geral — cross-phase KPI dashboard
│   ├── fase1-analise-contrato/    # Phase 1a: contract analysis review
│   ├── fase1-aprovacao-solicitacao/  # Phase 1b: request approval
│   ├── fase2-preparacao-cotacao/  # Phase 2: quote preparation
│   ├── fase3-cotacao/             # Phase 3: quotation
│   ├── fase4-analise-cotacao/     # Phase 4: quote analysis
│   ├── fase5-aprovacao-contrato/  # Phase 5: contract approval
│   ├── fase6-assinatura-contrato/ # Phase 6: contract signing
│   ├── fase7-validacao-anexos/    # Phase 7: annex validation
│   ├── fase8-publicacao/          # Phase 8: publication
│   ├── alteracao-contratual/      # Contract amendments view
│   ├── gestao-usuario/            # Admin user management
│   └── auth/                      # Login page
├── hooks/
│   ├── useProcessoContrato.ts     # React Query hooks for main table
│   ├── useFase1AnaliseContrato.ts # React Query hook for fase1 log table
│   ├── useDerivedStatus.ts        # Business rule 5.1: phase derivation
│   ├── useLeadTime.ts             # Lead time aggregation per phase (overview)
│   ├── usePhaseMetrics.ts         # Per-phase KPI + distribution metrics (used by PhaseView)
│   ├── useGlobalFilters.ts        # URL-synced global filter state
│   ├── useAuth.ts                 # Auth state (Supabase Auth)
│   ├── useUserRole.ts             # Role derived from user metadata
│   └── useResponsavelMap.ts       # Map<id_controle_sc, nome> from fase1_analise_contrato
├── services/
│   ├── supabaseClient.ts          # Single Supabase client instance
│   ├── processoContrato.ts        # All Supabase queries (no direct queries in components)
│   └── exportCsv.ts               # UTF-8 CSV export utility (BOM + RFC-4180 quoting)
├── types/
│   ├── processoContrato.types.ts  # DB row types (verbatim column names)
│   ├── indicadores.types.ts       # Computed indicator types (KPI, LeadTime, etc.)
│   └── auth.types.ts              # AppUser, UserRole
├── theme/
│   └── theme.ts                   # MUI theme + prioridadeColors token map
└── i18n/
    └── strings.pt-BR.ts           # All pt-BR UI strings (never hardcoded in JSX)
```

## Auth Flow (Phase 2 implementation)

```
Browser                      Supabase Auth           PostgreSQL
  │                               │                      │
  │── /login form submit ─────────▶                      │
  │        signInWithPassword     │                      │
  │◀─────── JWT (session) ────────│                      │
  │                               │                      │
  │── getCurrentUser() ───────────▶                      │
  │   supabase.auth.getUser()     │                      │
  │   + profiles table SELECT ────────────────────────── ▶
  │◀─────── AppUser (nome, role, entidades) ─────────────│
  │                               │                      │
  │  AuthContext stores AppUser   │                      │
  │  ProtectedRoute checks user   │                      │
  │  useUserRole derives isAdmin  │                      │
```

1. User visits any route → `ProtectedRoute` checks `AuthContext`
2. `AuthContext` is backed by `useAuth`, which calls `getCurrentUser()` on mount and subscribes to `supabase.auth.onAuthStateChange`
3. If `user === null` → redirect to `/login`
4. `LoginPage` calls `signIn(email, password)` from `authService.ts`
5. On success, Supabase returns a JWT → stored in localStorage by the JS client
6. `getCurrentUser()` fetches the `profiles` row for `auth.uid()` to get `nome`, `role`, `entidades`, `photo_url`
7. `useUserRole` derives `isAdmin`, `isAnalista`, `scopedEntidades` from `AppUser`
8. Admin-only routes (e.g. `/gestao-usuario`) are wrapped in `<ProtectedRoute requiredRole="Admin" />` — non-Admins are redirected to `/visao-geral`

### Profiles table

`profiles` is a companion table to `auth.users`:

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | References `auth.users(id)` |
| `nome` | TEXT | Display name |
| `role` | TEXT | `'Admin'` or `'Analista'` |
| `entidades` | TEXT[] | List of `entidade` values the Analista can see |
| `photo_url` | TEXT | Supabase Storage URL |
| `criado_em` | TIMESTAMPTZ | Auto-set |
| `atualizado_em` | TIMESTAMPTZ | Updated on profile write |

## RLS (Row Level Security)

RLS is enforced at the database level. The `profiles` table acts as the authority for role and entidade scoping.

```sql
-- Data tables: Admin sees all, Analista sees own entidades
CREATE POLICY "Role-based access to processo_contrato"
  ON processo_contrato FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin'
    OR entidade = ANY((SELECT entidades FROM profiles WHERE id = auth.uid()))
  );
```

The same pattern applies to `fase1_analise_contrato` and `contrato_catalogo`.

Admins see all rows. Analistas see only rows where `entidade` matches their `entidades` array.

ETL scripts use the `service_role` key which bypasses RLS entirely (never exposed to the frontend).

### Storage

`user-photos` bucket (private) stores user avatars at `{userId}/avatar.{ext}`.
RLS policies allow any authenticated user to upload/read photos.

## Environment Variables

| Variable | Location | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `frontend/.env` | Supabase project URL (safe to expose) |
| `VITE_SUPABASE_ANON_KEY` | `frontend/.env` | Anon key for client queries (safe to expose; RLS enforces access) |
| `PROJECT_SUPABASE_ID` | root `.env` | Used by ETL to identify the project |
| `SUPABASE_SERVICE_ROLE_SECRET_KEY` | root `.env` | ETL write access — NEVER expose to frontend |
| `RDS_HOST` | root `.env` | Hospital RDS hostname |
| `RDS_PORT` | root `.env` | Hospital RDS port |
| `RDS_DB` | root `.env` | Hospital RDS database name |
| `RDS_USER` | root `.env` | Hospital RDS username |
| `RDS_PASSWORD` | root `.env` | Hospital RDS password |

## Data Flow

1. ETL runs on schedule (cron / manual trigger)
2. Reads from RDS `ressuprimentos` schema
3. Upserts into Supabase tables via service-role REST API
4. Frontend queries Supabase via anon key + RLS in real time
5. TanStack Query caches results for 5 minutes (configurable per query)

## Phase Column Conventions

Each phase N has:
- `faseN_data_inicio_<description>` — when the phase started (filled when entered)
- `faseN_data_fim_<description>` — when the phase ended (null = still in progress)

Business rule 5.1 (`useDerivedStatus.ts`): current phase = last phase where `data_inicio` is filled and `data_fim` is null.

## Batched Fetch Pattern (Phase 4)

Supabase PostgREST encodes `.in()` filter values in the URL query string. With large datasets (>1000 rows in `processo_contrato`), the resulting `id_controle_sc=in.(1,2,3,...)` can exceed browser/server URL-length limits (~8 KB).

`fetchFase1AnaliseByScIds` in `processoContrato.ts` handles this by splitting the id list into chunks of 500 and firing sequential requests, merging results in memory:

```typescript
const BATCH = 500
for (let i = 0; i < idControleScList.length; i += BATCH) {
  const batch = idControleScList.slice(i, i + BATCH)
  const { data, error } = await supabase
    .from('fase1_analise_contrato').select('*').in('id_controle_sc', batch)
  results.push(...data)
}
```

Apply the same pattern to any other `.in()` call that could receive more than ~500 ids.

## Divergences from Spec

- `@mui/x-charts@^7` uses `@react-spring/web@9.7.5` which declares peer React 16–18, but the project uses React 19. npm overrides the peer dep with warnings — the library works fine at runtime.
- `eslint-plugin-react` was installed but `eslint-plugin-react-refresh` is referenced in `.eslintrc.cjs` — ensure `eslint-plugin-react-refresh` is added in Phase 2 when the lint script is fully wired up.
