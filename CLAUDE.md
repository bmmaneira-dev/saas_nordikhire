# NordikHire — Contexto do Projeto

> Este ficheiro existe para dar ao Claude Code contexto imediato ao abrir este repositório numa máquina nova, substituindo o histórico de conversa perdido na migração de máquina (ago/2026).

## Visão geral

Plataforma SaaS de recrutamento com IA (Angola, com desenho para expansão internacional). Automatiza o processo de seleção — da criação da vaga à decisão final — e oferece separadamente ferramentas de carreira ao candidato (otimização de perfil/CV).

Dois lados do negócio:
- **B2B**: empresas/recrutadores, subscrição cobrada por nº de candidaturas ativas.
- **B2C (opcional)**: candidatos pagam por ferramentas de carreira avançadas — **completamente desligado** da avaliação de candidaturas (ver regra de governança abaixo).

Nome "NordikHire" é placeholder — nome definitivo ainda por confirmar (verificação de domínio em curso).

## Stack técnico (confirmado em `web/package.json`)

- **Frontend/Backend:** Next.js 16 + React 19 + Tailwind CSS 4 (App Router)
- **Base de dados/Auth:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **IA:** Anthropic SDK (`@anthropic-ai/sdk`) — nota: a especificação original menciona OpenAI, mas o código usa Claude/Anthropic.
- **Extras:** `pdf-parse` (parsing de CVs), `qrcode` (QR code para publicação de vagas)
- **TypeScript** em todo o projeto

Correr localmente: `run-web-dev.cmd` (Windows) ou `cd web && npm run dev`.

## Estado da implementação (2026-08-14)

Todas as rotas/páginas principais estão implementadas e ligadas a dados reais do Supabase (não é só esqueleto): login, signup (incl. convite de equipa), forgot/reset password, dashboard completo (jobs, candidates, pipeline, interviews, tests, **talent-pool**, messages, team, billing, company, settings, **reports** — estas duas últimas eram placeholders "coming soon" até 2026-08-14, agora funcionais), área do candidato (login/signup/app própria, incl. simulador de entrevistas de prática com **voz de IA via ElevenLabs** — precisa de `ELEVENLABS_API_KEY` no plano Starter+, tem fallback automático para a voz do browser se não configurado/falhar), página pública **"Sobre nós"**, páginas legais (terms/privacy — conteúdo ainda por rever, ver secção de prontidão abaixo), e fluxo de entrevista (`/interview/[id]`).

`web/CLAUDE.md` local já existe e importa `web/AGENTS.md` (regras específicas sobre a versão do Next.js usada — ler antes de mexer em código do Next).

## Ficheiros de referência no repo (ler antes de implementar)

- `nordikhire_especificacao_projeto.md` — especificação completa (visão, utilizadores, fluxos, decisões de arquitetura, monetização, ecrãs)
- `nordikhire_schema.sql` — schema completo Postgres/Supabase
- `nordikhire_politica_protecao_dados.md` — política de proteção de dados (RGPD, lei angolana, LGPD, CCPA)
- `nordikhire_rls_migration.sql`, `nordikhire_rls_fix_recursion.sql`, `nordikhire_rls_scope_to_select_migration.sql` — Row Level Security (a última corrige as políticas de `for all` implícito para `for select` explícito — ver auditoria de segurança abaixo)
- `nordikhire_candidate_practice_migration.sql`, `nordikhire_application_video_migration.sql`, `nordikhire_team_invites_migration.sql`, `nordikhire_test_assignments_candidate_policy.sql` — migrações incrementais

`nordikhire_schema.sql` é reconciliado periodicamente com a BD Supabase ao vivo (última verificação completa: 2026-08-14, sem divergências — todas as 39 tabelas, 36 políticas RLS, índices e as 3 funções `security definer` conferem).

## Decisões de arquitetura chave (não violar sem discutir)

1. **Multi-tenant** via schema partilhado + `company_id` + Row Level Security (não schema-por-cliente).
2. **Multi-idioma**: conteúdo de vaga traduzível vive em `job_translations`; dados estruturais (skills, senioridade, salário) não são traduzidos.
3. **Subscrição B2B por candidaturas ativas**, não por vagas nem por mês fixo (`subscription_usage`, suporta excedente).
4. **Candidatos são globais** (sem `company_id`) — isolamento entre empresas é ao nível de `applications`.
5. **Publicação em LinkedIn/Indeed é manual nesta fase** — sem parcerias de API ativas. Nenhuma serve para importar dados de candidatos/mercado.
6. **Proibido scraping de perfis de terceiros.** Única integração legítima: "Entrar com LinkedIn" (OpenID Connect) para o próprio candidato.
7. **Pesquisa é sempre interna** (full-text search Postgres), candidatos sempre filtrados por `company_id`.
8. **Tendências de mercado**: construído mas com gate — não expor na UI sem volume de dados suficiente.
9. **Segurança**: MFA obrigatória em contexto de risco (**ainda só schema — `mfa_factors` existe na BD mas não há nenhum fluxo de enrollment/verificação no código**, não anunciar como funcionalidade activa); `api_keys.scopes` limitado; `security_events` + `blocked_identities` para deteção de abuso.
10. **Regra inegociável**: `candidate_profile_optimizations` (ferramentas de carreira pagas) nunca tem FK para `applications` nem `scoring_results`, e nunca influencia o score de nenhuma candidatura. Protege a neutralidade percebida pelas empresas-cliente.
11. **MCP não é prioridade do dia 1.** Integrações (WhatsApp, providers de teste) usam adapter pattern via `company_integrations`. Roadmap futuro: expor o próprio NordikHire como servidor MCP.

