-- ============================================================================
-- NORDIKHIRE — MIGRAÇÃO: completar políticas de RLS em falta
-- ============================================================================
-- Corre isto no SQL Editor do Supabase. Não repitas o schema completo —
-- isto só adiciona o que falta às tabelas que já existem.
--
-- Antes desta migração:
--   - 12 tabelas tinham RLS activada mas só 3 tinham políticas (jobs,
--     applications, candidate_profile_optimizations) — as outras 9
--     bloqueavam tudo a anon/authenticated (seguro, mas incompleto).
--   - 23 tabelas NÃO tinham RLS activada de todo — acesso total e aberto
--     via a chave anon (pública, embutida no browser). Isto incluía dados
--     sensíveis: candidates, cv_extractions, scoring_results, etc.
-- ============================================================================

-- Função auxiliar SECURITY DEFINER: evita recursão infinita quando a
-- política de `users` precisa de consultar a própria tabela `users` para
-- descobrir a company_id do utilizador autenticado.
create or replace function current_company_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
    select company_id from users where id = auth.uid()
$$;

-- ----------------------------------------------------------------------------
-- Políticas em falta nas 9 tabelas que já tinham RLS activada
-- ----------------------------------------------------------------------------

create policy tenant_isolation_users on users
    using (company_id = current_company_id());

create policy tenant_isolation_companies on companies
    using (id = current_company_id());

create policy tenant_isolation_subscriptions on subscriptions
    using (company_id = current_company_id());

create policy tenant_isolation_company_integrations on company_integrations
    using (company_id = current_company_id());

create policy tenant_isolation_notifications_log on notifications_log
    using (company_id = current_company_id());

create policy tenant_isolation_audit_log on audit_log
    using (company_id = current_company_id());

create policy tenant_isolation_api_keys on api_keys
    using (company_id = current_company_id());

create policy tenant_isolation_security_events on security_events
    using (company_id = current_company_id());

create policy user_owns_mfa_factors on mfa_factors
    using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Tabelas que não tinham RLS activada de todo
-- ----------------------------------------------------------------------------

alter table plans enable row level security;
alter table candidate_plans enable row level security;
alter table test_providers enable row level security;
alter table subscription_usage enable row level security;
alter table roles enable row level security;
alter table job_translations enable row level security;
alter table candidates enable row level security;
alter table cv_extractions enable row level security;
alter table scoring_results enable row level security;
alter table red_flags enable row level security;
alter table test_assignments enable row level security;
alter table ai_interviews enable row level security;
alter table candidate_feedback enable row level security;
alter table job_board_postings enable row level security;
alter table market_skill_snapshots enable row level security;
alter table market_job_title_snapshots enable row level security;
alter table market_trend_forecasts enable row level security;
alter table external_market_sources enable row level security;
alter table candidate_oauth_imports enable row level security;
alter table candidate_development_reports enable row level security;
alter table auth_sessions enable row level security;
alter table blocked_identities enable row level security;
alter table company_onboarding_progress enable row level security;
alter table candidate_subscriptions enable row level security;

-- Catálogos públicos: leitura para qualquer autenticado, escrita só via
-- service_role.
create policy public_read_plans on plans
    for select using (true);

create policy public_read_candidate_plans on candidate_plans
    for select using (true);

create policy public_read_test_providers on test_providers
    for select using (true);

-- roles: visíveis dentro da própria empresa; company_id null = role global
-- do sistema, visível a todos.
create policy tenant_isolation_roles on roles
    using (company_id = current_company_id() or company_id is null);

create policy tenant_isolation_subscription_usage on subscription_usage
    using (subscription_id in (
        select id from subscriptions where company_id = current_company_id()
    ));

create policy tenant_isolation_job_translations on job_translations
    using (job_id in (
        select id from jobs where company_id = current_company_id()
    ));

create policy tenant_isolation_job_board_postings on job_board_postings
    using (job_id in (
        select id from jobs where company_id = current_company_id()
    ));

create policy tenant_isolation_cv_extractions on cv_extractions
    using (application_id in (
        select id from applications where company_id = current_company_id()
    ));

create policy tenant_isolation_scoring_results on scoring_results
    using (application_id in (
        select id from applications where company_id = current_company_id()
    ));

create policy tenant_isolation_red_flags on red_flags
    using (application_id in (
        select id from applications where company_id = current_company_id()
    ));

create policy tenant_isolation_test_assignments on test_assignments
    using (application_id in (
        select id from applications where company_id = current_company_id()
    ));

create policy tenant_isolation_ai_interviews on ai_interviews
    using (application_id in (
        select id from applications where company_id = current_company_id()
    ));

create policy tenant_isolation_candidate_feedback on candidate_feedback
    using (application_id in (
        select id from applications where company_id = current_company_id()
    ));

create policy tenant_isolation_dev_reports on candidate_development_reports
    using (application_id in (
        select id from applications where company_id = current_company_id()
    ));

create policy tenant_isolation_onboarding on company_onboarding_progress
    using (company_id = current_company_id());

-- candidates: candidato vê/edita o próprio perfil; recrutador vê candidatos
-- que se candidataram a vagas da sua empresa.
create policy candidate_owns_profile on candidates
    using (auth_user_id = auth.uid());

create policy candidates_visible_to_recruiters on candidates
    using (id in (
        select candidate_id from applications where company_id = current_company_id()
    ));

-- Candidato registado vê as suas próprias candidaturas (portal do candidato,
-- roadmap futuro).
create policy candidate_views_own_applications on applications
    using (candidate_id in (
        select id from candidates where auth_user_id = auth.uid()
    ));

create policy candidate_owns_oauth_imports on candidate_oauth_imports
    using (candidate_id in (
        select id from candidates where auth_user_id = auth.uid()
    ));

create policy candidate_owns_subscription on candidate_subscriptions
    using (candidate_id in (
        select id from candidates where auth_user_id = auth.uid()
    ));

create policy user_owns_auth_sessions on auth_sessions
    using (user_id = auth.uid());

-- market_skill_snapshots, market_job_title_snapshots, market_trend_forecasts,
-- external_market_sources, blocked_identities: RLS activada, propositadamente
-- SEM política — nega tudo a anon/authenticated. Só o service_role (backend)
-- lhes toca por agora.
-- ============================================================================
