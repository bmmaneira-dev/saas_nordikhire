-- ============================================================================
-- NORDIKHIRE — SCHEMA DE BASE DE DADOS (Supabase / PostgreSQL)
-- Multi-tenant | Multi-perfil | Preparado para RLS (Row Level Security)
-- ============================================================================
-- Estratégia de multi-tenancy: schema partilhado com coluna company_id em
-- todas as tabelas relevantes + RLS. É a abordagem mais simples de manter e
-- escalar para uma SaaS em fase inicial (vs. schema-por-cliente ou DB-por-cliente).
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. TENANTS (EMPRESAS) E PLANOS DE SUBSCRIÇÃO
-- ============================================================================

create table plans (
    id                  uuid primary key default gen_random_uuid(),
    name                text not null,              -- ex: 'Starter', 'Growth', 'Enterprise'
    price_monthly_kz    numeric(12,2),
    price_monthly_usd   numeric(12,2),
    max_active_jobs     integer,                     -- null = ilimitado
    max_users           integer,
    max_active_applications integer,                 -- MÉTRICA DE COBRANÇA: nº de candidaturas
                                                       -- em estado "activo" (não fechadas) permitidas
                                                       -- em simultâneo neste plano. null = ilimitado
    overage_price_per_application numeric(10,2),     -- preço por candidatura extra acima do limite
    features            jsonb default '{}'::jsonb,   -- {"ai_interview": true, "whatsapp": true,
                                                       --  "market_trends": true, ...}
    created_at          timestamptz default now()
);

create table companies (
    id                  uuid primary key default gen_random_uuid(),
    name                text not null,
    slug                text unique not null,        -- usado no link público de candidatura
    logo_url            text,
    country             text not null default 'AO',   -- código ISO do país da empresa — NÃO assumir Angola:
                                                        -- o NordikHire é multi-região desde o design
    data_residency_region text default 'auto',        -- 'auto' | 'eu' | 'us' | 'af' — relevante se um dia
                                                        -- precisares de segregar onde os dados residem
                                                        -- fisicamente por exigência legal do cliente
    applicable_privacy_frameworks text[] default array['generic'],
    -- ex: ['gdpr','ao_lpdp','lgpd','ccpa'] — usado para adaptar textos de consentimento
    -- e prazos de retenção mostrados ao candidato consoante a jurisdição da empresa
    industry            text,
    default_locale       text not null default 'pt',
    supported_locales     text[] not null default array['pt'],
    allow_market_data_sharing boolean not null default false,
    settings            jsonb default '{}'::jsonb,
    is_active           boolean default true,
    created_at          timestamptz default now(),
    updated_at          timestamptz default now()
);

create table subscriptions (
    id                  uuid primary key default gen_random_uuid(),
    company_id          uuid not null references companies(id) on delete cascade,
    plan_id             uuid not null references plans(id),
    status              text not null default 'trialing',  -- trialing | active | past_due | canceled
    billing_provider    text,                        -- 'stripe' | 'multicaixa' | 'manual'
    external_customer_id text,
    current_period_start timestamptz,
    current_period_end  timestamptz,
    canceled_at         timestamptz,
    created_at          timestamptz default now()
);
create index idx_subscriptions_company on subscriptions(company_id);

-- Contagem de uso por empresa e período de facturação — é esta tabela que
-- alimenta a cobrança "por candidaturas activas".
create table subscription_usage (
    id                  uuid primary key default gen_random_uuid(),
    subscription_id     uuid not null references subscriptions(id) on delete cascade,
    period_start         date not null,
    period_end           date not null,
    active_applications_count integer not null default 0,
    -- "activa" = applications.status not in ('hired','rejected','withdrawn')
    overage_count         integer default 0,
    calculated_at         timestamptz default now()
);
create index idx_subscription_usage_period on subscription_usage(subscription_id, period_start);

-- ============================================================================
-- 2. UTILIZADORES, PERFIS E PERMISSÕES (RECRUTADORES / RH)
-- ============================================================================
-- Nota: auth.users é gerido pelo Supabase Auth. Esta tabela guarda o perfil
-- e a ligação à empresa (tenant).

create table roles (
    id                  uuid primary key default gen_random_uuid(),
    company_id          uuid references companies(id) on delete cascade, -- null = role global do sistema
    name                text not null,               -- 'Admin', 'Recrutador', 'Gestor', 'Leitor'
    permissions         jsonb not null default '{}'::jsonb,
    -- exemplo de permissions: {"jobs.create": true, "jobs.delete": false,
    --                          "candidates.view": true, "billing.manage": false}
    created_at          timestamptz default now()
);

create table users (
    id                  uuid primary key references auth.users(id) on delete cascade,
    company_id          uuid not null references companies(id) on delete cascade,
    role_id             uuid not null references roles(id),
    full_name           text,
    email               text not null,
    phone               text,
    preferred_locale     text default 'pt',
    is_active           boolean default true,
    invited_by          uuid references users(id),
    last_login_at       timestamptz,
    created_at          timestamptz default now()
);
create index idx_users_company on users(company_id);
create unique index idx_users_company_email on users(company_id, email);

-- Convites de equipa: sem envio de email configurado nesta fase, o convite
-- é um link partilhável (token) que o admin copia e envia manualmente
-- (WhatsApp, email, etc). Separado de `users` porque o convidado ainda não
-- tem conta auth.users — só a cria ao aceitar o convite.
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

