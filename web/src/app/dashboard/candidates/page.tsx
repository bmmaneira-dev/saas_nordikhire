import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { toOne } from "@/lib/to-one";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { statusLabel } from "@/lib/i18n/status-label";
import { Card } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

interface CandidateSummary {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  applicationCount: number;
  bestScore: number | null;
  latestStatus: string;
}

export default async function CandidatesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const company = toOne(appUser.companies);
  const dict = await getDictionary(toLocale(company?.default_locale));
  const t = dict.candidatesList;

  const { q } = await searchParams;

  const admin = createAdminClient();
  let query = admin
    .from("applications")
    .select(
      "id, status, score_total, applied_at, candidates!inner(id, full_name, email, phone)"
    )
    .eq("company_id", appUser.company_id)
    .order("applied_at", { ascending: false });

  if (q?.trim()) {
    query = query.or(
      `full_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`,
      { foreignTable: "candidates" }
    );
  }

  const { data: applications } = await query;

  const byCandidate = new Map<string, CandidateSummary>();
  for (const application of applications ?? []) {
    const candidate = toOne(application.candidates);
    if (!candidate) continue;
    const existing = byCandidate.get(candidate.id);
    if (!existing) {
      byCandidate.set(candidate.id, {
        id: candidate.id,
        full_name: candidate.full_name,
        email: candidate.email,
        phone: candidate.phone,
        applicationCount: 1,
        bestScore: application.score_total,
        latestStatus: application.status,
      });
    } else {
      existing.applicationCount += 1;
      if (
        application.score_total != null &&
        (existing.bestScore == null || application.score_total > existing.bestScore)
      ) {
        existing.bestScore = application.score_total;
      }
    }
  }
  const candidates = [...byCandidate.values()];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>

      <form action="/dashboard/candidates" className="mt-6 flex max-w-sm gap-2">
        <Input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder={t.searchPlaceholder}
        />
        <Button type="submit" variant="secondary" size="sm">
          {t.search}
        </Button>
      </form>

      <ul className="mt-6 flex flex-col gap-3">
        {candidates.length === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            {t.noCandidatesFound}
          </Card>
        )}
        {candidates.map((candidate) => (
          <Card key={candidate.id} className="px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Link
                  href={`/dashboard/candidates/${candidate.id}`}
                  className="font-medium text-primary underline"
                >
                  {candidate.full_name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {candidate.email}
                  {candidate.phone ? ` · ${candidate.phone}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                {candidate.bestScore != null && (
                  <span className="text-lg font-semibold text-primary">
                    {Math.round(candidate.bestScore)}
                  </span>
                )}
                <div className="mt-1">
                  <Badge variant={statusVariant(candidate.latestStatus)}>
                    {statusLabel(dict, candidate.latestStatus)}
                  </Badge>
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {candidate.applicationCount} {t.applicationsCount}
            </p>
          </Card>
        ))}
      </ul>
    </>
  );
}
