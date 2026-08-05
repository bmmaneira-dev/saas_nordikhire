import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SectionFeedback } from "@/lib/profile-optimization";
import { Card } from "@/components/ui/card";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function OptimizationResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const dict = await getDictionary(toLocale(candidate.preferred_locale));
  const t = dict.candidateOptimizeResult;
  const tn = dict.candidateOptimizeNew;
  const SOURCE_LABELS: Record<string, string> = {
    linkedin: tn.sourceLinkedin,
    cv: tn.sourceCv,
    other_platform: tn.sourceOtherPlatform,
  };

  const admin = createAdminClient();
  const { data: optimization } = await admin
    .from("candidate_profile_optimizations")
    .select(
      "id, candidate_id, source_type, source_label, overall_score, overall_summary, strengths, weaknesses, section_feedback, generated_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (!optimization || optimization.candidate_id !== candidate.id) notFound();

  const sectionFeedback = (optimization.section_feedback ??
    []) as SectionFeedback[];
  const strengths = (optimization.strengths ?? []) as string[];
  const weaknesses = (optimization.weaknesses ?? []) as string[];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
        <Link
          href="/candidate/development"
          className="text-sm text-muted-foreground underline"
        >
          {t.back}
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">
          {optimization.source_label ||
            SOURCE_LABELS[optimization.source_type] ||
            optimization.source_type}
        </p>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.profileStrength}
          </h1>
          {optimization.overall_score != null && (
            <span className="text-2xl font-semibold text-primary">
              {Math.round(optimization.overall_score)}
            </span>
          )}
        </div>
        {optimization.overall_summary && (
          <p className="mt-2 text-sm text-foreground/90">
            {optimization.overall_summary}
          </p>
        )}

        {(strengths.length > 0 || weaknesses.length > 0) && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {strengths.length > 0 && (
              <Card className="px-5 py-4">
                <h2 className="text-sm font-medium text-success">{t.strengths}</h2>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm text-foreground/90">
                  {strengths.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </Card>
            )}
            {weaknesses.length > 0 && (
              <Card className="px-5 py-4">
                <h2 className="text-sm font-medium text-warning">{t.weaknesses}</h2>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm text-foreground/90">
                  {weaknesses.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}

        {sectionFeedback.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-medium">{t.sectionSuggestions}</h2>
            <ul className="mt-4 flex flex-col gap-4">
              {sectionFeedback.map((sf, i) => (
                <Card key={i} className="px-5 py-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {sf.section}
                  </p>
                  {sf.current && (
                    <p className="mt-2 text-sm text-muted-foreground line-through">
                      {sf.current}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-foreground">{sf.feedback}</p>
                  {sf.suggested_rewrite && (
                    <div className="mt-3 border-t border-surface-border pt-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-primary">
                        {t.rewriteSuggestion}
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {sf.suggested_rewrite}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </ul>
          </section>
        )}
    </div>
  );
}