create table audit_log (
    id                  uuid primary key default gen_random_uuid(),
    company_id          uuid not null references companies(id) on delete cascade,
    user_id             uuid references users(id),
    action              text not null,               -- 'job.created', 'candidate.rejected', ...
    entity_type         text,
    entity_id           uuid,
    metadata            jsonb default '{}'::jsonb,
    created_at          timestamptz default now()
);
create index idx_audit_company_date on audit_log(company_id, created_at desc);

-- ============================================================================
-- 3. VAGAS (JOBS)
-- ============================================================================

create table jobs (
    id                  uuid primary key default gen_random_uuid(),
    company_id          uuid not null references companies(id) on delete cascade,
    created_by          uuid references users(id),
    default_locale       text not null default 'pt',  -- idioma original em que a vaga foi criada
    -- título/descrição/requisitos vivem agora em job_translations (multi-idioma).
    -- campos abaixo são estruturais e não variam por idioma:
    skills_required      jsonb default '[]'::jsonb,   -- ["Python","SQL","Excel avançado"] — normalizado,
                                                        -- não traduzido, usado para matching e para as
                                                        -- tendências de mercado (secção 12)
    seniority_level     text,                        -- 'junior' | 'pleno' | 'senior' | 'lead'
    location            text,
    work_mode           text,                        -- 'presencial' | 'remoto' | 'híbrido'
    salary_range_min     numeric(12,2),
    salary_range_max     numeric(12,2),
    salary_currency       text default 'AOA',
    status              text not null default 'draft', -- draft | open | paused | closed
    public_slug         text unique,                 -- usado no link/QR code público
    whatsapp_number     text,                        -- número dedicado para candidaturas via WhatsApp
    application_deadline date,
    published_at        timestamptz,
    closed_at           timestamptz,
    created_at          timestamptz default now(),
    updated_at          timestamptz default now()
);
create index idx_jobs_company on jobs(company_id);
create index idx_jobs_status on jobs(company_id, status);

-- Conteúdo traduzível de cada vaga — uma linha por idioma suportado
create table job_translations (
    id                  uuid primary key default gen_random_uuid(),
    job_id               uuid not null references jobs(id) on delete cascade,
    locale                text not null,               -- 'pt' | 'en' | 'fr' | ...
    title                 text not null,
    description           text,
    requirements_text      text,                         -- versão em texto livre, legível, deste idioma
    is_machine_translated boolean default false,        -- true se veio de tradução automática (IA)
    created_at            timestamptz default now()
);
create unique index idx_job_translations_job_locale on job_translations(job_id, locale);

-- ============================================================================
-- 4. CANDIDATOS (perfil global — pode candidatar-se a várias empresas)
-- ============================================================================

create table candidates (
    id                  uuid primary key default gen_random_uuid(),
    auth_user_id          uuid references auth.users(id) on delete set null,
    -- opcional: só preenchido quando o candidato cria conta própria (não é
    -- obrigatório para simplesmente se candidatar a uma vaga). É esta conta
    -- que dá acesso às ferramentas de carreira (secção 18) fora do contexto
    -- de uma candidatura específica.
    full_name           text not null,
    email               text,
    phone               text,
    whatsapp_id         text,                        -- id da conversa no WhatsApp Business API
    telegram_id         text,
    linkedin_url        text,
    preferred_locale     text default 'pt',
    consent_data_processing boolean default false,   -- obrigatório para conformidade de proteção de dados
    consent_date        timestamptz,
    created_at          timestamptz default now()
);
create unique index idx_candidates_email on candidates(email) where email is not null;
create index idx_candidates_phone on candidates(phone);
create unique index idx_candidates_auth_user on candidates(auth_user_id) where auth_user_id is not null;

-- ============================================================================
-- 5. CANDIDATURAS (APPLICATIONS) — o coração do fluxo
-- ============================================================================

create table applications (
    id                  uuid primary key default gen_random_uuid(),
    company_id          uuid not null references companies(id) on delete cascade,
    job_id              uuid not null references jobs(id) on delete cascade,
    candidate_id        uuid not null references candidates(id) on delete cascade,
    source              text not null,               -- 'site' | 'link' | 'qrcode' | 'whatsapp' | 'telegram'
    cv_file_url         text,                         -- storage do Supabase
    video_url           text,                         -- vídeo de apresentação opcional
                                                        -- para esta candidatura específica
                                                        -- (storage do Supabase, não é vídeo
                                                        -- de perfil global do candidato)
    status              text not null default 'received',
    -- received -> screening -> scored -> shortlisted -> interview -> test ->
    -- offer -> hired | rejected | withdrawn
    score_total         numeric(5,2),                 -- 0-100
    rank_position        integer,                      -- posição no ranking da vaga
    stage_updated_at    timestamptz default now(),
    applied_at          timestamptz default now(),
    created_at          timestamptz default now()
);
create index idx_applications_job on applications(job_id);
create index idx_applications_company on applications(company_id);
create index idx_applications_candidate on applications(candidate_id);
create unique index idx_applications_job_candidate on applications(job_id, candidate_id);

-- Dados extraídos do CV pela IA
create table cv_extractions (
    id                  uuid primary key default gen_random_uuid(),
    application_id      uuid not null references applications(id) on delete cascade,
    raw_text            text,
    parsed_data         jsonb default '{}'::jsonb,
    -- {"skills": [...], "experience_years": 5, "education": [...],
    --  "languages": [...], "previous_roles": [...]}
    ai_model            text,                         -- 'gpt-4o', etc.
    confidence_score    numeric(4,2),
    extracted_at        timestamptz default now()
);
create unique index idx_cv_extraction_application on cv_extractions(application_id);

