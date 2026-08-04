# Política de Protecção de Dados — NordikHire

**Última actualização:** [inserir data de publicação]
**Aviso importante:** este documento é um modelo de trabalho, preparado para adaptação ao NordikHire enquanto plataforma de recrutamento multi-mercado. **Não constitui aconselhamento jurídico.** Antes de publicares esta política, deve ser revista por um advogado com conhecimento das jurisdições onde o NordikHire vai operar — cada país onde tiveres empresas-cliente ou candidatos pode ter exigências adicionais específicas.

---

## 1. Âmbito e enquadramento legal

O NordikHire processa dados pessoais de candidatos, recrutadores e representantes de empresas-cliente em múltiplos mercados. Esta política foi desenhada tendo em conta os princípios comuns aos principais enquadramentos internacionais de protecção de dados, nomeadamente:

- **RGPD (Regulamento Geral sobre a Protecção de Dados)** — União Europeia, Regulamento (UE) 2016/679
- **Lei de Protecção de Dados Pessoais de Angola** — Lei n.º 22/11, de 17 de Junho
- **LGPD (Lei Geral de Protecção de Dados)** — Brasil, Lei n.º 13.709/2018
- **CCPA/CPRA (California Consumer Privacy Act)** — Estados Unidos, aplicável se houver candidatos ou clientes residentes na Califórnia
- Outros enquadramentos nacionais aplicáveis consoante o país de operação de cada empresa-cliente (referência dinâmica via `applicable_privacy_frameworks` no perfil de cada empresa)

Sempre que os enquadramentos aplicáveis a um utilizador específico divirjam entre si, aplica-se o standard mais protector para o titular dos dados.

---

## 2. Princípios gerais

O NordikHire compromete-se a tratar dados pessoais de acordo com os seguintes princípios, comuns aos enquadramentos listados acima:

1. **Licitude, lealdade e transparência** — os dados são recolhidos com base legal identificada e o titular é informado do tratamento.
2. **Limitação da finalidade** — os dados são usados apenas para os fins de recrutamento e melhoria da plataforma, não para outros fins incompatíveis.
3. **Minimização de dados** — recolhe-se apenas o estritamente necessário ao processo de recrutamento.
4. **Exactidão** — os candidatos podem corrigir os seus dados a qualquer momento.
5. **Limitação da conservação** — os dados não são guardados indefinidamente (ver secção 6).
6. **Integridade e confidencialidade** — medidas técnicas e organizativas adequadas (ver secção 7).
7. **Responsabilização (accountability)** — o NordikHire mantém registo das actividades de tratamento e consegue demonstrar conformidade.

---

## 3. Que dados recolhemos

| Categoria | Exemplos | Titular |
|---|---|---|
| Dados de identificação | Nome, email, telefone | Candidato, recrutador |
| Dados profissionais | CV, histórico de emprego, formação, competências | Candidato |
| Dados de avaliação | Resultados de testes técnicos/psicométricos, transcrição de entrevista com IA, score de matching | Candidato |
| Dados de utilização da plataforma | Logs de acesso, endereço IP, dispositivo, localização aproximada | Candidato, recrutador |
| Dados de facturação | Dados de pagamento da empresa-cliente (não dados de candidatos) | Empresa-cliente |

**Não recolhemos deliberadamente** categorias especiais de dados (origem racial ou étnica, opiniões políticas, convicções religiosas, dados de saúde, orientação sexual) salvo quando fornecidos voluntariamente pelo candidato num contexto onde a legislação local o permita e exija (ex: dados de deficiência para adaptação razoável do processo de recrutamento), e sempre com consentimento explícito adicional.

---

## 4. Base legal para o tratamento

- **Execução de um processo pré-contratual** — tratamento do CV e dados de candidatura, a pedido do próprio candidato, para efeitos de recrutamento.
- **Consentimento explícito** — para testes psicométricos, entrevista simulada com IA, e partilha de relatório de desenvolvimento com o candidato.
- **Interesse legítimo** — segurança da plataforma, prevenção de fraude, melhoria do serviço (sempre ponderado contra os direitos e liberdades do titular).
- **Obrigação legal** — quando a lei aplicável exigir conservação ou reporte de determinados dados.

---

## 5. Partilha de dados com terceiros

- **Providers de teste** (SHL, Hogan, HackerRank, TestGorilla, entre outros) — só recebem dados quando a empresa-cliente activa essa integração para uma vaga específica, e apenas os dados estritamente necessários à realização do teste.
- **Canais de comunicação** (WhatsApp Business API, Telegram, email) — usados apenas para comunicação relacionada com o processo de candidatura em curso.
- **Nunca vendemos dados pessoais a terceiros.**
- **Dados agregados de tendências de mercado** — só incluem dados de empresas que activaram explicitamente a partilha (`allow_market_data_sharing`), e são sempre anonimizados/agregados antes de qualquer exposição.

