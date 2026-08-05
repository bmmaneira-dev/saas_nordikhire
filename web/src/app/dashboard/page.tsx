import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { toOne } from "@/lib/to-one";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getOnboardingSteps } from "@/lib/onboarding";
import { markIntegrationsReviewed } from "./settings/actions";
import { Card } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

export default async function DashboardPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const company = toOne(appUser.companies);
  const dict = await getDictionary(toLocale(company?.default_locale));
  const t = dict.dashboardHome;

  const admin = createAdminClient();

  const [
    activeJobsResult,
    pendingApplicationsResult,
    inProgressInterviewsResult,
    highRedFlagsResult,
    recentApplicationsResult,
    upcomingInterviewsResult,
  ] = await Promise.all([
    admin
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("company_id", appUser.company_id)
      .eq("status", "open"),
    admin
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("company_id", appUser.company_id)
      .in("status", ["received", "screening", "scored"]),
    admin
      .from("ai_interviews")
      .select("id, applications!inner(company_id)", { count: "exact", head: true })
      .eq("applications.company_id", appUser.company_id)
      .eq("status", "scheduled"),
    admin
      .from("red_flags")
      .select("id, applications!inner(company_id, status)", {
        count: "exact",
        head: true,
      })
      .eq("applications.company_id", appUser.company_id)
      .eq("severity", "high")
      .not("applications.status", "in", "(hired,rejected,withdrawn)"),
    admin
      .from("applications")
      .select(
        "id, status, applied_at, candidates(full_name), jobs(job_translations(title, locale))"
      )
      .eq("company_id", appUser.company_id)
      .order("applied_at", { ascending: false })
      .limit(5),
    admin
      .from("ai_interviews")
      .select(
        "id, status, scheduled_at, applications!inner(company_id, candidates(full_name), jobs(job_translations(title, locale)))"
      )
      .eq("applications.company_id", appUser.company_id)
      .eq("status", "scheduled")
      .order("scheduled_at", { ascending: false })
      .limit(5),
  ]);

  const onboardingSteps = await getOnboardingSteps(admin, appUser.company_id);
  const doneCount = onboardingSteps.filter((s) => s.done).length;
  const allDone = doneCount === onboardingSteps.length;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label={t.activeJobs} value={activeJobsResult.count ?? 0} />
        <Kpi
          label={t.pendingApplications}
          value={pendingApplicationsResult.count ?? 0}
        />
        <Kpi
          label={t.interviewsInProgress}
          value={inProgressInterviewsResult.count ?? 0}
        />
        <Kpi
          label={t.highRedFlags}
          value={highRedFlagsResult.count ?? 0}
        />
      </div>

      {!allDone && (
        <Card className="mt-8 px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">{t.firstSteps}</h2>
            <span className="text-sm text-muted-foreground">
              {doneCount} de {onboardingSteps.length}
            </span>
          </div>
          <ul className="mt-4 flex flex-col gap-4">
            {onboardingSteps.map((step) => (
              <li key={step.key} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                    step.done
                      ? "bg-success-bg text-success"
                      : "border border-surface-border text-muted-foreground"
                  }`}
                >
                  {step.done ? "✓" : ""}
                </span>
                <div className="flex-1">
                  <Link
                    href={step.href}
                    className={
                      step.done
                        ? "text-sm text-muted-foreground line-through"
                        : "text-sm font-medium text-foreground underline"
                    }
                  >
                    {step.label}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {step.key === "integrations_reviewed" && !step.done && (
                  <form action={markIntegrationsReviewed}>
                    <Button type="submit" variant="ghost" size="sm">
                      {t.markAsDone}
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-medium">{t.recentActivity}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {(recentApplicationsResult.data?.length ?? 0) === 0 && (
              <Card className="border-dashed px-4 py-6 text-center text-sm text-muted-foreground shadow-none">
                {t.noRecentActivity}
              </Card>
            )}
            {recentApplicationsResult.data?.map((application) => {
              const candidate = toOne(application.candidates);
              const job = toOne(application.jobs);
              const title =
                job?.job_translations.find((tr) => tr.locale === "pt")?.title ??
                job?.job_translations[0]?.title;
              return (
                <Card key={application.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm">
                      <span className="font-medium">{candidate?.full_name}</span>{" "}
                      {t.appliedTo}{" "}
                      <span className="font-medium">{title}</span>
                    </p>
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
          <h2 className="text-lg font-medium">{t.interviewsInProgressSection}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {(upcomingInterviewsResult.data?.length ?? 0) === 0 && (
              <Card className="border-dashed px-4 py-6 text-center text-sm text-muted-foreground shadow-none">
                {t.noInterviewsInProgress}
              </Card>
            )}
            {upcomingInterviewsResult.data?.map((interview) => {
              const application = toOne(interview.applications);
              const candidate = toOne(application?.candidates);
              const job = toOne(application?.jobs);
              const title =
                job?.job_translations.find((tr) => tr.locale === "pt")?.title ??
                job?.job_translations[0]?.title;
              return (
                <Card key={interview.id} className="px-4 py-3">
                  <Link
                    href={`/interview/${interview.id}`}
                    className="text-sm font-medium text-primary underline"
                  >
                    {candidate?.full_name} — {title}
                  </Link>
                </Card>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
