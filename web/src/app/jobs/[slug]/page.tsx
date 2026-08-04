import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { toOne } from "@/lib/to-one";
import { LOCALE_LABELS } from "@/lib/translate-job";
import { ApplyForm } from "./apply-form";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export default async function PublicJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const admin = createAdminClient();

  const { data: job } = await admin
    .from("jobs")
    .select(
      "id, company_id, location, work_mode, seniority_level, salary_range_min, salary_range_max, salary_currency, companies(name), job_translations(title, description, requirements_text, locale)"
    )
    .eq("public_slug", slug)
    .eq("status", "open")
    .maybeSingle();

  if (!job) notFound();

  const company = toOne(job.companies);

  const translation =
    job.job_translations.find((t) => t.locale === lang) ??
    job.job_translations.find((t) => t.locale === "pt") ??
    job.job_translations[0];

  const salary =
    job.salary_range_min || job.salary_range_max
      ? `${job.salary_range_min ?? "?"} - ${job.salary_range_max ?? "?"} ${
          job.salary_currency ?? ""
        }`
      : null;

  return (
    <>
      <PageHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-primary">{company?.name}</p>
          {job.job_translations.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              {job.job_translations.map((t) => (
                <Link
                  key={t.locale}
                  href={`/jobs/${slug}?lang=${t.locale}`}
                  className={
                    t.locale === translation?.locale
                      ? "font-semibold text-primary underline"
                      : "text-muted-foreground underline"
                  }
                >
                  {LOCALE_LABELS[t.locale as keyof typeof LOCALE_LABELS] ?? t.locale}
                </Link>
              ))}
            </div>
          )}
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {translation?.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {[job.seniority_level, job.location, job.work_mode, salary]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {translation?.description && (
          <section className="mt-8">
            <h2 className="text-lg font-medium">Descrição</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
              {translation.description}
            </p>
          </section>
        )}

        {translation?.requirements_text && (
          <section className="mt-6">
            <h2 className="text-lg font-medium">Requisitos</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
              {translation.requirements_text}
            </p>
          </section>
        )}

        <section className="mt-10 border-t border-surface-border pt-8">
          <h2 className="text-lg font-medium">Candidatar-me</h2>
          <Card className="mt-4 p-6">
            <ApplyForm jobId={job.id} companyId={job.company_id} />
          </Card>
        </section>
      </main>
    </>
  );
}
