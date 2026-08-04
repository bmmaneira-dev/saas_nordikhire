import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { toOne } from "@/lib/to-one";
import { Card } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";

export default async function InterviewsIndexPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const admin = createAdminClient();
  const { data: interviews } = await admin
    .from("ai_interviews")
    .select(
      "id, status, ai_summary, ai_evaluation, scheduled_at, completed_at, application_id, applications!inner(company_id, job_id, candidates(full_name), jobs(job_translations(title, locale)))"
    )
    .eq("applications.company_id", appUser.company_id)
    .order("scheduled_at", { ascending: false });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Entrevistas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Todas as entrevistas simuladas por IA, em todas as vagas.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {(interviews?.length ?? 0) === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            Ainda não há entrevistas.
          </Card>
        )}
        {interviews?.map((interview) => {
          const application = toOne(interview.applications);
          const candidate = toOne(application?.candidates);
          const job = toOne(application?.jobs);
          const title =
            job?.job_translations.find((t) => t.locale === "pt")?.title ??
            job?.job_translations[0]?.title;
          const evaluation = interview.ai_evaluation as Record<
            string,
            number
          > | null;

          return (
            <Card key={interview.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/interview/${interview.id}`}
                    className="font-medium text-primary underline"
                  >
                    {candidate?.full_name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{title}</p>
                </div>
                <Badge variant={statusVariant(interview.status)}>
                  {interview.status}
                </Badge>
              </div>
              {evaluation && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Comunicação: {evaluation.communication}</span>
                  <span>Profundidade técnica: {evaluation.technical_depth}</span>
                  <span>Resolução de problemas: {evaluation.problem_solving}</span>
                  <span>Adequação cultural: {evaluation.cultural_fit}</span>
                </div>
              )}
              {interview.ai_summary && (
                <p className="mt-2 text-sm text-foreground/90">
                  {interview.ai_summary}
                </p>
              )}
              <Link
                href={`/dashboard/jobs/${application?.job_id}#candidate-${interview.application_id}`}
                className="mt-2 inline-block text-xs font-medium text-primary underline"
              >
                Ver na vaga →
              </Link>
            </Card>
          );
        })}
      </ul>
    </>
  );
}
