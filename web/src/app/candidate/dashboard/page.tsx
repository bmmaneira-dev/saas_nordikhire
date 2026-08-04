import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateLogout } from "@/app/candidate/login/actions";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { toOne } from "@/lib/to-one";

interface FeedbackRow {
  content: string;
  feedback_type: string | null;
  created_at: string;
}

const SOURCE_LABELS: Record<string, string> = {
  linkedin: "Perfil de LinkedIn",
  cv: "CV",
  other_platform: "Outra plataforma",
};

interface TestAssignmentRow {
  id: string;
  test_name: string | null;
  status: string;
}

interface ApplicationRow {
  id: string;
  status: string;
  applied_at: string;
  jobs: {
    job_translations: { title: string; locale: string }[];
    companies: { name: string } | { name: string }[];
  } | null;
  candidate_feedback: FeedbackRow[] | FeedbackRow | null;
  test_assignments: TestAssignmentRow[] | TestAssignmentRow | null;
}

export default async function CandidateDashboardPage() {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const admin = createAdminClient();
  const { data: sessions } = await admin
    .from("candidate_interview_practice")
    .select("id, target_role, status, created_at")
    .eq("candidate_id", candidate.id)
    .order("created_at", { ascending: false });

  const { data: applications } = await admin
    .from("applications")
    .select(
      "id, status, applied_at, jobs(job_translations(title, locale), companies(name)), candidate_feedback(content, feedback_type, created_at), test_assignments(id, test_name, status)"
    )
    .eq("candidate_id", candidate.id)
    .order("applied_at", { ascending: false });

  const { data: optimizations } = await admin
    .from("candidate_profile_optimizations")
    .select("id, source_type, source_label, overall_score, generated_at")
    .eq("candidate_id", candidate.id)
    .order("generated_at", { ascending: false });

  return (
    <>
      <PageHeader href="/candidate/dashboard">
        <form action={candidateLogout}>
          <Button type="submit" variant="secondary" size="sm">
            Sair
          </Button>
        </form>
      </PageHeader>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá, {candidate.full_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{candidate.email}</p>
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-medium">As tuas candidaturas</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {applications?.length === 0 && (
              <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
                Ainda não te candidataste a nenhuma vaga.
              </Card>
            )}
            {(applications as unknown as ApplicationRow[] | null)?.map(
              (application) => {
                const job = toOne(application.jobs);
                const translation =
                  job?.job_translations.find((t) => t.locale === "pt") ??
                  job?.job_translations[0];
                const company = toOne(job?.companies);
                const feedbackRows: FeedbackRow[] = Array.isArray(
                  application.candidate_feedback
                )
                  ? application.candidate_feedback
                  : application.candidate_feedback
                    ? [application.candidate_feedback]
                    : [];
                const feedbackHistory = [...feedbackRows].sort((a, b) =>
                  a.created_at < b.created_at ? 1 : -1
                );
                const tests: TestAssignmentRow[] = Array.isArray(
                  application.test_assignments
                )
                  ? application.test_assignments
                  : application.test_assignments
                    ? [application.test_assignments]
                    : [];

                return (
                  <Card key={application.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{translation?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {company?.name}
                        </p>
                      </div>
                      <Badge variant={statusVariant(application.status)}>
                        {application.status}
                      </Badge>
                    </div>
                    {feedbackHistory.length > 0 && (
                      <div className="mt-3 border-t border-surface-border pt-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Feedback da empresa
                        </p>
                        <ul className="mt-1 flex flex-col gap-1.5">
                          {feedbackHistory.map((fb, i) => (
                            <li key={i} className="text-sm text-foreground/90">
                              {fb.content}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {tests.length > 0 && (
                      <div className="mt-3 border-t border-surface-border pt-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Testes
                        </p>
                        <ul className="mt-1 flex flex-col gap-1.5">
                          {tests.map((test) => (
                            <li key={test.id} className="flex items-center justify-between text-sm">
                              <span>{test.test_name}</span>
                              <Link
                                href={`/candidate/tests/${test.id}`}
                                className="font-medium text-primary underline"
                              >
                                {test.status === "completed"
                                  ? "Ver resultado →"
                                  : "Fazer teste →"}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                );
              }
            )}
          </ul>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Ferramentas de carreira</h2>
            <ButtonLink href="/candidate/practice/new" size="sm">
              Praticar entrevista
            </ButtonLink>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Treina para entrevistas reais com um entrevistador simulado por IA.
            Independente de qualquer candidatura — nunca visto por nenhuma
            empresa nem usado em nenhum processo de selecção.
          </p>

          <ul className="mt-4 flex flex-col gap-3">
            {sessions?.length === 0 && (
              <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
                Ainda não praticaste nenhuma entrevista.
              </Card>
            )}
            {sessions?.map((session) => (
              <Card key={session.id} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{session.target_role}</span>
                  <Badge variant={statusVariant(session.status)}>
                    {session.status}
                  </Badge>
                </div>
                <Link
                  href={`/candidate/practice/${session.id}`}
                  className="mt-2 inline-block text-sm font-medium text-primary underline"
                >
                  {session.status === "completed"
                    ? "Ver avaliação →"
                    : "Continuar →"}
                </Link>
              </Card>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Otimizar perfil ou CV</h2>
            <ButtonLink href="/candidate/optimize/new" size="sm">
              Nova análise
            </ButtonLink>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Recebe feedback e sugestões de reescrita para o teu LinkedIn ou
            CV. Ferramenta pessoal — nunca partilhada com empresas nem usada
            em nenhuma candidatura.
          </p>

          <ul className="mt-4 flex flex-col gap-3">
            {optimizations?.length === 0 && (
              <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
                Ainda não analisaste o teu perfil ou CV.
              </Card>
            )}
            {optimizations?.map((optimization) => (
              <Card key={optimization.id} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {optimization.source_label ||
                      SOURCE_LABELS[optimization.source_type] ||
                      optimization.source_type}
                  </span>
                  {optimization.overall_score != null && (
                    <span className="text-lg font-semibold text-primary">
                      {Math.round(optimization.overall_score)}
                    </span>
                  )}
                </div>
                <Link
                  href={`/candidate/optimize/${optimization.id}`}
                  className="mt-2 inline-block text-sm font-medium text-primary underline"
                >
                  Ver análise →
                </Link>
              </Card>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
