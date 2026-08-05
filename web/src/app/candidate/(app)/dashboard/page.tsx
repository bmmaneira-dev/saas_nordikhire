import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { toOne } from "@/lib/to-one";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Card } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

export default async function CandidateDashboardPage() {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const dict = await getDictionary(toLocale(candidate.preferred_locale));
  const t = dict.candidateDashboardHome;

  const admin = createAdminClient();

  const [
    activeApplicationsResult,
    pendingTestsResult,
    interviewsResult,
    feedbackResult,
    recentApplicationsResult,
    openJobsResult,
  ] = await Promise.all([
    admin
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", candidate.id)
      .not("status", "in", "(hired,rejected,withdrawn)"),
    admin
      .from("test_assignments")
      .select("id, applications!inner(candidate_id)", {
        count: "exact",
        head: true,
      })
      .eq("applications.candidate_id", candidate.id)
      .in("status", ["assigned", "in_progress"]),
    admin
      .from("ai_interviews")
      .select("id, applications!inner(candidate_id)", {
        count: "exact",
        head: true,
      })
      .eq("applications.candidate_id", candidate.id),
    admin
      .from("candidate_feedback")
      .select("id, applications!inner(candidate_id)", {
        count: "exact",
        head: true,
      })
      .eq("applications.candidate_id", candidate.id),
    admin
      .from("applications")
      .select(
        "id, status, applied_at, jobs(job_translations(title, locale), companies(name))"
      )
      .eq("candidate_id", candidate.id)
      .order("applied_at", { ascending: false })
      .limit(3),
    admin
      .from("jobs")
      .select("id, public_slug, job_translations(title, locale), companies(name)")
      .eq("status", "open")
      .order("published_at", { ascending: false })
      .limit(3),
  ]);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t.greeting} {candidate.full_name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label={t.activeApplications} value={activeApplicationsResult.count ?? 0} />
        <Kpi label={t.pendingTests} value={pendingTestsResult.count ?? 0} />
        <Kpi label={t.interviews} value={interviewsResult.count ?? 0} />
        <Kpi label={t.feedbackReceived} value={feedbackResult.count ?? 0} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">{t.recentApplications}</h2>
            <Link
              href="/candidate/applications"
              className="text-sm font-medium text-primary underline"
            >
              {t.viewAll}
            </Link>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {(recentApplicationsResult.data?.length ?? 0) === 0 && (
              <Card className="border-dashed px-4 py-6 text-center text-sm text-muted-foreground shadow-none">
                {t.noApplicationsYet}
              </Card>
            )}
            {recentApplicationsResult.data?.map((application) => {
              const job = toOne(application.jobs);
              const translation =
                job?.job_translations.find((t) => t.locale === "pt") ??
                job?.job_translations[0];
              const company = toOne(job?.companies);
              return (
                <Card key={application.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{translation?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {company?.name}
                      </p>
                    </div>
                    <Badge variant={statusVariant(application.status)}>
                      {application.status}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </ul>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">{t.recentJobs}</h2>
            <Link
              href="/candidate/jobs"
              className="text-sm font-medium text-primary underline"
            >
              {t.exploreJobs}
            </Link>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {(openJobsResult.data?.length ?? 0) === 0 && (
              <Card className="border-dashed px-4 py-6 text-center text-sm text-muted-foreground shadow-none">
                {t.noOpenJobs}
              </Card>
            )}
            {openJobsResult.data?.map((job) => {
              const translation =
                job.job_translations.find((t) => t.locale === "pt") ??
                job.job_translations[0];
              const company = toOne(job.companies);
              return (
                <Link key={job.id} href={`/jobs/${job.public_slug}`}>
                  <Card className="px-4 py-3 transition-colors hover:bg-surface-muted">
                    <p className="text-sm font-medium">{translation?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {company?.name}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