-- Score detalhado (breakdown do matching vaga x candidato)
create table scoring_results (
    id                  uuid primary key default gen_random_uuid(),
    application_id      uuid not null references applications(id) on delete cascade,
    overall_score       numeric(5,2) not null,
    breakdown           jsonb default '{}'::jsonb,
    -- {"skills_match": 82, "experience_match": 70, "education_match": 90,
    --  "language_match": 100}
    ai_model            text,
    ai_reasoning        text,                         -- explicação legível do score
    created_at          timestamptz default now()
);

-- Red flags identificadas pela IA
create table red_flags (
    id                  uuid primary key default gen_random_uuid(),
    application_id      uuid not null references applications(id) on delete cascade,
    flag_type           text not null,                -- 'gap_emprego' | 'inconsistencia' | 'sobrequalificado' | ...
    severity            text not null default 'low',  -- low | medium | high
    description          text,
    created_at          timestamptz default now()
);
create index idx_red_flags_application on red_flags(application_id);

-- ============================================================================
-- 6. TESTES (TÉCNICOS E PSICOMÉTRICOS) — integrações externas
-- ============================================================================

create table test_providers (
    id                  uuid primary key default gen_random_uuid(),
    name                text not null,                -- 'SHL', 'Mercer Mettl', 'HackerRank', 'Codility',
                                                        -- 'TestGorilla', 'CodeSignal', 'Hogan', 'Thomas', 'Criteria'
    provider_type       text,                          -- 'technical' | 'psychometric' | 'both'
    api_base_url        text,
    is_active            boolean default true
);

create table company_integrations (
    id                  uuid primary key default gen_random_uuid(),
    company_id          uuid not null references companies(id) on delete cascade,
    provider_id         uuid not null references test_providers(id),
    api_key_encrypted   text,                          -- guardado cifrado (nunca em texto simples)
    config              jsonb default '{}'::jsonb,
    is_active            boolean default true,
    connected_at         timestamptz default now()
);
create unique index idx_company_provider on company_integrations(company_id, provider_id);

create table test_assignments (
    id                  uuid primary key default gen_random_uuid(),
    application_id      uuid not null references applications(id) on delete cascade,
    provider_id         uuid not null references test_providers(id),
    external_test_id    text,                          -- id do teste no sistema do provider
    test_name           text,
    status              text not null default 'assigned', -- assigned | in_progress | completed | expired
    result_score        numeric(5,2),
    result_url          text,
    result_raw          jsonb,
    assigned_at          timestamptz default now(),
    completed_at         timestamptz
);
create index idx_test_assignments_application on test_assignments(application_id);

-- ============================================================================
-- 7. SIMULAÇÃO DE ENTREVISTA COM IA
-- ============================================================================

create table ai_interviews (
    id                  uuid primary key default gen_random_uuid(),
    application_id      uuid not null references applications(id) on delete cascade,
    status              text not null default 'scheduled', -- scheduled | completed | no_show
    transcript          jsonb default '[]'::jsonb,     -- [{"role":"ai","text":"..."}, {"role":"candidate","text":"..."}]
    ai_evaluation       jsonb default '{}'::jsonb,      -- {"communication": 8, "technical_depth": 7, ...}
    ai_summary          text,
    scheduled_at         timestamptz,
    completed_at         timestamptz,
    duration_seconds     integer,
    created_at           timestamptz default now()
);
create index idx_ai_interviews_application on ai_interviews(application_id);

-- ============================================================================
-- 8. FEEDBACK AO CANDIDATO
-- ============================================================================

create table candidate_feedback (
    id                  uuid primary key default gen_random_uuid(),
    application_id      uuid not null references applications(id) on delete cascade,
    feedback_type       text,                          -- 'rejection' | 'next_stage' | 'improvement_tips'
    content              text not null,
    channel               text,                          -- 'email' | 'whatsapp' | 'telegram' | 'platform'
    sent_at               timestamptz,
    created_at            timestamptz default now()
);

-- ============================================================================
-- 9. NOTIFICAÇÕES (WhatsApp / Telegram / Email) — log de envio
-- ============================================================================

create table notifications_log (
    id                  uuid primary key default gen_random_uuid(),
    company_id          uuid not null references companies(id) on delete cascade,
    application_id      uuid references applications(id) on delete cascade,
    channel               text not null,                -- 'whatsapp' | 'telegram' | 'email' | 'sms'
    direction              text not null default 'outbound', -- outbound | inbound
    message               text,
    status                text default 'sent',           -- sent | delivered | read | failed
    external_message_id  text,
    sent_at                timestamptz default now()
);
create index idx_notifications_application on notifications_log(application_id);

-- ============================================================================
-- 10. ATS EXTERNO / PLATAFORMAS DE EMPREGO (publicação cruzada)
-- ============================================================================

