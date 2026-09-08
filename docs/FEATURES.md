# SEGECON — Features

## Phase 1 — Scaffold (completed 2026-09-04)

**What was built:**
- Git repo initialized with `.gitignore` (node_modules, dist, .env, .venv, etc.)
- Vite + React 18 + TypeScript project initialized in `frontend/`
- Runtime dependencies: MUI v6, MUI X Charts v7, MUI X Date Pickers v7, MUI Icons v6, Emotion, TanStack Query, React Router DOM, Supabase JS client, Day.js, Recharts
- Dev dependencies: TypeScript ESLint, ESLint, Prettier, react-hooks plugin
- Full directory structure for all planned features, hooks, services, types, theme, i18n
- MUI theme stub (`theme.ts`): teal/clinical-blue palette, card overrides, prioridade color tokens
- All Supabase types matching exact schema column names (`processoContrato.types.ts`, `auth.types.ts`, `indicadores.types.ts`)
- Supabase client (`supabaseClient.ts`) — credentials from env vars only, throws on missing vars
- `processoContrato.ts` service with `applyFilters`, `fetchProcessos`, `fetchDistinctEntidades`, `fetchFase1AnaliseByScIds`
- `useDerivedStatus.ts` — business rule 5.1 (current phase derivation from timestamp pairs) + `computeLeadTimeDays`
- `useGlobalFilters.ts` — URL-synced filter state via React Router `useSearchParams`
- `useProcessoContrato.ts` and `useFase1AnaliseContrato.ts` — TanStack Query hooks
- Stub hooks: `useLeadTime.ts`, `useAuth.ts`, `useUserRole.ts`
- `UnavailableIndicator.tsx` — shared component for all data-gap indicators (dashed border, warning icon)
- `i18n/strings.pt-BR.ts` — centralized pt-BR string registry (nav, filters, status, errors, auth, gestao usuario)
- React Router routes wired up for all 12 pages in `App.tsx`
- `AppShell.tsx` stub (sidebar placeholder + main content area with Outlet)
- `LoginPage.tsx` placeholder
- All 12 feature `index.tsx` pages as "em construção" placeholders
- All remaining component stubs: KpiCard, DistributionChart, LeadTimeChart, RevisionsChart, ProcessDetailTable, GlobalFilterBar, EntityFilter, PriorityFilter, DateRangeFilter, ResponsibleFilter, PhaseTabs, PageHeader
- `.env` with real Supabase credentials (gitignored) + `.env.example` for onboarding
- `.eslintrc.cjs` and `.prettierrc` configured
- Root `README.md` with setup instructions
- `docs/ARCHITECTURE.md` with system diagram, auth flow, RLS pattern, env var table
- `backend/README.md` documenting the three Supabase tables and ETL approach
- Build verified clean (`npm run build`)

**Backed by:** `processo_contrato`, `fase1_analise_contrato`, `contrato_catalogo` (Supabase)

**Known limitations / TODOs for Phase 2:**
- All feature pages are placeholder stubs — real content starts Phase 2
- AppShell sidebar and topbar are unstyled stubs — full design in Phase 2
- Login page is a stub — full Supabase Auth implementation in Phase 2
- Gap 1–5 components will render `UnavailableIndicator` — waiting on backend data sources
- Auth/RLS enforcement not yet wired (Phase 2)
- Lead time aggregation (`useLeadTime.ts`) is a stub returning empty array — implementation in Phase 2

---

## Phase 2 — Design System (completed 2026-09-04)

**What was built:**

### Design system
- Inter font loaded via Google Fonts in `index.html`; `<title>` set to `SEGECON`
- `theme.ts` enhanced with Apple-inspired card depth (subtle gradient + border + box-shadow), `MuiChip`, `MuiTableCell` (0.8125rem font), `MuiButton` (no textTransform, fontWeight 600), `MuiDrawer` overrides
- Exported `phaseColors` map (8 distinct colors for the 8 process phases)
- Logos copied into `frontend/public/` from root `public/`

### Auth layer
- `supabase_profiles_and_rls.sql` — profiles table with role/entidades, RLS policies for all three data tables, `user-photos` storage bucket
- `auth.types.ts` — `AppUser` now uses `nome` (was `name`) to match DB column
- `authService.ts` — full auth operations: `signIn`, `signOut`, `getCurrentUser`, `createUser`, `updateUserProfile`, `resetUserPassword`, `uploadUserPhoto`, `listAllUsers`
- `useAuth.ts` — real Supabase session subscription, returns live `AppUser | null`
- `useUserRole.ts` — derives `isAdmin`, `isAnalista`, `scopedEntidades` from `useAuth`