## Segurança — auditoria pré-lançamento (2026-08-13)

Foi feito um audit de segurança completo (2 críticos + vários high/medium/low) e todas as correções de código/BD já estão commitadas (`82136d6`, `ea62854`, `1ad0834` — políticas RLS restritas a `for select`, fim do auto-link de contas de candidato por email não verificado, rate limiting atómico, IDOR no upload de vídeo, `changePlan` validado, convites a expirar, `roles.permissions` finalmente lido, hardening de prompt injection).

**Único pendente por resolver — não é código, é limite do plano Supabase:**
"Leaked Password Protection" (verificação de passwords comprometidas via HaveIBeenPwned) só está disponível a partir do **plano Pro** do Supabase. O projeto está num tier que não suporta esta opção — confirmado directamente pela UI do Supabase ("available on Pro Plans and up"). **Acção futura**: ao fazer upgrade do plano Supabase, activar em Authentication → Attack Protection → "Leaked password protection".

## Prontidão para lançamento de testes (revisão 2026-08-14)

Feita uma revisão dedicada a "o que falta para abrir a plataforma a testadores de confiança" (barra mais baixa que lançamento público a pagar). Corrigido nessa revisão: página Sobre nós já não se assume "em construção", passos de onboarding traduzidos nos 4 idiomas (estavam hardcoded em PT) + link errado do passo "explora as ferramentas automáticas" corrigido, `web/.env.example` criado, frase confusa sobre a Anthropic na política de privacidade reescrita.

**Dois bloqueantes reais que continuam por resolver, ambos precisam de informação/decisão do Bruno, não são código:**
1. **Páginas legais (`web/src/app/legal/terms`, `.../privacy`) têm um aviso amarelo visível a dizer que são rascunho não revisto por advogado**, com campos por preencher: nome legal da empresa, morada, NIF, email de contacto, jurisdição. Falta o Bruno fornecer estes dados reais.
2. **Zero monitorização/rastreio de erros em produção** (nada tipo Sentry — só `console.error` que desaparece no stdout do servidor). Se um testador reportar um bug, não há forma de investigar a causa sem isto. Precisa de o Bruno criar conta num serviço (Sentry tem plano grátis) e dar a chave.

## Ambiente de desenvolvimento e testes

- `npm install` dentro de `web/` já foi feito nesta máquina; `web/.env.local` já está recriado (ver variáveis abaixo).
- Correr localmente: `cd web && npm run dev` — nota recorrente: o processo do `next dev` por vezes fica com estado do Turbopack desactualizado após muitas edições seguidas (já aconteceu 2-3 vezes nesta sessão, sintomas: erro `TypeError` a apontar para código já corrigido, ou erro `PGRST303`/JWT ao chamar a Supabase) — reiniciar o processo resolve sempre.
- Existem duas contas de teste persistentes ligadas à empresa demo "NordikHire Demo Lda" (`e5f11645-9c0e-4e79-8553-b0d3c87b0f40`), ambas com password `Teste@2026!`:
  - `teste@nordikhire-local-test.dev` — conta de empresa, role Admin.
  - `candidato-teste@nordikhire-local-test.dev` — conta de candidato, ligada ao candidato "Rui Alexandre Pereira" (já tem candidatura em fase de teste + entrevista em curso, para haver dados reais para ver).

## Variáveis de ambiente necessárias

Não estão no repo (`.gitignore` exclui `.env*`, com excepção deliberada de `web/.env.example`, que documenta todas). `web/.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — credenciais Supabase (a service role key é já no formato novo `sb_secret_...`, não um JWT).
- `ANTHROPIC_API_KEY`.
- `SITE_URL` — domínio real usado para construir o link de reset de password (`http://localhost:3000` em dev). Adicionado no audit de segurança de 2026-08-13 para deixar de confiar no `origin` enviado pelo cliente; **definir com o domínio de produção real ao fazer deploy**, senão o link de reset fica sempre a apontar para localhost.
- `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` — opcionais, para a voz de IA no simulador de entrevistas de prática. Sem isto (ou se a conta ElevenLabs não tiver plano Starter+), cai automaticamente na voz do browser, sem quebrar nada.

Ver `web/.env.example` para o ficheiro completo pronto a copiar.
