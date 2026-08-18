import Link from "next/link";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/reveal";
import { PipelinePreview } from "@/components/marketing/pipeline-preview";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import type { PlanInfo } from "@/lib/billing";

function formatPlanPrice(plan: PlanInfo): string {
  if (plan.price_monthly_kz == null || plan.price_monthly_usd == null) {
    return "Sob consulta";
  }
  const kz = Number(plan.price_monthly_kz).toLocaleString("pt-PT");
  return `${kz} Kz / mês`;
}

function formatPlanPriceUsd(plan: PlanInfo): string | null {
  if (plan.price_monthly_usd == null) return null;
  return `aprox. $${plan.price_monthly_usd} USD`;
}

const RECRUITER_FEATURES = [
  {
    title: "Scoring automático de CVs",
    body: "Cada candidatura é lida e pontuada automaticamente contra os requisitos da vaga, com justificação incluída.",
    icon: (
      <path d="M9 12h6M9 16h6M9 8h1M4 6a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z" />
    ),
    accent: true,
  },
  {
    title: "Entrevistas simuladas",
    body: "A primeira conversa é conduzida automaticamente, com uma avaliação estruturada entregue no final.",
    icon: (
      <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    ),
    accent: true,
  },
  {
    title: "Testes técnicos e comportamentais",
    body: "Gera testes à medida da vaga, com correcção e recomendação automáticas.",
    icon: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  },
  {
    title: "Detecção de sinais de risco",
    body: "Inconsistências e lacunas no percurso do candidato são sinalizadas antes da entrevista.",
    icon: <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />,
  },
  {
    title: "Pipeline visual por etapa",
    body: "Acompanha cada candidatura da recepção à contratação, num quadro único por vaga.",
    icon: <path d="M4 20V10M10 20V4M16 20v-7M4 20h16" />,
  },
  {
    title: "Interface em 4 idiomas",
    body: "Cada recrutador escolhe o idioma da plataforma no registo, e as vagas podem ser traduzidas com um clique.",
    icon: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM2 12h20M12 2c2.5 2.7 4 6.2 4 10s-1.5 7.3-4 10c-2.5-2.7-4-6.2-4-10s1.5-7.3 4-10Z" />,
  },
];

const CANDIDATE_FEATURES = [
  {
    title: "Optimização de perfil",
    body: "Cola o teu LinkedIn ou CV e recebe feedback secção a secção, com sugestões de reescrita.",
  },
  {
    title: "Simulador de entrevistas por voz",
    body: "Pratica para o cargo que queres, com perguntas personalizadas e avaliação instantânea. Nunca visto por empresas.",
  },
  {
    title: "Testes com feedback imediato",
    body: "Percebe onde estás bem e onde precisas de melhorar, com explicações claras a cada resposta.",
  },
  {
    title: "Todas as candidaturas num só lugar",
    body: "Segue o estado de cada candidatura e recebe o feedback das empresas assim que é enviado.",
  },
];

const STEPS = [
  { verb: "Publica a vaga", body: "Cria a vaga em minutos e partilha o link ou o código QR gerado automaticamente." },
  { verb: "Cada CV é analisado automaticamente", body: "As candidaturas chegam já pontuadas e ordenadas pelo ajuste ao cargo." },
  { verb: "Entrevistas e testes automáticos", body: "A primeira entrevista é conduzida automaticamente, com os testes que escolheres já aplicados." },
  { verb: "Decide com contexto completo", body: "Compara candidatos lado a lado antes de avançar ou recusar." },
];

