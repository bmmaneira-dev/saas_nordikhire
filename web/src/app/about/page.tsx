import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Reveal } from "@/components/marketing/reveal";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sobre nós",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-surface-border px-6 py-20">
          <Reveal className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Sobre nós
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Construímos o NordikHire para tornar o recrutamento mais rápido
              e mais justo, para quem contrata e para quem procura emprego.
            </p>
          </Reveal>
        </section>

        <section className="border-b border-surface-border px-6 py-16">
          <Reveal className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              A nossa missão
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              A triagem manual de candidaturas consome tempo que as equipas de
              recrutamento raramente têm, e deixa muitos candidatos sem
              qualquer resposta. O NordikHire automatiza a parte repetitiva do
              processo — leitura de CVs, pontuação, primeira entrevista,
              testes técnicos — para que as pessoas possam concentrar-se na
              parte que só pessoas conseguem fazer: decidir.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Do outro lado, oferecemos aos candidatos ferramentas para
              chegarem mais preparados a cada processo — optimização de
              perfil, prática de entrevistas, feedback imediato — sem que
              isso influencie, de qualquer forma, a avaliação das suas
              candidaturas junto das empresas.
            </p>
          </Reveal>
        </section>

        <section className="border-b border-surface-border px-6 py-16">
          <Reveal className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Onde nascemos
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              A marca e a operação nascem em Angola, mas a plataforma foi
              desenhada desde o primeiro dia para expansão internacional —
              suporte a múltiplos idiomas e moedas, sem depender de
              infra-estrutura ou parcerias exclusivas de um único país.
            </p>
          </Reveal>
        </section>

        <section className="px-6 py-16">
          <Reveal className="mx-auto max-w-3xl rounded-2xl border border-surface-border bg-surface px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Queres saber mais sobre o NordikHire? Fala connosco.
            </p>
            <ButtonLink href="/signup" variant="secondary" className="mt-6">
              Criar conta gratuita
            </ButtonLink>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