---

## 6. Prazos de conservação

| Tipo de dado | Prazo indicativo | Nota |
|---|---|---|
| Dados de candidatura (candidato não contratado) | Até 24 meses após o fecho da vaga, salvo pedido de eliminação antecipada | Prazo pode variar por jurisdição — confirmar mínimo/máximo legal aplicável |
| Dados de candidato contratado | Conforme legislação laboral aplicável ao país da empresa-cliente | Gerido fora do NordikHire após contratação, salvo integração específica |
| Logs de segurança e auditoria | 12 meses | Necessário para investigação de incidentes |
| Dados de facturação | Conforme obrigações fiscais do país da empresa-cliente | Tipicamente 5-10 anos |

---

## 7. Segurança técnica e organizativa

O NordikHire aplica múltiplas camadas de protecção contra acesso não autorizado, incluindo por terceiros:

- **Isolamento multi-tenant** — cada empresa-cliente só acede aos seus próprios dados, reforçado por Row Level Security ao nível da base de dados (não apenas na aplicação).
- **Autenticação multi-factor (MFA)** — disponível para todos os utilizadores, obrigatória em contextos de risco elevado (novo dispositivo, localização incomum).
- **Chaves de API com escopo limitado** — qualquer integração externa opera com o princípio do menor privilégio, nunca com acesso total por omissão, e pode ser restringida a intervalos de IP conhecidos.
- **Registo e bloqueio automático** — tentativas de acesso indevido (logins falhados repetidos, chaves de API inválidas, pedidos fora do IP permitido) são registadas e podem accionar bloqueio automático da origem.
- **Cifragem** — dados sensíveis (chaves de API de terceiros, segredos de MFA) nunca são guardados em texto simples.
- **Registo de auditoria** — acções relevantes sobre dados de candidatos ficam registadas com utilizador, acção e momento, para efeitos de responsabilização.
- **Direito ao esquecimento tecnicamente suportado** — a arquitectura permite eliminação ou anonimização de dados de um candidato a pedido, sem comprometer a integridade dos dados de outras candidaturas.

---

## 8. Direitos dos titulares dos dados

Consoante a jurisdição aplicável, os titulares podem ter os seguintes direitos (lista não exaustiva — confirmar quais se aplicam a cada jurisdição concreta):

- Direito de acesso aos seus dados
- Direito de rectificação de dados incorrectos
- Direito ao apagamento ("direito ao esquecimento")
- Direito à portabilidade dos dados
- Direito de oposição ao tratamento
- Direito de retirar o consentimento a qualquer momento, sem afectar a licitude do tratamento anterior
- Direito de não ficar sujeito a decisões automatizadas com efeito jurídico significativo sem intervenção humana — **relevante para o scoring por IA**: o candidato tem direito a solicitar revisão humana de uma decisão de rejeição baseada predominantemente em score automático

Pedidos podem ser submetidos através de [inserir canal de contacto — email dedicado de privacidade].

---

## 9. Transferências internacionais de dados

Como o NordikHire serve empresas-cliente e candidatos em múltiplos países, pode haver transferência de dados entre jurisdições (ex: dados de um candidato em Portugal processados em infraestrutura alojada noutra região). Nestes casos, o NordikHire compromete-se a:

- Usar mecanismos de transferência reconhecidos (cláusulas contratuais-tipo, decisões de adequação, ou equivalente) quando aplicável entre a UE e países terceiros
- Informar a empresa-cliente sobre a região de residência dos dados quando relevante para a sua própria conformidade

---

## 10. Contacto

Para questões sobre esta política ou para exercer os direitos listados na secção 8:
[inserir email de contacto de protecção de dados / encarregado de protecção de dados, se aplicável]

---

### Nota para implementação

Este documento assume que o NordikHire vai operar em múltiplas jurisdições desde o início. Antes de publicares:

1. Confirma com um advogado os prazos exactos de conservação por país onde vais ter clientes
2. Decide se precisas de um Encarregado de Protecção de Dados (DPO) formal — obrigatório em certos casos ao abrigo do RGPD
3. Prepara também **Termos de Serviço** separados (contrato com a empresa-cliente) — este documento cobre só a política de privacidade
4. Considera um **Acordo de Processamento de Dados (DPA)** separado para assinar com cada empresa-cliente, já que o NordikHire actua como processador dos dados dos candidatos em nome da empresa-cliente (que é a responsável pelo tratamento)
