-- ============================================================================
-- NORDIKHIRE — CORRECÇÃO CRÍTICA: políticas RLS eram FOR ALL, não FOR SELECT
-- ============================================================================
-- Encontrado num audit de segurança pré-lançamento (2026-08-13).
--
-- Toda a migração original (nordikhire_rls_migration.sql) e o schema.sql
-- criaram as políticas tenant_isolation_*/candidate_owns_*/user_owns_* só
-- com `using (...)`, sem `for select`. O Postgres assume `for all` nesse
-- caso e, sem `with check`, reutiliza o `using` também para validar
-- escritas — qualquer utilizador autenticado conseguia usar a chave anon
-- pública + a própria sessão para chamar o PostgREST directamente e
-- fazer INSERT/UPDATE/DELETE em qualquer linha visível a ele, contornando
-- por completo a aplicação (ex: um "Recrutador" a promover-se a "Admin"
-- via `update users set role_id = ...`).
--
-- A aplicação já escreve exclusivamente através do cliente service_role
-- (lib/supabase/admin.ts) — confirmado: zero chamadas `supabase.from(...)`
-- via o cliente que respeita RLS em todo o `web/src`. Por isso restringir
-- estas políticas a `for select` remove o acesso de escrita não
-- intencional sem qualquer impacto funcional.
--
-- Também restaura `candidate_views_own_test_assignments`, que já estava
-- documentada em nordikhire_schema.sql mas nunca tinha sido aplicada à
-- base de dados (drift pré-existente, não relacionado com este fix).
-- ============================================================================

drop policy if exists tenant_isolation_ai_interviews on ai_interviews;
create policy tenant_isolation_ai_interviews on ai_interviews
    for select using (application_id in (
        select id from applications where company_id = current_company_id()
    ));

drop policy if exists tenant_isolation_api_keys on api_keys;
create policy tenant_isolation_api_keys on api_keys
    for select using (company_id = current_company_id());

drop policy if exists candidate_views_own_applications on applications;
create policy candidate_views_own_applications on applications
    for select using (candidate_id = current_candidate_id());

drop policy if exists tenant_isolation_applications on applications;
create policy tenant_isolation_applications on applications
    for select using (company_id in (
        select company_id from users where id = auth.uid()
    ));

drop policy if exists tenant_isolation_audit_log on audit_log;
create policy tenant_isolation_audit_log on audit_log
    for select using (company_id = current_company_id());

drop policy if exists user_owns_auth_sessions on auth_sessions;
create policy user_owns_auth_sessions on auth_sessions
    for select using (user_id = auth.uid());

drop policy if exists tenant_isolation_dev_reports on candidate_development_reports;
create policy tenant_isolation_dev_reports on candidate_development_reports
    for select using (application_id in (
        select id from applications where company_id = current_company_id()
    ));

drop policy if exists tenant_isolation_candidate_feedback on candidate_feedback;
create policy tenant_isolation_candidate_feedback on candidate_feedback
    for select using (application_id in (
        select id from applications where company_id = current_company_id()
    ));

drop policy if exists candidate_owns_interview_practice on candidate_interview_practice;
create policy candidate_owns_interview_practice on candidate_interview_practice
    for select using (candidate_id = current_candidate_id());

drop policy if exists candidate_owns_oauth_imports on candidate_oauth_imports;
create policy candidate_owns_oauth_imports on candidate_oauth_imports
    for select using (candidate_id = current_candidate_id());

drop policy if exists candidate_owns_optimizations on candidate_profile_optimizations;
create policy candidate_owns_optimizations on candidate_profile_optimizations
    for select using (candidate_id in (
        select id from candidates where auth_user_id = auth.uid()
    ));

drop policy if exists candidate_owns_subscription on candidate_subscriptions;
create policy candidate_owns_subscription on candidate_subscriptions
    for select using (candidate_id = current_candidate_id());

drop policy if exists candidate_owns_profile on candidates;
create policy candidate_owns_profile on candidates
    for select using (auth_user_id = auth.uid());

drop policy if exists candidates_visible_to_recruiters on candidates;
create policy candidates_visible_to_recruiters on candidates
    for select using (id in (
        select candidate_id from applications where company_id = current_company_id()
    ));

drop policy if exists tenant_isolation_companies on companies;
create policy tenant_isolation_companies on companies
    for select using (id = current_company_id());

drop policy if exists tenant_isolation_company_integrations on company_integrations;
create policy tenant_isolation_company_integrations on company_integrations
    for select using (company_id = current_company_id());

drop policy if exists tenant_isolation_company_invites on company_invites;
create policy tenant_isolation_company_invites on company_invites
    for select using (company_id = current_company_id());

drop policy if exists tenant_isolation_onboarding on company_onboarding_progress;
create policy tenant_isolation_onboarding on company_onboarding_progress
    for select using (company_id = current_company_id());

drop policy if exists tenant_isolation_cv_extractions on cv_extractions;
create policy tenant_isolation_cv_extractions on cv_extractions
    for select using (application_id in (
        select id from applications where company_id = current_company_id()
    ));

drop policy if exists tenant_isolation_job_board_postings on job_board_postings;
create policy tenant_isolation_job_board_postings on job_board_postings
    for select using (job_id in (
        select id from jobs where company_id = current_company_id()
    ));

drop policy if exists tenant_isolation_job_translations on job_translations;
create policy tenant_isolation_job_translations on job_translations
    for select using (job_id in (
        select id from jobs where company_id = current_company_id()
    ));

drop policy if exists tenant_isolation_jobs on jobs;
create policy tenant_isolation_jobs on jobs
    for select using (company_id in (
        select company_id from users where id = auth.uid()
    ));

drop policy if exists user_owns_mfa_factors on mfa_factors;
create policy user_owns_mfa_factors on mfa_factors
    for select using (user_id = auth.uid());

drop policy if exists tenant_isolation_notifications_log on notifications_log;
create policy tenant_isolation_notifications_log on notifications_log
    for select using (company_id = current_company_id());

drop policy if exists tenant_isolation_red_flags on red_flags;
create policy tenant_isolation_red_flags on red_flags
    for select using (application_id in (
        select id from applications where company_id = current_company_id()
    ));

drop policy if exists tenant_isolation_roles on roles;
create policy tenant_isolation_roles on roles
    for select using (company_id = current_company_id() or company_id is null);

drop policy if exists tenant_isolation_scoring_results on scoring_results;
create policy tenant_isolation_scoring_results on scoring_results
    for select using (application_id in (
        select id from applications where company_id = current_company_id()
    ));

drop policy if exists tenant_isolation_security_events on security_events;
create policy tenant_isolation_security_events on security_events
    for select using (company_id = current_company_id());

drop policy if exists tenant_isolation_subscription_usage on subscription_usage;
create policy tenant_isolation_subscription_usage on subscription_usage
    for select using (subscription_id in (
        select id from subscriptions where company_id = current_company_id()
    ));

drop policy if exists tenant_isolation_subscriptions on subscriptions;
create policy tenant_isolation_subscriptions on subscriptions
    for select using (company_id = current_company_id());

drop policy if exists tenant_isolation_test_assignments on test_assignments;
create policy tenant_isolation_test_assignments on test_assignments
    for select using (application_id in (
        select id from applications where company_id = current_company_id()
    ));

drop policy if exists candidate_views_own_test_assignments on test_assignments;
create policy candidate_views_own_test_assignments on test_assignments
    for select using (application_id in (
        select id from applications where candidate_id = current_candidate_id()
    ));

drop policy if exists tenant_isolation_users on users;
create policy tenant_isolation_users on users
    for select using (company_id = current_company_id());
