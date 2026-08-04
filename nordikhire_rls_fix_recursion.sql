-- ============================================================================
-- NORDIKHIRE — CORRECÇÃO: recursão infinita entre políticas de RLS
-- ============================================================================
-- A política `candidates_visible_to_recruiters` (em candidates) consulta
-- `applications`, e a política `candidate_views_own_applications` (em
-- applications) consultava `candidates` de volta — ciclo infinito que o
-- Postgres rejeita com erro (surge como 500 via PostgREST).
--
-- Correcção: tal como current_company_id(), criar current_candidate_id()
-- como função SECURITY DEFINER — ignora RLS internamente, por isso não
-- reactiva a política de `candidates` ao ser chamada a partir de outra
-- tabela.
-- ============================================================================

create or replace function current_candidate_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
    select id from candidates where auth_user_id = auth.uid()
$$;

drop policy if exists candidate_views_own_applications on applications;
create policy candidate_views_own_applications on applications
    using (candidate_id = current_candidate_id());

drop policy if exists candidate_owns_oauth_imports on candidate_oauth_imports;
create policy candidate_owns_oauth_imports on candidate_oauth_imports
    using (candidate_id = current_candidate_id());

drop policy if exists candidate_owns_subscription on candidate_subscriptions;
create policy candidate_owns_subscription on candidate_subscriptions
    using (candidate_id = current_candidate_id());