### Auth context + route protection
- `AuthContext.tsx` — React context wrapping `useAuth`, single source of truth for auth state
- `ProtectedRoute.tsx` — redirects unauthenticated users to `/login`; supports `requiredRole` prop for Admin-only routes
- `App.tsx` — wrapped in `<AuthProvider>`, all protected routes inside `<ProtectedRoute>`, `/gestao-usuario` additionally guarded with `requiredRole="Admin"`

### LoginPage
- Two-column layout: left branding panel (teal gradient + all three logos + app title) hidden on mobile; right form panel with Card
- Password visibility toggle, "Esqueceu sua senha?" link, error Alert, loading state
- Mobile: single-column with logo shown above form
- All strings from `strings.pt-BR.ts`

### AppShell
- Sidebar (248px): SEGECON header, grouped nav with `ListSubheader` for "Fases do Processo", "Outros", "Administração" (Admin-only); active item teal tint + bold; "Alteração Contratual" gets "Em breve" Chip; user card at bottom with avatar (photo or initials), role chip, logout button
- Topbar (64px): AGIR logo left, DaherLab logo absolute-centered, Transformação Digital logo right, user avatar + name + logout icon widget far right
- Uses `useAuthContext` for user data and role-based nav filtering

### Gestão de Usuários page
- Header with title + "Novo Usuário" button (Admin-gated via `useUserRole`)
- MUI Table: Avatar, Nome, E-mail, Perfil chip, Unidades chips (max 3 + "+N"), Ações
- Right-side Drawer (480px): create/edit form with photo upload + preview, nome, email (create only), senha (create only), Perfil select, Unidades Autocomplete (shown only for Analista role)
- Reset password: confirmation Dialog → calls `resetUserPassword` → Snackbar success
- Skeleton loading, empty-state row, error Alert
- `useQuery` + `useMutation` (TanStack Query), invalidates user list on success
- Non-Admin users see `strings.errors.semAcesso` Alert

### Strings
- Added `auth.loginSubtitle`
- Added full `gestaoUsuario` key set: editarUsuario, criarUsuario, salvarAlteracoes, cancelar, confirmarResetSenha, confirmar, senhaResetEnviada, usuarioCriado, usuarioAtualizado, nenhumUsuario, carregarFoto, unidadesPlaceholder, col* headers

**Build:** `npm run build` passes clean (1027 modules, no TypeScript errors).

**Known limitations / TODOs for Phase 3:**
- Feature pages (Visão Geral, all Fase pages, Alteração Contratual) are still placeholder stubs
- `createUser` via `supabase.auth.admin.createUser` requires service-role key — in production, this should be a backend function or Edge Function; frontend will throw unless service-role key is in the anon client (not recommended for prod)
- `listAllUsers` returns empty emails (auth.users not accessible via anon key); display shows nome+role only
- Lead time aggregation (`useLeadTime.ts`) remains a stub

---

## Phase 3 — Overview Dashboard (completed 2026-09-04)

**What was built:**

### Hooks
- `useLeadTime.ts` — fully implemented. Iterates all 8 phase timestamp pairs, separates completed durations from in-progress ones, computes min/q1/median/q3/max/mean per phase. In-progress processes are counted separately and excluded from averages.
- `useOverviewData.ts` (new) — client-side metrics derivation: counts ativos/cancelados/concluídos, sums `solicitacao_valor_estimado`, builds phase distribution, porUnidade, porPrioridade, topDepartamentos, and two Fase 1 sub-status donuts. Cancelled processes are excluded from all KPIs except the `totalCancelados` counter.

### Chart components
- `KpiCard.tsx` — polished KPI card with colored left border, optional delta trend arrow (TrendingUp/Down), optional tooltip (InfoOutlined), and Skeleton loading state.
- `DistributionChart.tsx` — horizontal or vertical bar chart backed by Recharts; supports optional color maps, segment toggle buttons, and `maxItems` cap. Used for phase distribution, por unidade, top departamentos.
- `LeadTimeChart.tsx` — horizontal bar chart for mean lead time per phase; custom tooltip shows mean/median/min/max and in-progress count; colored by `phaseColors` from theme.
- `PriorityPieChart.tsx` (new) — reusable donut/pie chart for priority breakdown and Fase 1 status distributions; supports `innerRadius` prop (0 = full pie, >0 = donut).

