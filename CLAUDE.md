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

## Estado da implementação (confirmado por inspeção de `web/src/app`)

Já existem rotas/páginas implementadas para: login, signup (incl. convite de equipa), forgot/reset password, dashboard (jobs, candidates, pipeline, interviews, tests, talent-pool, messages, team, billing, company, settings, reports), área do candidato (login/signup/app própria), páginas legais (terms/privacy), e fluxo de entrevista (`/interview/[id]`). Ou seja, o esqueleto de praticamente todos os ecrãs da especificação já está a ser construído — não é só schema/spec, há bastante código de UI e rotas já em curso.

`web/CLAUDE.md` local já existe e importa `web/AGENTS.md` (regras específicas sobre a versão do Next.js usada — ler antes de mexer em código do Next).

## Ficheiros de referência no repo (ler antes de implementar)

- `nordikhire_especificacao_projeto.md` — especificação completa (visão, utilizadores, fluxos, decisões de arquitetura, monetização, ecrãs)
- `nordikhire_schema.sql` — schema completo Postgres/Supabase
- `nordikhire_politica_protecao_dados.md` — política de proteção de dados (RGPD, lei angolana, LGPD, CCPA)
- `nordikhire_rls_migration.sql`, `nordikhire_rls_fix_recursion.sql` — Row Level Security
- `nordikhire_candidate_practice_migration.sql`, `nordikhire_application_video_migration.sql`, `nordikhire_team_invites_migration.sql`, `nordikhire_test_assignments_candidate_policy.sql` — migrações incrementais

## Decisões de arquitetura chave (não violar sem discutir)

1. **Multi-tenant** via schema partilhado + `company_id` + Row Level Security (não schema-por-cliente).
2. **Multi-idioma**: conteúdo de vaga traduzível vive em `job_translations`; dados estruturais (skills, senioridade, salário) não são traduzidos.
3. **Subscrição B2B por candidaturas ativas**, não por vagas nem por mês fixo (`subscription_usage`, suporta excedente).
4. **Candidatos são globais** (sem `company_id`) — isolamento entre empresas é ao nível de `applications`.
5. **Publicação em LinkedIn/Indeed é manual nesta fase** — sem parcerias de API ativas. Nenhuma serve para importar dados de candidatos/mercado.
6. **Proibido scraping de perfis de terceiros.** Única integração legítima: "Entrar com LinkedIn" (OpenID Connect) para o próprio candidato.
7. **Pesquisa é sempre interna** (full-text search Postgres), candidatos sempre filtrados por `company_id`.
8. **Tendências de mercado**: construído mas com gate — não expor na UI sem volume de dados suficiente.
9. **Segurança**: MFA obrigatória em contexto de risco; `api_keys.scopes` limitado; `security_events` + `blocked_identities` para deteção de abuso.
10. **Regra inegociável**: `candidate_profile_optimizations` (ferramentas de carreira pagas) nunca tem FK para `applications` nem `scoring_results`, e nunca influencia o score de nenhuma candidatura. Protege a neutralidade percebida pelas empresas-cliente.
11. **MCP não é prioridade do dia 1.** Integrações (WhatsApp, providers de teste) usam adapter pattern via `company_integrations`. Roadmap futuro: expor o próprio NordikHire como servidor MCP.

## Segurança — auditoria pré-lançamento (2026-08-13)

Foi feito um audit de segurança completo (2 críticos + vários high/medium/low) e todas as correções de código/BD já estão commitadas (`82136d6`, `ea62854`, `1ad0834` — políticas RLS restritas a `for select`, fim do auto-link de contas de candidato por email não verificado, rate limiting atómico, IDOR no upload de vídeo, `changePlan` validado, convites a expirar, `roles.permissions` finalmente lido, hardening de prompt injection).

**Único pendente por resolver — não é código, é limite do plano Supabase:**
"Leaked Password Protection" (verificação de passwords comprometidas via HaveIBeenPwned) só está disponível a partir do **plano Pro** do Supabase. O projeto está num tier que não suporta esta opção — confirmado directamente pela UI do Supabase ("available on Pro Plans and up"). **Acção futura**: ao fazer upgrade do plano Supabase, activar em Authentication → Attack Protection → "Leaked password protection".

## Próximos passos após clonar nesta máquina

1. Rever com o Bruno o que já está ligado a dados reais (Supabase) vs. só UI estática, já que este resumo só viu a estrutura de ficheiros, não testou o comportamento.
2. Recriar `web/.env.local` (ver secção abaixo) — não vem no repo.
3. `npm install` dentro de `web/` antes de correr `npm run dev`.
4. Em aberto segundo a especificação original: endpoints de API formalizados, roadmap detalhado até v1.0, nome definitivo da marca, secção de preços da landing page.

## Variáveis de ambiente necessárias

Não estão no repo (`.gitignore` exclui `.env*`). Recriar `web/.env.local` com, no mínimo:
- Credenciais Supabase (URL + chaves anon/service role)
- Chave de API Anthropic (`ANTHROPIC_API_KEY` ou equivalente)
- `SITE_URL` — domínio real usado para construir o link de reset de password (`http://localhost:3000` em dev). Adicionado no audit de segurança de 2026-08-13 para deixar de confiar no `origin` enviado pelo cliente; **definir com o domínio de produção real ao fazer deploy**, senão o link de reset fica sempre a apontar para localhost.

Confirmar nomes exatos das variáveis diretamente no código em `web/src` (procurar por `process.env.`).
