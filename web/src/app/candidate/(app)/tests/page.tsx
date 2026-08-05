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

export default async function CandidateTestsIndexPage() {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const dict = await getDictionary(toLocale(candidate.preferred_locale));
  const t = dict.candidateTestsList;

  const admin = createAdminClient();
  const { data: tests } = await admin
    .from("test_assignments")
    .select(
      "id, test_name, status, result_score, assigned_at, applications!inner(candidate_id, jobs(job_translations(title, locale)))"
    )
    .eq("applications.candidate_id", candidate.id)
    .order("assigned_at", { ascending: false });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.subtitle}
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {(tests?.length ?? 0) === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            {t.noTests}
          </Card>
        )}
        {tests?.map((test) => {
          const application = toOne(test.applications);
          const job = toOne(application?.jobs);
          const title =
            job?.job_translations.find((tr) => tr.locale === "pt")?.title ??
            job?.job_translations[0]?.title;
          return (
            <Card key={test.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{test.test_name}</p>
                  <p className="text-sm text-muted-foreground">{title}</p>
                </div>
                <div className="shrink-0 text-right">
                  {test.result_score != null && (
                    <span className="text-lg font-semibold text-primary">
                      {Math.round(test.result_score)}
                    </span>
                  )}
                  <div className="mt-1">
                    <Badge variant={statusVariant(test.status)}>
                      {statusLabel(dict, test.status)}
                    </Badge>
                  </div>
                </div>
              </div>
              <Link
                href={`/candidate/tests/${test.id}`}
                className="mt-2 inline-block text-sm font-medium text-primary underline"
              >
                {test.status === "completed" ? t.viewResult : t.takeTest}
              </Link>
            </Card>
          );
        })}
      </ul>
    </>
  );
}
