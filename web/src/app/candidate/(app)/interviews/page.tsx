import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { toOne } from "@/lib/to-one";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { statusLabel } from "@/lib/i18n/status-label";
import { Card } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";

export default async function CandidateInterviewsIndexPage() {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const dict = await getDictionary(toLocale(candidate.preferred_locale));
  const t = dict.candidateInterviewsList;

  const admin = createAdminClient();
  const { data: interviews } = await admin
    .from("ai_interviews")
    .select(
      "id, status, ai_summary, scheduled_at, completed_at, applications!inner(candidate_id, jobs(job_translations(title, locale), companies(name)))"
    )
    .eq("applications.candidate_id", candidate.id)
    .order("scheduled_at", { ascending: false });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.subtitle}
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {(interviews?.length ?? 0) === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            {t.noInterviews}
          </Card>
        )}
        {interviews?.map((interview) => {
          const application = toOne(interview.applications);
          const job = toOne(application?.jobs);
          const company = toOne(job?.companies);
          const title =
            job?.job_translations.find((tr) => tr.locale === "pt")?.title ??
            job?.job_translations[0]?.title;
          return (
            <Card key={interview.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">
                    {company?.name}
                  </p>
                </div>
                <Badge variant={statusVariant(interview.status)}>
                  {statusLabel(dict, interview.status)}
                </Badge>
              </div>
              {interview.ai_summary && (
                <p className="mt-2 text-sm text-foreground/90">
                  {interview.ai_summary}
                </p>
              )}
              <Link
                href={`/interview/${interview.id}`}
                className="mt-2 inline-block text-sm font-medium text-primary underline"
              >
                {interview.status === "completed"
                  ? t.viewInterview
                  : t.continueInterview}
              </Link>
            </Card>
          );
        })}
      </ul>
    </>
  );
}
