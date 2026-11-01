-- =============================================================================
-- PENCILL: HARDEN ROW LEVEL SECURITY (RLS) & AUTHENTICATION BOUNDARIES
-- Migration: 20261031020000_harden_rls_security_boundaries.sql
-- Closes security boundaries identified in the security audit:
-- 1. Eliminates anonymous modification/deletion on community discussions & replies
-- 2. Strictly scopes spaced repetition cards to authenticated owners
-- 3. Restricts generated reading materials update to authenticated owners & admins
-- 4. Locks master educators catalog mutations to admin only
-- 5. Restricts learner credential issuance to authenticated users/admins
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. COMMUNITY DISCUSSIONS: Secure Ownership Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authors can update discussions" ON public.community_discussions;
CREATE POLICY "Authors can update discussions"
  ON public.community_discussions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (auth.uid() = user_id OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Authors can delete discussions" ON public.community_discussions;
CREATE POLICY "Authors can delete discussions"
  ON public.community_discussions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- -----------------------------------------------------------------------------
-- 2. COMMUNITY REPLIES: Secure Ownership Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authors can update replies" ON public.community_replies;
CREATE POLICY "Authors can update replies"
  ON public.community_replies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (auth.uid() = user_id OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Authors can delete replies" ON public.community_replies;
CREATE POLICY "Authors can delete replies"
  ON public.community_replies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- -----------------------------------------------------------------------------
-- 3. SPACED REPETITION CARDS: Strict User Isolation
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own spaced repetition cards" ON public.spaced_repetition_cards;
CREATE POLICY "Users can manage their own spaced repetition cards"
  ON public.spaced_repetition_cards FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. GENERATED READING MATERIALS: Owner & Admin Update Boundaries
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Owners and server can update reading materials" ON public.generated_reading_materials;
CREATE POLICY "Owners and server can update reading materials"
  ON public.generated_reading_materials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (auth.uid() = user_id OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- -----------------------------------------------------------------------------
-- 5. MASTER EDUCATORS: Lock to Read-Only for General Users
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated users to insert master educators" ON public.master_educators;
DROP POLICY IF EXISTS "Allow authenticated users to update master educators" ON public.master_educators;
DROP POLICY IF EXISTS "Allow authenticated users to delete master educators" ON public.master_educators;
DROP POLICY IF EXISTS "Allow authenticated modifications on master educators" ON public.master_educators;

CREATE POLICY "Admins can mutate master educators"
  ON public.master_educators FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- -----------------------------------------------------------------------------
-- 6. LEARNER CREDENTIALS: Scope to Owner / Admin
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authorized insertion of credentials" ON public.learner_credentials;
CREATE POLICY "Authorized insertion of credentials"
  ON public.learner_credentials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
