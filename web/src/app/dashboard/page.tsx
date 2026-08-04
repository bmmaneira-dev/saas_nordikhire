import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { logout } from "@/app/login/actions";
import { toOne } from "@/lib/to-one";
import { getOnboardingSteps } from "@/lib/onboarding";
import { markIntegrationsReviewed } from "./settings/actions";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";

export default async function DashboardPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const company = toOne(appUser.companies);

  const admin = createAdminClient();
  const { data: jobs } = await admin
    .from("jobs")
    .select(
      "id, status, public_slug, seniority_level, location, work_mode, created_at, job_translations(title, locale)"
    )
    .eq("company_id", appUser.company_id)
    .order("created_at", { ascending: false });

  const onboardingSteps = await getOnboardingSteps(admin, appUser.company_id);
  const doneCount = onboardingSteps.filter((s) => s.done).length;
  const allDone = doneCount === onboardingSteps.length;

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/settings"
            className="text-sm font-medium text-primary underline"
          >
            Empresa
          </Link>
          <Link
            href="/dashboard/billing"
            className="text-sm font-medium text-primary underline"
          >
            Facturação
          </Link>
          <Link
            href="/dashboard/team"
            className="text-sm font-medium text-primary underline"
          >
            Equipa
          </Link>
          <form action={logout}>
            <Button type="submit" variant="secondary" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </PageHeader>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {company?.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ligado como {appUser.full_name} ({appUser.email})
          </p>
        </div>

        {!allDone && (
          <Card className="mt-8 px-6 py-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Primeiros passos</h2>
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
                        Marcar como feito
                      </Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-lg font-medium">Vagas</h2>
          <ButtonLink href="/dashboard/jobs/new" size="sm">
            Nova vaga
          </ButtonLink>
        </div>

        <ul className="mt-4 flex flex-col gap-3">
          {jobs?.length === 0 && (
            <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
              Ainda não tens vagas. Cria a primeira.
            </Card>
          )}
          {jobs?.map((job) => {
            const title =
              job.job_translations.find((t) => t.locale === "pt")?.title ??
              job.job_translations[0]?.title ??
              "(sem título)";
            return (
              <Card key={job.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{title}</span>
                  <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[job.seniority_level, job.location, job.work_mode]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-3 flex gap-5">
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="text-sm font-medium text-primary underline"
                  >
                    Ver candidatos →
                  </Link>
                  {job.status === "open" && job.public_slug && (
                    <Link
                      href={`/jobs/${job.public_slug}`}
                      className="text-sm font-medium text-primary underline"
                      target="_blank"
                    >
                      Ver página pública →
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </ul>
      </main>
    </>
  );
}
