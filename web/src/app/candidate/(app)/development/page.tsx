import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export default async function CandidateDevelopmentPage() {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const dict = await getDictionary(toLocale(candidate.preferred_locale));
  const t = dict.candidateDevelopmentPage;
  const tn = dict.candidateOptimizeNew;
  const SOURCE_LABELS: Record<string, string> = {
    linkedin: tn.sourceLinkedin,
    cv: tn.sourceCv,
    other_platform: tn.sourceOtherPlatform,
  };

  const admin = createAdminClient();
  const { data: optimizations } = await admin
    .from("candidate_profile_optimizations")
    .select("id, source_type, source_label, overall_score, generated_at")
    .eq("candidate_id", candidate.id)
    .order("generated_at", { ascending: false });

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.title}
        </h1>
        <ButtonLink href="/candidate/optimize/new" size="sm">
          {t.newAnalysis}
        </ButtonLink>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.subtitle}
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {(optimizations?.length ?? 0) === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            {t.noAnalyses}
          </Card>
        )}
        {optimizations?.map((optimization) => (
          <Card key={optimization.id} className="px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {optimization.source_label ||
                  SOURCE_LABELS[optimization.source_type] ||
                  optimization.source_type}
              </span>
              {optimization.overall_score != null && (
                <span className="text-lg font-semibold text-primary">
                  {Math.round(optimization.overall_score)}
                </span>
              )}
            </div>
            <Link
              href={`/candidate/optimize/${optimization.id}`}
              className="mt-2 inline-block text-sm font-medium text-primary underline"
            >
              {t.viewAnalysis}
            </Link>
          </Card>
        ))}
      </ul>
    </>
  );
}