### Filter bar
- `GlobalFilterBar.tsx` — fully implemented sticky filter bar (sticks below 64px AppBar). Includes Unidade Autocomplete (locked + pre-filled for Analista role), Prioridade Autocomplete, date range pickers (MUI X DatePicker with dayjs pt-BR adapter), "Incluir cancelados" Switch, and conditional "Limpar filtros" button. All state lives in the URL via `useGlobalFilters`.

### Overview page (`features/overview/index.tsx`)
- 5-row layout: KPI cards row, phase funnel + priority donut, por unidade + lead time, two Fase 1 status donuts, top departments.
- Always fetches with `incluirCancelados: true`; `useOverviewData` handles exclusion logic.
- Full Skeleton loading states for every chart section.

### i18n
- Added `strings.phases` (8 × Short + Full labels)
- Added `strings.overview` (all UI labels for the overview page)

**Build:** `npm run build` passes clean (1898 modules, no TypeScript errors).

**What to verify manually:**
- Visit `/` (overview page) — all 4 KPI cards render with colored left borders
- Phase distribution bars appear (active processes per phase)
- Priority donut shows Imediata/Urgente/Programa with correct colors from `prioridadeColors`
- Lead time chart shows per-phase mean bars; hover tooltip shows median/min/max
- Filter bar sticks below the 64px topbar when scrolling
- Changing filter values updates the URL and re-fetches data
- As Analista user: Unidade filter is disabled and pre-populated with `scopedEntidades`

---

## Phase 4 — Detailed Process Table (completed 2026-09-04)

**What was built:**

### New services
- `services/exportCsv.ts` — UTF-8 CSV export with `\uFEFF` BOM (for Excel compatibility), header alias map, RFC-4180 quoting; triggered by the table toolbar download button.

### New hooks
- `hooks/useResponsavelMap.ts` — builds a `Map<id_controle_sc, nome>` from `fase1_analise_contrato` records, keeping the highest `nro_revisao` per SC. Used to join responsável data into the table rows.
- `features/processos/useProcessoTableRows.ts` — enriched row builder. Joins `responsavelMap`, derives `faseAtual` / `faseLabel` / `faseColor` (from `useDerivedStatus` + theme), computes `diasNaFase` for in-progress rows, formats `valorFormatted` in BRL. Responsável is `null` (Gap 2) for all phases except Fase 1.

### Updated services
- `services/processoContrato.ts` — `fetchFase1AnaliseByScIds` now batches in chunks of 500 to avoid Supabase URL-length limits for large id arrays.

### Components
- `components/tables/ProcessDetailTable.tsx` — replaced stub with fully generic `<ProcessDetailTable<T>>`. Features: column-definition driven (ColumnDef<T>), client-side search across configurable fields, multi-column sorting (asc/desc), pagination (10/25/50/100 rows), CSV export, Skeleton loading state. No domain logic inside — stays generic.

### Feature: `/processos`
- `features/processos/solicitacaoColumns.tsx` — column definitions for the Solicitação tab. Fase chip with phase color, Prioridade chip with priority color, Responsável with info-icon tooltip when null (Gap 2), formatted BRL value, all headers from `strings.processos`.
- `features/processos/index.tsx` — ProcessosPage with 4 tabs: Solicitação (real data), Vigência / Consumo / Pagamento (all show `UnavailableIndicator` — Gap 5, awaiting data sources).

### Routing + navigation
- `App.tsx` — added `<Route path="/processos" element={<ProcessosPage />} />`
- `AppShell.tsx` — added `TableChartIcon` nav item "Detalhamento de Processos" to the first nav group (before "Fases do Processo")

### i18n
- `strings.pt-BR.ts` — added `strings.processos` (all table labels, column headers, search placeholder, pagination text, empty state), `strings.nav.processos`, `strings.vigenciaGap`, `strings.consumoGap`, `strings.pagamentoGap`

**Build:** `npm run build` passes clean (1910 modules, no TypeScript errors).

**What to verify manually:**
- Navigate to "Detalhamento de Processos" in the sidebar — page loads with Solicitação tab active
- Table rows render with phase chips (colored by `phaseColors`) and priority chips (colored by `prioridadeColors`)
- Fase 1 rows show responsável name (from `fase1_analise_contrato`); all other phases show `—` with an info tooltip
- "Dias na Fase" column shows elapsed days only for in-progress rows; completed/cancelled show `—`
- Search field filters across entidade, nº processo, departamento, responsável
- Column header click sorts; second click reverses; pagination controls work
- Download icon exports a CSV that opens in Excel with accented characters rendered correctly (BOM prefix)
- Vigência, Consumo, Pagamento tabs each show `UnavailableIndicator` with the correct gap message
- Global filter bar filters carry over from other pages (URL-synced state)