create table job_board_postings (
    id                  uuid primary key default gen_random_uuid(),
    job_id              uuid not null references jobs(id) on delete cascade,
    board_name          text not null,                  -- 'LinkedIn', 'Indeed', 'emprego.co.ao', ...
    sync_method          text not null default 'manual', -- 'manual' | 'xml_feed' | 'api' | 'distributor'
    -- manual: RH publica à mão na plataforma externa e cola o link aqui (é o caminho realista no arranque,
    --   já que LinkedIn não está a aceitar novas parcerias de Job Posting API neste momento, e a Indeed
    --   está a migrar de feeds XML para API directa com contrato assinado — nenhuma das duas é "plug and play").
    -- distributor: publicação via agregador terceiro já parceiro da LinkedIn/Indeed, sem contrato directo nosso.
    partnership_status    text default 'not_applicable', -- 'not_applicable' | 'pending' | 'approved' | 'rejected'
    external_posting_id text,
    posting_url          text,
    status                text default 'active',
    posted_at             timestamptz default now()
);

-- ============================================================================
-- 11. TENDÊNCIAS DE MERCADO E PREVISÃO
-- ============================================================================
-- IMPORTANTE (leitura antes de implementar): esta funcionalidade só gera
-- valor real quando há volume suficiente de vagas/candidaturas a fluir pela
-- plataforma. Com poucas empresas no arranque, qualquer "tendência" calculada
-- só com dados internos vai ser estatisticamente pouco fiável (amostra
-- pequena, viés das poucas empresas que já usam o NordikHire).
--
-- Por isso o desenho está pensado em duas fontes de dados, activáveis
-- independentemente:
--   (a) DADOS INTERNOS AGREGADOS — cross-tenant, só de empresas que
--       activaram allow_market_data_sharing (opt-in, ver companies).
--       Fica fiável a partir de uma massa crítica de vagas/mês.
--   (b) DADOS EXTERNOS — importados de fontes públicas/mercado (INE Angola,
--       portais de emprego públicos, LinkedIn Economic Graph se houver
--       acesso, etc.) para dar sinal desde o dia 1, antes de teres volume
--       próprio. Isto é trabalho de parcerias/scraping, não só de schema.
--
-- Sugestão de faseamento:
--   Fase 1 (lançamento): captar os dados estruturados (skills_required,
--     seniority, location, salary_range já estão em `jobs`) mas mostrar só
--     analytics simples e internos à própria empresa ("as tuas vagas mais
--     concorridas", "skills mais comuns nas tuas candidaturas").
--   Fase 2 (após massa crítica ou fonte externa): activar os agregados de
--     mercado abaixo e a previsão de tendência.

create table market_skill_snapshots (
    id                  uuid primary key default gen_random_uuid(),
    period_month         date not null,                -- primeiro dia do mês de referência
    skill                 text not null,
    location              text,                          -- null = nacional
    industry               text,                          -- null = todas
    demand_count           integer not null,               -- nº de vagas que pediram esta skill no período
    source                 text not null default 'internal', -- 'internal' | 'external:<nome_fonte>'
    calculated_at           timestamptz default now()
);
create index idx_market_skill_period on market_skill_snapshots(period_month, skill);

create table market_job_title_snapshots (
    id                  uuid primary key default gen_random_uuid(),
    period_month         date not null,
    job_title_normalized  text not null,                 -- título normalizado (ex: via IA, agrupando variações)
    location              text,
    industry               text,
    postings_count          integer not null,
    avg_salary_min          numeric(12,2),
    avg_salary_max          numeric(12,2),
    source                 text not null default 'internal',
    calculated_at           timestamptz default now()
);
create index idx_market_title_period on market_job_title_snapshots(period_month, job_title_normalized);

-- Previsão de tendência (output de um modelo, não cálculo em tempo real)
create table market_trend_forecasts (
    id                  uuid primary key default gen_random_uuid(),
    entity_type           text not null,                 -- 'skill' | 'job_title'
    entity_value           text not null,                 -- ex: 'Python' ou 'Data Analyst'
    location               text,
    forecast_period_month  date not null,                 -- mês para o qual se está a prever
    predicted_direction     text not null,                 -- 'crescente' | 'estável' | 'decrescente'
    predicted_change_pct    numeric(6,2),                   -- variação % prevista vs período anterior
    confidence_level         text,                           -- 'baixa' | 'média' | 'alta'
    -- confidence_level deve reflectir honestamente o tamanho da amostra —
    -- não mostrar "alta confiança" com poucos dados, é o erro mais comum
    -- neste tipo de funcionalidade e destrói a credibilidade da plataforma.
    model_version           text,
    generated_at             timestamptz default now()
);
create index idx_forecasts_entity on market_trend_forecasts(entity_type, entity_value, forecast_period_month);

-- Fontes de dados externas (quando activares a Fase 2b)
create table external_market_sources (
    id                  uuid primary key default gen_random_uuid(),
    name                  text not null,                  -- 'INE Angola', 'Portal do Emprego', ...
    source_type            text,                            -- 'api' | 'scraping' | 'manual_upload' | 'partnership'
    is_active               boolean default true,
    last_synced_at           timestamptz,
    config                  jsonb default '{}'::jsonb
);

-- ============================================================================
-- 13. PESQUISA (VAGAS E CANDIDATOS) + IMPORTAÇÃO DE PERFIL LINKEDIN
-- ============================================================================
-- Duas funcionalidades distintas, propositadamente separadas:
--
-- (a) Pesquisa DENTRO da nossa própria base de dados — isto é 100% nosso,
--     sem dependência de terceiros, e cobre os dois casos de uso reais:
--       - candidato pesquisa vagas públicas (site público do NordikHire)
--       - RH pesquisa candidatos dentro do seu próprio pool de candidaturas
--
-- (b) Candidato importa o SEU PRÓPRIO perfil do LinkedIn para pré-preencher
--     a candidatura — via "Sign in with LinkedIn" (OpenID Connect), que é
--     oficial e gratuito. Isto é DIFERENTE de pesquisar perfis de outras
--     pessoas no LinkedIn, que não é suportado oficialmente pela LinkedIn
--     para terceiros e não deve ser construído via scraping.

-- (a) Índices de pesquisa full-text sobre dados já existentes no schema.
--     Postgres/Supabase: usar tsvector + GIN, ou pg_trgm para fuzzy match.
create extension if not exists pg_trgm;

alter table jobs add column search_vector tsvector
    generated always as (to_tsvector('portuguese', coalesce(location,'') || ' ' || coalesce(seniority_level,''))) stored;
create index idx_jobs_search on jobs using gin (search_vector);

-- Pesquisa de candidatos: sobre o texto extraído do CV + skills, sempre
-- filtrada por company_id (RH só pesquisa dentro do seu próprio pool —
-- reforça o isolamento multi-tenant já garantido por RLS).
alter table cv_extractions add column search_vector tsvector
    generated always as (to_tsvector('portuguese', coalesce(raw_text,''))) stored;
create index idx_cv_extractions_search on cv_extractions using gin (search_vector);

-- Skills indexado separadamente para filtros exactos (ex: "só quem tem SQL e Python")
create index idx_jobs_skills_gin on jobs using gin (skills_required jsonb_path_ops);
create index idx_cv_parsed_skills_gin on cv_extractions using gin (parsed_data jsonb_path_ops);

-- (b) Importação de perfil via "Sign in with LinkedIn" (OAuth/OpenID Connect
--     oficial). O candidato autoriza explicitamente; recebemos só o que a
--     LinkedIn expõe via OpenID (nome, foto, email) — não é sourcing, é o
--     próprio candidato a facilitar o preenchimento da candidatura dele.
create table candidate_oauth_imports (
    id                  uuid primary key default gen_random_uuid(),
    candidate_id         uuid not null references candidates(id) on delete cascade,
    provider              text not null,                 -- 'linkedin' | 'google' | ...
    provider_user_id      text not null,
    imported_fields        jsonb default '{}'::jsonb,     -- só os campos que o provider realmente devolve
    imported_at            timestamptz default now(),
    consent_given           boolean not null default true -- exigido no ecrã de OAuth antes de gravar
);
create unique index idx_oauth_provider_user on candidate_oauth_imports(provider, provider_user_id);

-- Relatório de desenvolvimento — gerado após testes/entrevista, cruza os
-- resultados técnicos e comportamentais para dar feedback accionável.
-- Serve dois públicos: o RH (contexto de decisão + plano de onboarding se
-- contratado) e, opcionalmente, o próprio candidato (feedback construtivo).
create table candidate_development_reports (
    id                  uuid primary key default gen_random_uuid(),
    application_id       uuid not null references applications(id) on delete cascade,
    strengths             jsonb default '[]'::jsonb,
    -- ["Forte comunicação escrita", "Experiência sólida em SQL"]
    technical_gaps        jsonb default '[]'::jsonb,
    -- ["Conhecimento limitado de APIs REST"]
    behavioral_gaps       jsonb default '[]'::jsonb,
    -- ["Dificuldade em cenários de gestão de conflito no teste psicométrico"]
    training_recommendations jsonb default '[]'::jsonb,
    -- [{"gap": "APIs REST", "suggested_topic": "Fundamentos de APIs REST",
    --   "resource_type": "curso_online", "resource_url": null}]
    overall_summary        text,                        -- resumo em linguagem natural, 2-3 frases
    visible_to_candidate    boolean not null default false,
    -- a empresa decide se este relatório (ou uma versão resumida dele) é
    -- partilhado com o candidato via candidate_feedback
    ai_model               text,
    generated_at            timestamptz default now()
);
create unique index idx_dev_report_application on candidate_development_reports(application_id);

-- ============================================================================
-- 15. AUTENTICAÇÃO, SESSÕES E SEGURANÇA DE ACESSO
-- ============================================================================
-- auth.users (Supabase) trata do login em si (password, magic link, OAuth).
-- Estas tabelas cobrem o que fica por cima: MFA, controlo de sessões,
-- chaves de API para integrações de terceiros, e registo de tentativas de
-- acesso indevido — para poderes bloquear terceiros que tentem aceder a
-- dados confidenciais sem autorização.

create table mfa_factors (
    id                  uuid primary key default gen_random_uuid(),
    user_id              uuid not null references users(id) on delete cascade,
    factor_type          text not null,                -- 'totp' | 'sms' | 'email'
    is_verified           boolean default false,
    is_primary             boolean default false,
    secret_encrypted       text,                          -- nunca em texto simples
    created_at             timestamptz default now(),
    last_used_at            timestamptz
);
create index idx_mfa_user on mfa_factors(user_id);

create table auth_sessions (
    id                  uuid primary key default gen_random_uuid(),
    user_id              uuid not null references users(id) on delete cascade,
    ip_address             inet,
    user_agent              text,
    country_code            text,                          -- geolocalizado a partir do IP, para detectar
                                                             -- login de país incomum (sinal de risco)
    mfa_verified             boolean default false,
    created_at               timestamptz default now(),
    last_active_at            timestamptz default now(),
    expires_at                timestamptz not null,
    revoked_at                 timestamptz
);
create index idx_sessions_user on auth_sessions(user_id, expires_at);

-- Chaves de API para integrações de terceiros (ex: um cliente que quer
-- consultar as suas próprias vagas via API). Com escopo explícito e
-- expiração — nunca acesso total por omissão.
create table api_keys (
    id                  uuid primary key default gen_random_uuid(),
    company_id            uuid not null references companies(id) on delete cascade,
    created_by             uuid references users(id),
    name                    text not null,                 -- rótulo dado pelo utilizador
    key_hash                text not null,                  -- hash da chave, nunca a chave em si gravada
    scopes                   text[] not null default array['read:jobs'],
    -- ex: ['read:jobs','read:applications','write:jobs'] — princípio do menor privilégio
    allowed_ip_ranges         inet[],                          -- opcional: restringir a origens conhecidas
    last_used_at              timestamptz,
    expires_at                 timestamptz,
    revoked_at                  timestamptz,
    created_at                   timestamptz default now()
);
create index idx_api_keys_company on api_keys(company_id);

-- Registo de eventos de segurança — tentativas de login falhadas, chaves de
-- API inválidas, pedidos bloqueados por fora do IP permitido, etc. É esta
-- tabela que alimenta o bloqueio automático de terceiros mal-intencionados.
create table security_events (
    id                  uuid primary key default gen_random_uuid(),
    company_id            uuid references companies(id) on delete cascade,
    user_id                uuid references users(id),
    event_type              text not null,
    -- 'failed_login' | 'invalid_api_key' | 'blocked_ip' | 'mfa_failed' |
    -- 'unusual_location' | 'rate_limit_exceeded' | 'permission_denied'
    ip_address               inet,
    severity                  text default 'low',            -- 'low' | 'medium' | 'high' | 'critical'
    metadata                   jsonb default '{}'::jsonb,
    created_at                  timestamptz default now()
);
create index idx_security_events_company on security_events(company_id, created_at desc);
create index idx_security_events_ip on security_events(ip_address, created_at desc);

-- Bloqueio automático: IPs ou identidades suspensas após N eventos de risco
-- num intervalo curto (a lógica de "N eventos em M minutos" corre na
-- aplicação/edge function, esta tabela só guarda o estado resultante).
create table blocked_identities (
    id                  uuid primary key default gen_random_uuid(),
    identity_type          text not null,                  -- 'ip' | 'email' | 'api_key'
    identity_value           text not null,
    reason                    text,
    blocked_until              timestamptz,                    -- null = permanente até revisão manual
    created_at                 timestamptz default now()
);
create unique index idx_blocked_identity on blocked_identities(identity_type, identity_value);

-- Rate limiting de formulários públicos e acções que chamam a Anthropic API
-- (login, candidatura, entrevista simulada, testes, etc.) — cada tentativa
-- fica registada aqui; a contagem de tentativas numa janela de tempo corre
-- na aplicação (lib/rate-limit.ts), esta tabela só guarda os eventos brutos.
-- Sem company_id/candidate_id: "key" é o identificador do bucket (IP, email,
-- company_id ou candidate_id conforme o caso), não uma referência a tenant.
create table rate_limit_hits (
    id                  uuid primary key default gen_random_uuid(),
    bucket                text not null,                  -- ex: 'login_ip', 'interview_message'
    key                    text not null,                  -- identificador dentro do bucket (IP, email, id, etc.)
    created_at              timestamptz default now()
);
create index rate_limit_hits_lookup_idx on rate_limit_hits(bucket, key, created_at);

-- ============================================================================
-- 16. ONBOARDING — progresso guiado para empresas e candidatos
-- ============================================================================

create table company_onboarding_progress (
    id                  uuid primary key default gen_random_uuid(),
    company_id            uuid not null references companies(id) on delete cascade,
    step                    text not null,
    -- 'account_created' | 'company_profile' | 'invited_team' | 'first_job_created' |
    -- 'integrations_reviewed' | 'completed'
    completed_at             timestamptz,
    created_at                timestamptz default now()
);
create unique index idx_onboarding_company_step on company_onboarding_progress(company_id, step);

-- ============================================================================
-- 18. FERRAMENTAS DE CARREIRA (candidato) — optimização de perfil e CV
-- ============================================================================
-- Diferente de candidate_development_reports (secção 8), que nasce de uma
-- candidatura concreta a uma vaga. Isto é uma ferramenta de valor para o
-- candidato, disponível independentemente de estar a candidatar-se a algo
-- — exige conta própria (candidates.auth_user_id preenchido).
--
-- REGRA DE GOVERNANÇA — NÃO VIOLAR: candidate_profile_optimizations NUNCA
-- tem FK para applications nem para scoring_results, e o resultado desta
-- ferramenta NUNCA entra no cálculo de scoring_results.overall_score de
-- nenhuma candidatura. É uma ferramenta de carreira genérica do candidato,
-- desligada de qualquer vaga. Um candidato pago melhora o perfil dele no
-- LinkedIn/CV — nunca o score que a IA calcula ao candidatar-se através do
-- NordikHire. Isto protege a neutralidade da plataforma perante as
-- empresas-cliente (que são o cliente pagante principal) e deve estar
-- reflectido nos Termos de Serviço e na Política de Protecção de Dados.
--
-- Importante: o candidato cola/carrega o SEU PRÓPRIO conteúdo (texto do
-- perfil LinkedIn, CV, etc.) — não fazemos scraping de perfis de terceiros
-- nem do próprio LinkedIn de terceiros. O input é sempre fornecido
-- directamente pelo dono do perfil.

create table candidate_plans (
    id                  uuid primary key default gen_random_uuid(),
    name                  text not null,                 -- 'Gratuito', 'Carreira Pro'
    price_monthly_kz       numeric(12,2),
    price_monthly_usd       numeric(12,2),
    max_optimizations_per_month integer,                  -- null = ilimitado
    includes_full_rewrite    boolean default false,        -- reescrita completa de secções
    includes_benchmark        boolean default false,        -- comparação com perfis da mesma área
    created_at                 timestamptz default now()
);

create table candidate_subscriptions (
    id                  uuid primary key default gen_random_uuid(),
    candidate_id           uuid not null references candidates(id) on delete cascade,
    plan_id                 uuid not null references candidate_plans(id),
    status                    text not null default 'active', -- active | canceled | past_due
    billing_provider          text,                              -- 'stripe' | 'multicaixa' | ...
    current_period_end          timestamptz,
    created_at                    timestamptz default now()
);
create index idx_candidate_subscriptions_candidate on candidate_subscriptions(candidate_id);

create table candidate_profile_optimizations (
    id                  uuid primary key default gen_random_uuid(),
    candidate_id          uuid not null references candidates(id) on delete cascade,
    source_type            text not null,               -- 'linkedin' | 'cv' | 'other_platform'
    source_label            text,                          -- ex: 'LinkedIn', 'Indeed', 'Portal de Emprego X'
    input_text               text,                          -- conteúdo colado pelo candidato (headline, resumo, etc.)
    input_reference_url       text,                          -- opcional, só como referência visual — nunca usado para scraping
    section_feedback           jsonb default '[]'::jsonb,
    -- [{"section": "headline", "current": "...", "feedback": "Pouco específico",
    --   "suggested_rewrite": "..."}]
    strengths                  jsonb default '[]'::jsonb,
    weaknesses                  jsonb default '[]'::jsonb,
    overall_score                numeric(5,2),               -- 0-100, força geral do perfil/CV
    overall_summary               text,
    tier_used                      text default 'free',        -- 'free' | 'pro' — regista com que nível foi gerado
    ai_model                     text,
    generated_at                   timestamptz default now()
);
create index idx_profile_opt_candidate on candidate_profile_optimizations(candidate_id, generated_at desc);

-- Entrevista de prática (ferramenta de carreira) — o candidato treina para
-- uma entrevista descrevendo o cargo-alvo por sua conta, sem que isso seja
-- uma candidatura real a nenhuma vaga da plataforma.
--
-- REGRA DE GOVERNANÇA — NÃO VIOLAR (mesmo princípio de
-- candidate_profile_optimizations, secção 10 da especificação):
-- candidate_interview_practice NUNCA tem FK para applications, jobs nem
-- ai_interviews, e o resultado nunca é visto pela empresa nem entra em
-- scoring_results.overall_score de nenhuma candidatura. É uma ferramenta de
-- prática do candidato, para o próprio candidato, ponto final.
create table candidate_interview_practice (
    id                  uuid primary key default gen_random_uuid(),
    candidate_id          uuid not null references candidates(id) on delete cascade,
    target_role            text not null,               -- cargo/perfil que o candidato quer treinar
    notes                   text,                          -- foco/contexto adicional dado pelo candidato
    status                  text not null default 'in_progress', -- in_progress | completed
    transcript              jsonb default '[]'::jsonb,
    ai_evaluation            jsonb default '{}'::jsonb,
    ai_summary               text,
    started_at               timestamptz default now(),
    completed_at              timestamptz,
    created_at                timestamptz default now()
);
create index idx_interview_practice_candidate on candidate_interview_practice(candidate_id, created_at desc);

-- ============================================================================
-- 19. ROW LEVEL SECURITY (RLS) — isolamento entre empresas (tenants)
-- ============================================================================
-- Princípio: cada tabela com company_id só pode ser lida/escrita por
-- utilizadores autenticados cujo próprio registo em `users` pertença à
-- mesma company_id. Activada em TODAS as tabelas do schema — mesmo as sem
-- company_id directo (isoladas via join, ou por dono do registo).
--
-- Função auxiliar SECURITY DEFINER: evita recursão infinita quando a
-- política de `users` precisa de consultar a própria tabela `users` para
-- descobrir a company_id do utilizador autenticado. Corre com os privilégios
-- do dono da função (ignora RLS internamente), que é o padrão recomendado
-- pela Supabase para este caso.
create or replace function current_company_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
    select company_id from users where id = auth.uid()
$$;

-- Mesmo padrão, para o lado do candidato: usada por políticas de outras
-- tabelas que precisam do candidate_id do utilizador autenticado sem
-- reactivar a RLS de `candidates` (evita recursão — ver nota mais abaixo
-- em candidate_views_own_applications).
create or replace function current_candidate_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
    select id from candidates where auth_user_id = auth.uid()
$$;

alter table companies enable row level security;
alter table jobs enable row level security;
alter table applications enable row level security;
alter table users enable row level security;
alter table company_invites enable row level security;
alter table subscriptions enable row level security;
alter table company_integrations enable row level security;
alter table notifications_log enable row level security;
alter table audit_log enable row level security;
alter table api_keys enable row level security;
alter table security_events enable row level security;
alter table mfa_factors enable row level security;
alter table candidate_profile_optimizations enable row level security;

create policy candidate_owns_optimizations on candidate_profile_optimizations
    using (candidate_id in (
        select id from candidates where auth_user_id = auth.uid()
    ));

create policy tenant_isolation_jobs on jobs
    using (company_id = current_company_id());

create policy tenant_isolation_applications on applications
    using (company_id = current_company_id());

create policy tenant_isolation_users on users
    using (company_id = current_company_id());

create policy tenant_isolation_company_invites on company_invites
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

-- mfa_factors não tem company_id — isola-se pelo dono directo do registo.
create policy user_owns_mfa_factors on mfa_factors
    using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 19.1 Tabelas que tinham RLS desactivada (acesso total via chave anon/
-- authenticated até agora — corrigido aqui).
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
alter table candidate_interview_practice enable row level security;
alter table rate_limit_hits enable row level security;

-- Catálogos públicos: qualquer utilizador autenticado pode ler, só o
-- service_role escreve (gestão de planos/providers é administrativa).
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
-- que se candidataram a vagas da sua empresa. Políticas permissivas — juntam-
-- se com OR.
create policy candidate_owns_profile on candidates
    using (auth_user_id = auth.uid());

create policy candidates_visible_to_recruiters on candidates
    using (id in (
        select candidate_id from applications where company_id = current_company_id()
    ));

-- Candidato registado vê as suas próprias candidaturas (portal do candidato,
-- roadmap futuro). Candidato-convidado não tem sessão, logo não beneficia
-- desta política — nem precisa, aplica-se via service_role.
--
-- Usa current_candidate_id() (não uma subquery directa a `candidates`):
-- candidates_visible_to_recruiters (acima) já consulta `applications`, por
-- isso uma subquery directa aqui criaria um ciclo candidates → applications
-- → candidates que o Postgres rejeita (recursão infinita nas políticas).
create policy candidate_views_own_applications on applications
    using (candidate_id = current_candidate_id());

create policy candidate_owns_oauth_imports on candidate_oauth_imports
    using (candidate_id = current_candidate_id());

create policy candidate_owns_subscription on candidate_subscriptions
    using (candidate_id = current_candidate_id());

create policy candidate_owns_interview_practice on candidate_interview_practice
    using (candidate_id = current_candidate_id());

-- Testes técnicos/comportamentais/psicométricos (secção 6): ao contrário de
-- candidate_interview_practice, test_assignments ESTÁ ligado a uma
-- candidatura real (application_id) — o candidato precisa de ver e responder
-- aos testes que lhe foram atribuídos num processo real.
create policy candidate_views_own_test_assignments on test_assignments
    using (application_id in (
        select id from applications where candidate_id = current_candidate_id()
    ));

create policy user_owns_auth_sessions on auth_sessions
    using (user_id = auth.uid());

-- market_skill_snapshots, market_job_title_snapshots, market_trend_forecasts,
-- external_market_sources: RLS activada, propositadamente SEM política —
-- nega tudo a anon/authenticated. Corresponde à nota da secção 11: esta
-- funcionalidade fica desactivada na interface até haver massa crítica de
-- dados; só o service_role (backend) lhe deve tocar por agora.
--
-- blocked_identities, rate_limit_hits: idem — tabelas de segurança interna,
-- nunca expostas a utilizadores finais, só ao service_role.
-- ============================================================================
-- NOTAS DE IMPLEMENTAÇÃO
-- ============================================================================
-- 1. candidates é uma tabela GLOBAL (sem company_id) porque o mesmo candidato
--    pode candidatar-se a vagas de empresas diferentes. O isolamento de
--    privacidade entre empresas acontece ao nível de `applications`, não do
--    perfil do candidato em si — cada empresa só vê os dados de candidatura
--    ligados às SUAS vagas via join com applications.company_id.
--
-- 2. api_key_encrypted em company_integrations: nunca guardar em texto
--    simples. Usar pgsodium/Vault do Supabase ou cifrar na aplicação antes
--    de gravar.
--
-- 3. Falta ainda (próxima fase): tabelas de billing/invoices detalhadas se
--    não usares Stripe directamente (Stripe trata isso do lado dele);
--    tabela de webhooks recebidos; tabela de templates de mensagens
--    (WhatsApp/email) reutilizáveis por empresa.
--
-- 4. Protecção de dados: o campo consent_data_processing em `candidates` é
--    o mínimo para conformidade com a Lei de Protecção de Dados Pessoais de
--    Angola. Se comercializares fora de Angola, validar exigências GDPR
--    (direito ao esquecimento = precisa de rotina de anonimização/delete).
--
-- 5. Tendências de mercado (secção 11): não activar a UI de "previsão" para
--    clientes antes de teres volume de dados que sustente confiança média/alta
--    nas previsões. Lançar prematuramente com dados fracos é pior para a
--    marca do que não ter a funcionalidade — recomendo gate por nº mínimo de
--    vagas/mês antes de expor market_trend_forecasts na interface.
--
-- 6. ROADMAP FUTURO (não é necessidade do dia 1): considerar expor o próprio
--    NordikHire como servidor MCP (Model Context Protocol), para que
--    ferramentas de IA de terceiros (ex: Claude Code/Cowork de um cliente)
--    possam consultar vagas, candidatos e métricas directamente. As
--    integrações operacionais actuais (WhatsApp, SHL, HackerRank, etc.)
--    ficam como estão — adapter pattern simples via `company_integrations` —
--    porque não há um agente autónomo a decidir dinamicamente que ferramenta
--    invocar; é uma pipeline determinística, e MCP seria complexidade a mais
--    nesta fase.
-- ============================================================================
