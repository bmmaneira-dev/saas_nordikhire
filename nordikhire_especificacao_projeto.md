# NordikHire — Especificação do Projecto (v1)

> Nome do projecto ainda por confirmar — "NordikHire" usado como placeholder ao longo deste documento e do schema. Substituir globalmente assim que o nome definitivo estiver registado.

Documento de arranque para implementação. Complementa dois ficheiros já produzidos:
- `nordikhire_schema.sql` — schema completo da base de dados (Postgres/Supabase)
- `nordikhire_politica_protecao_dados.md` — política de protecção de dados (RGPD, Lei angolana, LGPD, CCPA)

---

## 1. Visão geral

Plataforma SaaS de recrutamento inteligente com IA, para automatizar praticamente todo o processo de selecção — desde a criação da vaga até à decisão final — e, em paralelo, oferecer ferramentas de carreira ao próprio candidato (optimização de perfil e CV).

**Origem:** marca e operação nascem em Angola, mas a plataforma é desenhada desde o início para expansão internacional — multi-idioma, multi-moeda, sem dependência de infra-estrutura ou parcerias exclusivas de um único país.

**Dois lados do negócio:**
1. **B2B** — empresas/recrutadores pagam por subscrição, cobrada por número de candidaturas activas
2. **B2C (novo)** — candidatos podem opcionalmente pagar por ferramentas de carreira avançadas (optimização de perfil/CV), **completamente desligado** do processo de avaliação de candidaturas

---

## 2. Utilizadores

| Perfil | Precisa de conta? | Acede a |
|---|---|---|
| Empresa/Recrutador | Sim, sempre | Dashboard, vagas, candidatos, integrações, facturação, equipa |
| Candidato — convidado | Não | Candidatura a uma vaga específica, sem persistência de conta |
| Candidato — registado | Sim, opcional | Tudo o que o convidado tem, mais ferramentas de carreira (optimização de perfil/CV) |

---

## 3. Fluxos principais

### 3.1 Fluxo do recrutador
Dashboard → Cria vaga → Publica (link/QR/WhatsApp) → IA processa CVs (score) → **Avaliação** (testes técnicos/psicométricos via provider externo → entrevista simulada com IA → relatório consolidado → relatório de desenvolvimento com forças/lacunas/formação) → Ranking → Decisão (avança/rejeita/feedback)

Testes e entrevista com IA são **opcionais por vaga**, configurados na criação da vaga.

### 3.2 Fluxo do candidato
Vê a vaga → escolhe **Convidado** (candidata-se directo) ou **Cria conta** (ganha acesso a ferramentas de carreira) → Envia candidatura (CV, ou preenchimento via "Entrar com LinkedIn" — importação oficial via OAuth do próprio perfil) → Testes/entrevista, se a vaga exigir → Feedback (estado da candidatura)

Se tiver conta: também acede a **Ferramentas de carreira** — optimização de perfil/CV, independente de qualquer candidatura.

---

## 4. Stack técnico

- **Frontend:** Next.js + React + Tailwind
- **Backend:** FastAPI ou NestJS
- **Base de dados:** Supabase (Postgres + Storage + Auth)
- **IA:** OpenAI
- **Deploy:** Vercel + Render
- **MVP alternativo (validação rápida, não-código):** Make.com + Supabase/Airtable + OpenAI + parser de PDF + WhatsApp Business API

---

## 5. Decisões de arquitectura (ler antes de implementar)

1. **Multi-tenant:** schema partilhado com `company_id` em quase todas as tabelas + Row Level Security no Postgres — não schema-por-cliente.
2. **Multi-idioma:** conteúdo traduzível da vaga (`title`, `description`, `requirements_text`) vive em `job_translations`, uma linha por idioma. Dados estruturais (skills, senioridade, salário) não são traduzidos.
3. **Subscrição B2B por candidaturas activas**, não por vagas nem por mês fixo. `subscription_usage` conta candidaturas em estado não-fechado por período de facturação. Suporta cobrança de excedente (`overage_price_per_application`).
4. **Candidatos são globais** (sem `company_id`) — o mesmo candidato pode candidatar-se a empresas diferentes. Isolamento entre empresas acontece ao nível de `applications`, não do perfil do candidato.
5. **Publicação em LinkedIn/Indeed é manual nesta fase.** LinkedIn não está a aceitar novas parcerias de Job Posting API neste momento; Indeed está a migrar de feeds XML para API directa com contrato assinado (~6 semanas de implementação). Nenhuma das duas serve para *importar* dados de candidatos ou de mercado — só para publicar vagas próprias, e mesmo isso requer parceria formal. `job_board_postings.sync_method` reflecte isto (`manual` por omissão).
6. **Não fazer scraping de perfis de terceiros no LinkedIn ou qualquer plataforma.** A única integração legítima é "Entrar com LinkedIn" (OpenID Connect) para o próprio candidato importar o seu próprio perfil.
7. **Pesquisa é sempre interna** (full-text search em Postgres sobre dados próprios) — vagas e candidatos, este último sempre filtrado por `company_id`.
8. **Tendências de mercado: construído mas com gate.** Não expor `market_trend_forecasts` na interface antes de haver volume de dados suficiente para confiança média/alta. `confidence_level` deve reflectir honestamente o tamanho da amostra.
9. **Autenticação e segurança:** MFA disponível para todos, obrigatória em contexto de risco (novo dispositivo/localização). Chaves de API de terceiros com escopo limitado (`api_keys.scopes`) e possível restrição por IP. `security_events` + `blocked_identities` para detecção e bloqueio automático de acesso indevido.
10. **Ferramentas de carreira do candidato — regra de governança inegociável:** `candidate_profile_optimizations` nunca tem FK para `applications` nem `scoring_results`, e o resultado nunca entra no cálculo de score de nenhuma candidatura. Um candidato pago melhora o perfil dele fora da plataforma — nunca a posição dele no ranking de uma vaga. Isto protege a neutralidade percebida pelas empresas-cliente, que são o cliente pagante principal do negócio B2B.
11. **MCP (Model Context Protocol):** não é necessidade do dia 1. As integrações operacionais (WhatsApp, providers de teste) usam adapter pattern simples via `company_integrations`, porque o fluxo actual é uma pipeline determinística, não um agente autónomo a decidir dinamicamente que ferramenta invocar. Ideia de roadmap futuro: expor o próprio NordikHire como servidor MCP para ferramentas de IA de terceiros consultarem vagas/candidatos/métricas.

