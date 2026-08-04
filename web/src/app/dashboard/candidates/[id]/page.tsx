import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { toOne } from "@/lib/to-one";
import { Card } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";

export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const admin = createAdminClient();

  const { data: applications } = await admin
    .from("applications")
    .select(
      "id, status, score_total, applied_at, job_id, candidates!inner(id, full_name, email, phone), jobs(job_translations(title, locale))"
    )
    .eq("company_id", appUser.company_id)
    .eq("candidate_id", id)
    .order("applied_at", { ascending: false });

  if (!applications || applications.length === 0) notFound();

  const candidate = toOne(applications[0].candidates);

  return (
    <>
      <Link
        href="/dashboard/candidates"
        className="text-sm text-muted-foreground underline"
      >
        ← Voltar aos candidatos
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {candidate?.full_name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {candidate?.email}
        {candidate?.phone ? ` · ${candidate.phone}` : ""}
      </p>

      <h2 className="mt-8 text-lg font-medium">Candidaturas</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {applications.map((application) => {
          const job = toOne(application.jobs);
          const title =
            job?.job_translations.find((t) => t.locale === "pt")?.title ??
            job?.job_translations[0]?.title ??
            "(vaga)";
          return (
            <Card key={application.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{title}</span>
                <div className="flex items-center gap-2">
                  {application.score_total != null && (
                    <span className="font-semibold text-primary">
                      {Math.round(application.score_total)}
                    </span>
                  )}
                  <Badge variant={statusVariant(application.status)}>
                    {application.status}
                  </Badge>
                </div>
              </div>
              <Link
                href={`/dashboard/jobs/${application.job_id}#candidate-${application.id}`}
                className="mt-2 inline-block text-sm font-medium text-primary underline"
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
