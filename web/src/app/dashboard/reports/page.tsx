import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { toOne } from "@/lib/to-one";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { statusLabel } from "@/lib/i18n/status-label";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

const STATUS_ORDER = [
  "received",
  "screening",
  "scored",
  "shortlisted",
  "interview",
  "test",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
] as const;

const SOURCE_KEYS = {
  site: "sourceSite",
  link: "sourceLink",
  qrcode: "sourceQrcode",
  whatsapp: "sourceWhatsapp",
  telegram: "sourceTelegram",
} as const satisfies Record<string, keyof Dictionary["reports"]>;

function sourceLabel(dict: Dictionary, source: string): string {
  const key = SOURCE_KEYS[source as keyof typeof SOURCE_KEYS];
  return key ? dict.reports[key] : source;
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

export default async function ReportsPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const company = toOne(appUser.companies);
  const dict = await getDictionary(toLocale(company?.default_locale));
  const t = dict.reports;

  const admin = createAdminClient();

  const { data: applications } = await admin
    .from("applications")
    .select(
      "id, status, score_total, applied_at, stage_updated_at, source, job_id, jobs(job_translations(title, locale))"
    )
    .eq("company_id", appUser.company_id);

  const rows = applications ?? [];
  const total = rows.length;
  const hired = rows.filter((r) => r.status === "hired");
  const hireRate = total > 0 ? (hired.length / total) * 100 : 0;

  const timeToHireDays = hired
    .map((r) => {
      const applied = new Date(r.applied_at).getTime();
      const done = new Date(r.stage_updated_at).getTime();
      return (done - applied) / (1000 * 60 * 60 * 24);
    })
    .filter((days) => Number.isFinite(days) && days >= 0);
  const avgTimeToHire =
    timeToHireDays.length > 0
      ? timeToHireDays.reduce((a, b) => a + b, 0) / timeToHireDays.length
      : null;

  const funnel = STATUS_ORDER.map((status) => ({
    status,
    count: rows.filter((r) => r.status === status).length,
  }));

  const bySource = new Map<string, number>();
  for (const row of rows) {
    bySource.set(row.source, (bySource.get(row.source) ?? 0) + 1);
  }

  const byJob = new Map<
    string,
    { title: string; total: number; hired: number; scoreSum: number; scoreCount: number }
  >();
  for (const row of rows) {
    const job = toOne(row.jobs);
    const title =
      job?.job_translations.find((tr) => tr.locale === "pt")?.title ??
      job?.job_translations[0]?.title ??
      "—";
    let entry = byJob.get(row.job_id);
    if (!entry) {
      entry = { title, total: 0, hired: 0, scoreSum: 0, scoreCount: 0 };
      byJob.set(row.job_id, entry);
    }
    entry.total += 1;
    if (row.status === "hired") entry.hired += 1;
    if (row.score_total != null) {
      entry.scoreSum += row.score_total;
      entry.scoreCount += 1;
    }
  }
  const jobPerformance = [...byJob.values()].sort((a, b) => b.total - a.total);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <ButtonLink href="/dashboard/reports/export" variant="secondary" size="sm">
          {t.exportCsv}
        </ButtonLink>
      </div>

      {total === 0 ? (
        <Card className="mt-6 border-dashed px-6 py-10 text-center text-sm text-muted-foreground shadow-none">
          {t.empty}
        </Card>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi
              label={t.kpiAvgTimeToHire}
              value={avgTimeToHire != null ? avgTimeToHire.toFixed(1) : "—"}
            />
            <Kpi label={t.kpiHireRate} value={`${hireRate.toFixed(0)}%`} />
            <Kpi label={t.kpiTotalApplications} value={String(total)} />
            <Kpi label={t.kpiTotalHired} value={String(hired.length)} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="text-lg font-medium">{t.funnelHeading}</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {funnel.map(({ status, count }) => (
                  <li key={status} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-sm text-foreground">
                      {statusLabel(dict, status)}
                    </span>
                    <Bar pct={total > 0 ? (count / total) * 100 : 0} />
                    <span className="w-8 shrink-0 text-right text-sm text-muted-foreground">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium">{t.sourceHeading}</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {[...bySource.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([source, count]) => (
                    <li key={source} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-sm text-foreground">
                        {sourceLabel(dict, source)}
                      </span>
                      <Bar pct={total > 0 ? (count / total) * 100 : 0} />
                      <span className="w-8 shrink-0 text-right text-sm text-muted-foreground">
                        {count}
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-medium">{t.jobPerformanceHeading}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">
                      {t.jobPerformanceJob}
                    </th>
                    <th className="py-2 pr-4 font-medium">
                      {t.jobPerformanceApplications}
                    </th>
                    <th className="py-2 pr-4 font-medium">
                      {t.jobPerformanceHired}
                    </th>
                    <th className="py-2 pr-4 font-medium">
                      {t.jobPerformanceAvgScore}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jobPerformance.map((job) => (
                    <tr key={job.title} className="border-t border-surface-border">
                      <td className="py-2 pr-4 text-foreground">{job.title}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {job.total}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {job.hired}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {job.scoreCount > 0
                          ? Math.round(job.scoreSum / job.scoreCount)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