---

## Phase 5 — Per-phase Indicator Views (completed 2026-09-04)

**What was built:**

### Generic layout
- `components/layout/PhaseView.tsx` — single shared layout component used by all 9 phase views. Accepts `phaseKey`, `title`, `subtitle`, optional `statusColumn` (for status donut), `showResponsavelChart`, `extraIndicators` render prop, `gapIndicators`, and `tableFilterKey`. Handles all data fetching, metrics computation, and chart/table rendering. Phases are thin — they just render `<PhaseView>` with config.

### New hook
- `hooks/usePhaseMetrics.ts` — computes per-phase metrics from a `ProcessoContrato[]` array:
  - `currentlyInPhase` / `currentlyInPhaseCount` — active processes in the phase (inicio filled, fim null, not cancelled)
  - `enteredPhase` / `enteredPhaseCount` — all processes that ever entered the phase (all-time)
  - `avgLeadTimeDays` / `medianLeadTimeDays` — from completed processes only
  - `byPrioridade` — distribution of currently-in-phase processes by `solicitacao_tipo`
  - `leadTimeByPrioridade` — average lead time per priority (from completed processes)
  - `byStatus` — distribution by an arbitrary DB status column (optional)

### Updated chart
- `components/charts/RevisionsChart.tsx` — fully implemented. Groups `fase1_analise_contrato` records by `id_controle_sc`, counts distinct `nro_revisao` values per process, buckets into 0/1/2/3/4+ bars with traffic-light colors. Shows average revisions chip and tooltip.

### i18n additions (`strings.faseIndicators`)
- Common KPI labels: `atualmenteNaFase`, `entraram`, `mediaLeadTime`, `medianaLeadTime`, `leadTimePorPrioridade`, `distribuicaoPorPrioridade`, `distribuicaoPorStatus`, `distribuicaoPorResponsavel`, `detalhamento`
- Revisions: `revisoes`, `revisoesTip`, `media`
- Gap messages: `gap1Title/Source/Details`, `gap2ResponsavelTitle/Source/Details`, `gap3SubstatusTitle/Source/Details`

### Phase feature pages (all replaced from stubs)
| Page | Path | Notes |
|---|---|---|
| Fase 1 – Análise Contrato | `/fase1-analise-contrato` | RevisionsChart + responsável distribution + status donut + Gap 1 indicator |
| Fase 1 – Aprovação Solicitação | `/fase1-aprovacao-solicitacao` | Status donut + Gap 2 (responsável) + Gap 1 (sub-status) indicators |
| Fase 2 – Preparação Cotação | `/fase2-preparacao-cotacao` | Standard layout |
| Fase 3 – Cotação | `/fase3-cotacao` | `cotacao_status` donut |
| Fase 4 – Análise Cotação | `/fase4-analise-cotacao` | Standard layout |
| Fase 5 – Aprovação Contrato | `/fase5-aprovacao-contrato` | Standard layout |
| Fase 6 – Assinatura Contrato | `/fase6-assinatura-contrato` | Gap 2 (responsável) + Gap 3 (sub-status) indicators |
| Fase 7 – Validação Anexos | `/fase7-validacao-anexos` | Standard layout |
| Fase 8 – Publicação | `/fase8-publicacao` | Standard layout |
| Alteração Contratual | `/alteracao-contratual` | Gap placeholder (awaiting data source) |

**Build:** `npm run build` passes clean (1913 modules, no TypeScript errors).

**What to verify manually:**
- Visit each phase URL — page renders KPI cards, lead time by priority bar chart, priority donut, and detail table
- Fase 1 Análise Contrato (`/fase1-analise-contrato`): RevisionsChart and responsável distribution chart appear
- Status donut appears on Fase 1 Análise, Fase 1 Aprovação, and Fase 3 (where `statusColumn` is set)
- Gap indicators appear with dashed warning border on Fase 1 Análise, Fase 1 Aprovação, and Fase 6
- Alteração Contratual shows a single `UnavailableIndicator` placeholder
- Global filters (unidade, prioridade, date range) propagate to all phase views via URL params
- "Atualmente na fase" KPI changes when filters are applied
- Detail table search, sort, pagination, and CSV export work on phase pages
