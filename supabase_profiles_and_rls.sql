-- ============================================================
-- profiles table: stores role and entidade assignments per user
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome          TEXT        NOT NULL,
  role          TEXT        NOT NULL CHECK (role IN ('Admin', 'Analista')) DEFAULT 'Analista',
  entidades     TEXT[]      NOT NULL DEFAULT '{}',
  photo_url     TEXT,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- A user can always read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin');

-- Only admins can write profiles
CREATE POLICY "Admins can manage profiles"
  ON profiles FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin');

-- ============================================================
-- Update RLS on data tables: Admin sees all, Analista scoped
-- ============================================================
-- processo_contrato
DROP POLICY IF EXISTS "Authenticated users can read processo_contrato" ON processo_contrato;
CREATE POLICY "Role-based access to processo_contrato"
  ON processo_contrato FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin'
    OR entidade = ANY((SELECT entidades FROM profiles WHERE id = auth.uid()))
  );

-- fase1_analise_contrato
DROP POLICY IF EXISTS "Authenticated users can read fase1_analise_contrato" ON fase1_analise_contrato;
CREATE POLICY "Role-based access to fase1_analise_contrato"
  ON fase1_analise_contrato FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin'
    OR entidade = ANY((SELECT entidades FROM profiles WHERE id = auth.uid()))
  );

-- contrato_catalogo
DROP POLICY IF EXISTS "Authenticated users can read contrato_catalogo" ON contrato_catalogo;
CREATE POLICY "Role-based access to contrato_catalogo"
  ON contrato_catalogo FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin'
    OR entidade = ANY((SELECT entidades FROM profiles WHERE id = auth.uid()))
  );

-- ============================================================
-- Storage bucket for user photos
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-photos', 'user-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-photos');

CREATE POLICY "Authenticated users can read photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-photos');
