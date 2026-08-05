import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { toOne } from "@/lib/to-one";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { statusLabel } from "@/lib/i18n/status-label";
import { Card } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";

export default async function InterviewsIndexPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const company = toOne(appUser.companies);
  const dict = await getDictionary(toLocale(company?.default_locale));
  const t = dict.interviewsList;
  const te = dict.interviewEvaluation;

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
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>

      <ul className="mt-6 flex flex-col gap-3">
        {(interviews?.length ?? 0) === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            {t.noneYet}
          </Card>
        )}
        {interviews?.map((interview) => {
          const application = toOne(interview.applications);
          const candidate = toOne(application?.candidates);
          const job = toOne(application?.jobs);
          const title =
            job?.job_translations.find((tr) => tr.locale === "pt")?.title ??
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
                  {statusLabel(dict, interview.status)}
                </Badge>
              </div>
              {evaluation && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{te.communication}: {evaluation.communication}</span>
                  <span>{te.technicalDepth}: {evaluation.technical_depth}</span>
                  <span>{te.problemSolving}: {evaluation.problem_solving}</span>
                  <span>{te.culturalFit}: {evaluation.cultural_fit}</span>
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
                {t.viewInJob}
              </Link>
            </Card>
          );
        })}
      </ul>
    </>
  );
}