export function LandingPage({ plans }: { plans: PlanInfo[] }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <section
          className="relative overflow-hidden px-6 pb-20 pt-16 md:pt-20"
          style={{
            background: `linear-gradient(160deg, var(--hero-bg), var(--hero-bg-end))`,
          }}
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
            <div className="relative z-10">
              <h1
                className="text-4xl font-bold leading-tight tracking-tight md:text-5xl"
                style={{ color: "var(--hero-foreground)" }}
              >
                Talento certo.
                <br />
                Melhores decisões.
              </h1>
              <p
                className="mt-4 max-w-md text-base"
                style={{ color: "var(--hero-muted)" }}
              >
                Triagem automática de CVs, entrevistas simuladas, testes
                técnicos e gestão de equipa, tudo num só lugar.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink href="/signup" size="md">
                  Sou uma empresa
                </ButtonLink>
                <Link
                  href="/candidate/signup"
                  className={buttonClass(
                    "secondary",
                    "md",
                    "border-white/20 bg-white/5 text-white hover:bg-white/10"
                  )}
                >
                  Sou candidato
                </Link>
              </div>
            </div>
            <div className="relative z-10 flex justify-center md:justify-end">
              <PipelinePreview />
            </div>
          </div>

          <svg
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-64 w-full opacity-70"
            viewBox="0 0 600 300"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 220C100 180 200 260 300 200C400 140 500 220 600 170V300H0Z"
              fill="var(--hero-accent)"
              fillOpacity="0.16"
            />
            <path
              d="M0 250C120 210 220 280 320 230C420 180 500 250 600 210"
              stroke="var(--hero-accent)"
              strokeOpacity="0.4"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </section>

        <section className="border-b border-surface-border px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-foreground">
                Duas equipas, uma só plataforma.
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <Reveal>
                <Card
                  id="empresas"
                  className="scroll-mt-24 p-8 transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <p className="text-sm font-medium text-primary">
                    Para recrutadores
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-foreground">
                    Contrata mais depressa, com mais confiança.
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Deixa a triagem inicial ser feita automaticamente e
                    concentra a tua equipa nas decisões que só pessoas
                    conseguem tomar.
                  </p>
                  <Link
                    href="/signup"
                    className="mt-6 inline-block text-sm font-medium text-primary underline"
                  >
                    Sou uma empresa
                  </Link>
                </Card>
              </Reveal>
              <Reveal delay={100}>
                <Card
                  id="candidatos"
                  className="scroll-mt-24 p-8 transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <p className="text-sm font-medium text-primary">
                    Para candidatos
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-foreground">
                    Chega mais preparado a cada entrevista.
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Optimiza o teu perfil, pratica entrevistas simuladas e
                    acompanha todas as tuas candidaturas num só lugar.
                  </p>
                  <Link
                    href="/candidate/signup"
                    className="mt-6 inline-block text-sm font-medium text-primary underline"
                  >
                    Sou candidato
                  </Link>
                </Card>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="border-b border-surface-border px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <h2 className="max-w-lg text-3xl font-semibold tracking-tight text-foreground">
                Ferramentas para quem recruta.
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {RECRUITER_FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 60}>
                  <div
                    className={`h-full rounded-2xl border p-6 transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 ${
                      f.accent
                        ? "border-transparent text-white hover:shadow-lg"
                        : "border-surface-border bg-surface hover:border-primary/30 hover:shadow-md"
                    }`}
                    style={
                      f.accent
                        ? {
                            background: `linear-gradient(135deg, var(--hero-bg), var(--hero-bg-end))`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{
                        background: f.accent
                          ? "rgba(255,255,255,0.12)"
                          : `linear-gradient(135deg, var(--hero-accent), var(--hero-accent-2))`,
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        {f.icon}
                      </svg>
                    </span>
                    <h3
                      className={`mt-4 text-base font-semibold ${
                        f.accent ? "text-white" : "text-foreground"
                      }`}
                    >
                      {f.title}
                    </h3>
                    <p
                      className={`mt-2 text-sm ${
                        f.accent ? "text-white/70" : "text-muted-foreground"
                      }`}
                    >
                      {f.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-surface-border bg-surface-muted px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <h2 className="max-w-lg text-3xl font-semibold tracking-tight text-foreground">
                Ferramentas para quem procura emprego.
              </h2>
            </Reveal>
            <ul className="mt-10 flex flex-col divide-y divide-surface-border overflow-hidden rounded-2xl border border-surface-border bg-surface">
              {CANDIDATE_FEATURES.map((f, i) => (
                <li key={f.title} className="flex flex-col gap-1 p-6 sm:flex-row sm:items-baseline sm:gap-6">
                  <Reveal delay={i * 60} className="sm:w-72 sm:shrink-0">
                    <p className="font-semibold text-foreground">{f.title}</p>
                  </Reveal>
                  <p className="text-sm text-muted-foreground">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-b border-surface-border px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <h2 className="max-w-lg text-3xl font-semibold tracking-tight text-foreground">
                Da vaga à contratação, sem perder o fio.
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-8 md:grid-cols-4">
              {STEPS.map((s, i) => (
                <Reveal key={s.verb} delay={i * 80}>
                  <div className="relative pl-6">
                    <span
                      className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full"
                      style={{ background: "var(--primary)" }}
                    />
                    {i < STEPS.length - 1 && (
                      <span className="absolute left-1 top-4 hidden h-full w-px bg-surface-border md:block" />
                    )}
                    <p className="text-base font-semibold text-foreground">
                      {s.verb}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {s.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="precos" className="scroll-mt-16 border-b border-surface-border px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <h2 className="max-w-lg text-3xl font-semibold tracking-tight text-foreground">
                Planos simples, sem surpresas.
              </h2>
              <p className="mt-3 max-w-lg text-sm text-muted-foreground">
                Começa com 14 dias grátis. Muda de plano quando quiseres,
                directamente no teu painel.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {plans.map((plan, i) => {
                const highlighted = plan.name === "Growth";
                const usd = formatPlanPriceUsd(plan);
                return (
                  <Reveal key={plan.id} delay={i * 80}>
                    <div
                      className={`flex h-full flex-col rounded-2xl border p-8 transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 ${
                        highlighted
                          ? "border-primary bg-surface shadow-lg hover:shadow-xl"
                          : "border-surface-border bg-surface hover:border-primary/30 hover:shadow-md"
                      }`}
                    >
                      {highlighted && (
                        <span className="mb-3 inline-flex w-fit items-center rounded-full bg-info-bg px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-info">
                          Mais escolhido
                        </span>
                      )}
                      <p className="text-lg font-semibold text-foreground">
                        {plan.name}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-foreground">
                        {formatPlanPrice(plan)}
                      </p>
                      {usd && (
                        <p className="text-xs text-muted-foreground">{usd}</p>
                      )}
                      <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
                        <li>
                          {plan.max_active_jobs ?? "Vagas ilimitadas"}
                          {plan.max_active_jobs != null ? " vagas activas" : ""}
                        </li>
                        <li>
                          {plan.max_users ?? "Utilizadores ilimitados"}
                          {plan.max_users != null ? " utilizadores" : ""}
                        </li>
                        <li>
                          {plan.max_active_applications ?? "Candidaturas ilimitadas"}
                          {plan.max_active_applications != null
                            ? " candidaturas activas"
                            : ""}
                        </li>
                        {plan.features.ai_scoring && <li>Scoring automático de CVs</li>}
                        {plan.features.ai_interview && (
                          <li>Entrevistas simuladas</li>
                        )}
                      </ul>
                      <ButtonLink
                        href="/signup"
                        variant={highlighted ? "primary" : "secondary"}
                        className="mt-8"
                      >
                        Sou uma empresa
                      </ButtonLink>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Pronto para começar?
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Cria a tua conta gratuita em menos de dois minutos. Sem cartão
              de crédito.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/signup">Sou uma empresa</ButtonLink>
              <ButtonLink href="/candidate/signup" variant="secondary">
                Sou candidato
              </ButtonLink>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
