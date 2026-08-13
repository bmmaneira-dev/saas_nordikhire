import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { toOne } from "@/lib/to-one";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { statusLabel } from "@/lib/i18n/status-label";
import { seniorityLabel } from "@/lib/i18n/seniority-label";
import { Card } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const TERMINAL_STATUSES = new Set(["hired", "rejected", "withdrawn"]);
const SENIORITY_LEVELS = ["junior", "pleno", "senior", "lead"] as const;

interface PoolCandidate {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  applicationCount: number;
  bestScore: number | null;
  latestStatus: string;
  latestSeniority: string | null;
  skills: Set<string>;
}

function extractSkills(parsedData: unknown): string[] {
  if (
    parsedData &&
    typeof parsedData === "object" &&
    Array.isArray((parsedData as { skills?: unknown }).skills)
  ) {
    return (parsedData as { skills: unknown[] }).skills.filter(
      (s): s is string => typeof s === "string"
    );
  }
  return [];
}

export default async function TalentPoolPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string }>;
}) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const company = toOne(appUser.companies);
  const dict = await getDictionary(toLocale(company?.default_locale));
  const t = dict.talentPool;

  const { q, level } = await searchParams;

  const admin = createAdminClient();

  const [{ data: applications }, { data: openJobs }] = await Promise.all([
    admin
      .from("applications")
      .select(
        "id, status, score_total, applied_at, candidates!inner(id, full_name, email, phone), jobs(seniority_level), cv_extractions(parsed_data)"
      )
      .eq("company_id", appUser.company_id)
      .order("applied_at", { ascending: false }),
    admin
      .from("jobs")
      .select("id, skills_required, job_translations(title, locale)")
      .eq("company_id", appUser.company_id)
      .eq("status", "open"),
  ]);

  const byCandidate = new Map<string, PoolCandidate>();
  for (const application of applications ?? []) {
    const candidate = toOne(application.candidates);
    if (!candidate) continue;
    const job = toOne(application.jobs);
    const extraction = toOne(application.cv_extractions);
    const skills = extractSkills(extraction?.parsed_data);

    let entry = byCandidate.get(candidate.id);
    if (!entry) {
      entry = {
        id: candidate.id,
        full_name: candidate.full_name,
        email: candidate.email,
        phone: candidate.phone,
        applicationCount: 0,
        bestScore: null,
        latestStatus: application.status,
        latestSeniority: job?.seniority_level ?? null,
        skills: new Set(),
      };
      byCandidate.set(candidate.id, entry);
    }
    entry.applicationCount += 1;
    if (
      application.score_total != null &&
      (entry.bestScore == null || application.score_total > entry.bestScore)
    ) {
      entry.bestScore = application.score_total;
    }
    for (const skill of skills) entry.skills.add(skill.toLowerCase());
  }

  let pool = [...byCandidate.values()].filter((c) =>
    TERMINAL_STATUSES.has(c.latestStatus)
  );

  if (level) {
    pool = pool.filter((c) => c.latestSeniority === level);
  }
  if (q?.trim()) {
    const needle = q.trim().toLowerCase();
    pool = pool.filter(
      (c) =>
        c.full_name.toLowerCase().includes(needle) ||
        c.email?.toLowerCase().includes(needle) ||
        [...c.skills].some((s) => s.includes(needle))
    );
  }

  const recommendations = (openJobs ?? [])
    .map((job) => {
      const title =
        job.job_translations.find((tr) => tr.locale === "pt")?.title ??
        job.job_translations[0]?.title ??
        "";
      const required = Array.isArray(job.skills_required)
        ? (job.skills_required as string[]).map((s) => s.toLowerCase())
        : [];
      const matches = [...byCandidate.values()]
        .filter((c) => TERMINAL_STATUSES.has(c.latestStatus))
        .map((c) => ({
          candidate: c,
          overlap: required.filter((skill) => c.skills.has(skill)).length,
        }))
        .filter((m) => m.overlap > 0)
        .sort((a, b) => b.overlap - a.overlap)
        .slice(0, 3);
      return { id: job.id, title, matches };
    })
    .filter((job) => job.matches.length > 0);

  function levelHref(nextLevel?: string) {
    const params = new URLSearchParams();
    if (q?.trim()) params.set("q", q.trim());
    if (nextLevel) params.set("level", nextLevel);
    const qs = params.toString();
    return qs ? `/dashboard/talent-pool?${qs}` : "/dashboard/talent-pool";
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>

      <form
        action="/dashboard/talent-pool"
        className="mt-6 flex max-w-sm gap-2"
      >
        {level && <input type="hidden" name="level" value={level} />}
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

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={levelHref()}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            !level
              ? "border-primary bg-primary text-primary-foreground"
              : "border-surface-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.allLevels}
        </Link>
        {SENIORITY_LEVELS.map((lvl) => (
          <Link
            key={lvl}
            href={levelHref(lvl)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              level === lvl
                ? "border-primary bg-primary text-primary-foreground"
                : "border-surface-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {seniorityLabel(dict, lvl)}
          </Link>
        ))}
      </div>

      {recommendations.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-medium">{t.recommendedHeading}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.recommendedSubtitle}
          </p>
          <div className="mt-4 flex flex-col gap-4">
            {recommendations.map((job) => (
              <div key={job.id}>
                <p className="text-sm font-medium text-foreground">
                  {t.recommendedFor}{" "}
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="text-primary underline"
                  >
                    {job.title}
                  </Link>
                </p>
                <ul className="mt-2 flex flex-col gap-2">
                  {job.matches.map(({ candidate, overlap }) => (
                    <Card
                      key={candidate.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <Link
                        href={`/dashboard/candidates/${candidate.id}`}
                        className="text-sm font-medium text-primary underline"
                      >
                        {candidate.full_name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {overlap} {t.matchedSkillsSuffix}
                      </span>
                    </Card>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <ul className="mt-8 flex flex-col gap-3">
        {pool.length === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            {byCandidate.size === 0 ? t.empty : t.noResults}
          </Card>
        )}
        {pool.map((candidate) => (
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
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {seniorityLabel(dict, candidate.latestSeniority)} ·{" "}
                {candidate.applicationCount} {t.applicationsSuffix}
              </span>
            </div>
            {candidate.skills.size > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...candidate.skills].slice(0, 8).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </ul>
    </>
  );
}
