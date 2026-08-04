-- ============================================================================
-- NORDIKHIRE — MIGRAÇÃO: candidato vê/responde aos seus testes atribuídos
-- ============================================================================
-- Corre isto no SQL Editor do Supabase.
--
-- test_assignments já tinha RLS activada com apenas a política
-- tenant_isolation_test_assignments (lado da empresa). Falta a política do
-- lado do candidato: ao contrário de candidate_interview_practice, os testes
-- técnicos/comportamentais/psicométricos ESTÃO ligados a uma candidatura real
-- (application_id) — o candidato precisa de ver e responder aos testes que
-- lhe foram atribuídos num processo de recrutamento real.
-- ============================================================================

create policy candidate_views_own_test_assignments on test_assignments
    using (application_id in (
        select id from applications where candidate_id = current_candidate_id()
    ));
