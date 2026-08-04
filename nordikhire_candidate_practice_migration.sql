-- ============================================================================
-- NORDIKHIRE — MIGRAÇÃO: ferramenta de prática de entrevista (candidato)
-- ============================================================================
-- Corre isto no SQL Editor do Supabase.
--
-- REGRA DE GOVERNANÇA — NÃO VIOLAR (mesmo princípio de
-- candidate_profile_optimizations): candidate_interview_practice NUNCA tem
-- FK para applications, jobs nem ai_interviews, e o resultado nunca é visto
-- pela empresa nem entra em scoring_results.overall_score de nenhuma
-- candidatura. É uma ferramenta de prática do candidato, para o próprio
-- candidato, ponto final.
-- ============================================================================

create table candidate_interview_practice (
    id                  uuid primary key default gen_random_uuid(),
    candidate_id          uuid not null references candidates(id) on delete cascade,
    target_role            text not null,
    notes                   text,
    status                  text not null default 'in_progress',
    transcript              jsonb default '[]'::jsonb,
    ai_evaluation            jsonb default '{}'::jsonb,
    ai_summary               text,
    started_at               timestamptz default now(),
    completed_at              timestamptz,
    created_at                timestamptz default now()
);
create index idx_interview_practice_candidate on candidate_interview_practice(candidate_id, created_at desc);

alter table candidate_interview_practice enable row level security;

create policy candidate_owns_interview_practice on candidate_interview_practice
    using (candidate_id = current_candidate_id());