---

## 6. Ecrãs desenhados (referência visual disponível, ver mockups gerados na conversa)

**Lado empresa:**
1. Dashboard RH — métricas + lista de vagas
2. Criar/editar vaga — conteúdo multi-idioma por tabs, requisitos, testes opcionais
3. Perfil do candidato — score por categoria, red flags, testes, entrevista IA, relatório de desenvolvimento, acções de avançar/rejeitar
4. Configuração de integrações — canais (WhatsApp/Telegram), providers de teste, publicação de vagas (com aviso de "manual" onde aplicável)
5. Gestão de equipa — convites, papéis (Admin/Gestor/Recrutador/Leitor), nota de permissões visível
6. Facturação/subscrição — barra de uso de candidaturas activas vs. limite, aviso de excedente, histórico de facturas
7. Onboarding da empresa — assistente por passos (país da sede entre várias opções, idiomas de publicação)

**Lado candidato:**
8. Página pública da vaga + formulário de candidatura (upload CV, "Preencher com LinkedIn", alternativa WhatsApp)
9. Onboarding do candidato — como funciona a candidatura, nota de protecção de dados
10. Optimização de perfil (ferramenta de carreira) — modelo freemium: relatório básico grátis, reescrita completa e comparação com benchmark como upgrade pago

**Transversal:**
11. Autenticação — login com MFA, OAuth Google/Microsoft, selector de idioma

**Landing page** (marketing, fora da aplicação autenticada): hero + 3 funcionalidades-chave + CTA. Prova social e secção de preços ficam para quando houver clientes reais e planos finalizados.

---

## 7. Modelo de monetização

**B2B (empresas):** subscrição mensal por plano (`plans`), cobrada por nº de candidaturas activas simultâneas (`subscription_usage`), com opção de cobrança de excedente por candidatura acima do limite.

**B2C (candidatos, opcional):** freemium — `candidate_plans` separado de `plans`. Nível gratuito com uso limitado por mês; nível pago ("Carreira Pro") com reescrita completa de secções, optimizações ilimitadas, e comparação com benchmark de perfis da mesma área.

---

## 8. Protecção de dados — pontos-chave a implementar (ver documento completo)

- Consentimento explícito do candidato antes de qualquer tratamento (`candidates.consent_data_processing`)
- Direito ao apagamento tecnicamente suportado, sem comprometer dados de outras candidaturas
- Direito a pedir revisão humana de rejeição baseada predominantemente em score automático
- Nenhuma venda de dados pessoais a terceiros
- Providers de teste só recebem dados quando a integração é activada para uma vaga específica

---

## 9. Em aberto / próximos passos (não incluído neste documento)

- Especificação formal de endpoints de API (REST) — recomendo fazer depois de teres a primeira versão de código a funcionar, não antes
- Roadmap detalhado até v1.0 — idem, mais realista depois de saberes quanto tempo cada peça levou
- Nome definitivo da marca (verificação de domínio `.com` em curso)
- Secção de preços da landing page (depende dos planos finais)

---

## 10. Como usar este documento no Claude Code

Sugestão de primeira instrução:

> "Vou construir um SaaS de recrutamento chamado [NOME]. Aqui está a especificação completa do projecto, o schema da base de dados, e a política de protecção de dados. Quero começar por: (1) aplicar o schema no Supabase, (2) construir a autenticação com Supabase Auth incluindo MFA, (3) construir o dashboard do RH e o fluxo de criação de vaga. Vou fornecer capturas dos mockups à medida que avançamos em cada ecrã."

Anexa os três ficheiros (`nordikhire_schema.sql`, `nordikhire_politica_protecao_dados.md`, e este documento) na primeira mensagem.
