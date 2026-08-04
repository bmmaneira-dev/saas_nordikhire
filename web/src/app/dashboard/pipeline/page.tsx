import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { toOne } from "@/lib/to-one";
import { Card } from "@/components/ui/card";

const COLUMNS = [
  { key: "received", label: "Recebidos", statuses: ["received", "screening", "scored"] },
  { key: "shortlisted", label: "Pré-selecionados", statuses: ["shortlisted"] },
  { key: "test", label: "Em avaliação", statuses: ["test"] },
  { key: "interview", label: "Entrevistas", statuses: ["interview"] },
  { key: "offer", label: "Oferta", statuses: ["offer"] },
  { key: "hired", label: "Contratados", statuses: ["hired"] },
  { key: "rejected", label: "Rejeitados", statuses: ["rejected", "withdrawn"] },
] as const;

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const { job: jobFilter } = await searchParams;

  const admin = createAdminClient();

  const { data: jobs } = await admin
    .from("jobs")
    .select("id, job_translations(title, locale)")
    .eq("company_id", appUser.company_id)
    .order("created_at", { ascending: false });

  let query = admin
    .from("applications")
    .select(
      "id, status, score_total, job_id, candidates(id, full_name), jobs(job_translations(title, locale))"
    )
    .eq("company_id", appUser.company_id);

  if (jobFilter) {
    query = query.eq("job_id", jobFilter);
  }

  const { data: applications } = await query.order("score_total", {
    ascending: false,
    nullsFirst: false,
  });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Vista visual do processo de recrutamento, por etapa.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/dashboard/pipeline"
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            !jobFilter
              ? "border-primary bg-primary text-primary-foreground"
              : "border-surface-border text-muted-foreground hover:text-foreground"
          }`}
        >
          Todas as vagas
        </Link>
        {jobs?.map((job) => {
          const title =
            job.job_translations.find((t) => t.locale === "pt")?.title ??
            job.job_translations[0]?.title;
          return (
            <Link
              key={job.id}
              href={`/dashboard/pipeline?job=${job.id}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                jobFilter === job.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-surface-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {title}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const items = (applications ?? []).filter((a) =>
            (column.statuses as readonly string[]).includes(a.status)
          );
          return (
            <div key={column.key} className="w-64 shrink-0">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {column.label}
                </p>
                <span className="text-xs text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {items.map((application) => {
                  const candidate = toOne(application.candidates);
                  const job = toOne(application.jobs);
                  const title =
                    job?.job_translations.find((t) => t.locale === "pt")
                      ?.title ?? job?.job_translations[0]?.title;
                  return (
                    <Link
                      key={application.id}
                      href={`/dashboard/jobs/${application.job_id}#candidate-${application.id}`}
                    >
                      <Card className="px-3 py-2.5 transition-colors hover:bg-surface-muted">
                        <p className="text-sm font-medium text-foreground">
                          {candidate?.full_name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {title}
                        </p>
                        {application.score_total != null && (
                          <p className="mt-1 text-xs font-semibold text-primary">
                            {Math.round(application.score_total)}
                          </p>
                        )}
                      </Card>
                    </Link>
                  );
                })}
                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-surface-border px-3 py-6 text-center text-xs text-muted-foreground">
                    Vazio
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
