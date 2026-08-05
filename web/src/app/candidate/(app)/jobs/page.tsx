import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { toOne } from "@/lib/to-one";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default async function CandidateJobsSearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    location?: string;
    workMode?: string;
    seniority?: string;
  }>;
}) {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const dict = await getDictionary(toLocale(candidate.preferred_locale));
  const t = dict.candidateJobsSearch;

  const { q, location, workMode, seniority } = await searchParams;

  const admin = createAdminClient();
  let query = admin
    .from("jobs")
    .select(
      "id, public_slug, location, work_mode, seniority_level, published_at, job_translations!inner(title, locale), companies(name)"
    )
    .eq("status", "open");

  if (q?.trim()) {
    query = query.ilike("job_translations.title", `%${q.trim()}%`);
  }
  if (location?.trim()) {
    query = query.ilike("location", `%${location.trim()}%`);
  }
  if (workMode) {
    query = query.eq("work_mode", workMode);
  }
  if (seniority) {
    query = query.eq("seniority_level", seniority);
  }

  const { data: jobs } = await query.order("published_at", {
    ascending: false,
  });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.subtitle}
      </p>

      <form
        action="/candidate/jobs"
        className="mt-6 grid gap-3 sm:grid-cols-4"
      >
        <Field label={t.fieldKeyword}>
          <Input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder={t.keywordPlaceholder}
          />
        </Field>
        <Field label={t.fieldLocation}>
          <Input
            type="text"
            name="location"
            defaultValue={location ?? ""}
            placeholder={t.locationPlaceholder}
          />
        </Field>
        <Field label={t.fieldWorkMode}>
          <Select name="workMode" defaultValue={workMode ?? ""}>
            <option value="">{t.allOption}</option>
            <option value="presencial">{t.workModeOnsite}</option>
            <option value="remoto">{t.workModeRemote}</option>
            <option value="híbrido">{t.workModeHybrid}</option>
          </Select>
        </Field>
        <Field label={t.fieldSeniority}>
          <Select name="seniority" defaultValue={seniority ?? ""}>
            <option value="">{t.allOption}</option>
            <option value="junior">{t.seniorityJunior}</option>
            <option value="pleno">{t.seniorityMid}</option>
            <option value="senior">{t.senioritySenior}</option>
            <option value="lead">{t.seniorityLead}</option>
          </Select>
        </Field>
        <div className="sm:col-span-4">
          <Button type="submit" size="sm">
            {t.search}
          </Button>
        </div>
      </form>

      <ul className="mt-6 flex flex-col gap-3">
        {(jobs?.length ?? 0) === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            {t.noJobsFound}
          </Card>
        )}
        {jobs?.map((job) => {
          const translation =
            job.job_translations.find((tr) => tr.locale === "pt") ??
            job.job_translations[0];
          const company = toOne(job.companies);
          return (
            <Link key={job.id} href={`/jobs/${job.public_slug}`}>
              <Card className="px-5 py-4 transition-colors hover:bg-surface-muted">
                <p className="font-medium">{translation?.title}</p>
                <p className="text-sm text-muted-foreground">
                  {company?.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[job.seniority_level, job.location, job.work_mode]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Card>
            </Link>
          );
        })}
      </ul>
    </>
  );
}
