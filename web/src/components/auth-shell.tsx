import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/theme-toggle";

interface Feature {
  icon: ReactNode;
  label: string;
}

const COMPANY_FEATURES: Feature[] = [
  {
    label: "Triagem inteligente de CVs",
    icon: (
      <path d="M9 12h6M9 16h6M9 8h1M4 6a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z" />
    ),
  },
  {
    label: "Testes e entrevistas automatizadas",
    icon: (
      <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    ),
  },
  {
    label: "Relatórios e insights avançados",
    icon: <path d="M4 20V10M10 20V4M16 20v-7M4 20h16" />,
  },
];

const CANDIDATE_FEATURES: Feature[] = [
  {
    label: "Optimização de perfil",
    icon: (
      <path d="M4 6a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6ZM9 15l2 2 4-4" />
    ),
  },
  {
    label: "Simulador de entrevistas",
    icon: (
      <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    ),
  },
  {
    label: "Testes técnicos com feedback instantâneo",
    icon: <path d="M9 12h6M9 16h6M9 8h1M4 6a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z" />,
  },
];

const COPY = {
  company: {
    tagline: ["Talento certo.", "Decisões melhores.", "Resultados reais."],
    subtitle:
      "A plataforma de recrutamento baseada em dados para empresas que querem ir mais longe.",
    features: COMPANY_FEATURES,
  },
  candidate: {
    tagline: ["Talento em destaque.", "Oportunidades reais.", "Carreira em movimento."],
    subtitle:
      "Ferramentas de carreira para candidatos que querem dar o próximo passo.",
    features: CANDIDATE_FEATURES,
  },
} as const;

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  variant = "company",
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  variant?: "company" | "candidate";
}) {
  const copy = COPY[variant];

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      <div
        className="relative hidden w-full flex-col justify-between overflow-hidden px-12 py-12 md:flex md:w-[45%] lg:w-[42%]"
        style={{
          background: `linear-gradient(160deg, var(--hero-bg), var(--hero-bg-end))`,
          color: "var(--hero-foreground)",
        }}
      >
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{
                background: `linear-gradient(135deg, var(--hero-accent), var(--hero-accent-2))`,
              }}
            >
              N
            </span>
            NORDIKHIRE
          </span>

          <h1 className="mt-16 text-4xl font-bold leading-tight tracking-tight">
            {copy.tagline.map((line, i) => (
              <span key={i} className="block">
                {i === copy.tagline.length - 1 ? (
                  <>
                    {line.slice(0, -1)}
                    <span style={{ color: "var(--hero-accent)" }}>.</span>
                  </>
                ) : (
                  line
                )}
              </span>
            ))}
          </h1>
          <p className="mt-4 max-w-sm text-sm" style={{ color: "var(--hero-muted)" }}>
            {copy.subtitle}
          </p>

          <ul className="mt-10 flex flex-col gap-4">
            {copy.features.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, var(--hero-accent), var(--hero-accent-2))`,
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
                    className="h-4 w-4"
                  >
                    {f.icon}
                  </svg>
                </span>
                <span className="text-sm font-medium">{f.label}</span>
              </li>
            ))}
          </ul>
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
            fillOpacity="0.18"
          />
          <path
            d="M0 250C120 210 220 280 320 230C420 180 500 250 600 210"
            stroke="var(--hero-accent)"
            strokeOpacity="0.5"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M0 270C120 235 240 290 340 245C440 200 520 265 600 235"
            stroke="var(--hero-accent-2)"
            strokeOpacity="0.4"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </div>

      <main className="relative flex flex-1 items-center justify-center bg-background px-4 py-16">
        <ThemeToggle className="absolute right-4 top-4" />
        <div className="w-full max-w-sm">
          <Logo className="mb-8 justify-center text-lg md:hidden" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        </div>
      </main>
    </div>
  );
}
