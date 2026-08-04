import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { Card } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

const TABS = [
  { key: "open", label: "Activas", statuses: ["open"] },
  { key: "draft", label: "Rascunhos", statuses: ["draft"] },
  { key: "closed", label: "Encerradas", statuses: ["closed", "paused"] },
] as const;

export default async function JobsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const { tab: tabParam } = await searchParams;
  const activeTab = TABS.find((t) => t.key === tabParam) ?? TABS[0];

  const admin = createAdminClient();
  const { data: jobs } = await admin
    .from("jobs")
    .select(
      "id, status, public_slug, seniority_level, location, work_mode, created_at, job_translations(title, locale), applications(id)"
    )
    .eq("company_id", appUser.company_id)
    .in("status", activeTab.statuses)
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Vagas</h1>
        <ButtonLink href="/dashboard/jobs/new" size="sm">
          Nova vaga
        </ButtonLink>
      </div>

      <div className="mt-6 flex gap-1 border-b border-surface-border">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/dashboard/jobs?tab=${tab.key}`}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab.key === activeTab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {jobs?.length === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            Nenhuma vaga nesta categoria.
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
                {" · "}
                {job.applications.length} candidatura(s)
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
    </>
  );
}
