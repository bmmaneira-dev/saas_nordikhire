-- ============================================================================
-- NORDIKHIRE — MIGRAÇÃO: convites de equipa (gestão de equipa)
-- ============================================================================
-- Corre isto no SQL Editor do Supabase.
--
-- Sem envio de email configurado nesta fase, o convite é um link partilhável
-- (token) que o admin copia e envia manualmente. Separado de `users` porque
-- o convidado ainda não tem conta auth.users — só a cria ao aceitar.
-- ============================================================================

create table company_invites (
    id                  uuid primary key default gen_random_uuid(),
    company_id          uuid not null references companies(id) on delete cascade,
    email               text not null,
    full_name           text,
    role_id             uuid not null references roles(id),
    invited_by          uuid not null references users(id),
    token               text not null unique,
    status              text not null default 'pending', -- pending | accepted | revoked
    created_at          timestamptz default now(),
    accepted_at         timestamptz
);
create index idx_company_invites_company on company_invites(company_id);
create unique index idx_company_invites_pending_email on company_invites(company_id, email) where status = 'pending';

alter table company_invites enable row level security;

create policy tenant_isolation_company_invites on company_invites
    using (company_id = current_company_id());
