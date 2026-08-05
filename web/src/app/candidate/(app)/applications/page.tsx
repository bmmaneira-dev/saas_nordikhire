import { redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { toOne } from "@/lib/to-one";
import { toLocale, toDateLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { statusLabel } from "@/lib/i18n/status-label";
import { withdrawApplication } from "./actions";
import { Card } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FeedbackRow {
  content: string;
  feedback_type: string | null;
  created_at: string;
}

const TERMINAL_STATUSES = ["hired", "rejected", "withdrawn"];
const VIDEO_BUCKET = "application-videos";

export default async function CandidateApplicationsPage() {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const locale = toLocale(candidate.preferred_locale);
  const dict = await getDictionary(locale);
  const t = dict.candidateApplications;
  const dateLocale = toDateLocale(locale);

  const admin = createAdminClient();
  const { data: applications } = await admin
    .from("applications")
    .select(
      "id, status, applied_at, stage_updated_at, video_url, jobs(job_translations(title, locale), companies(name)), candidate_feedback(content, feedback_type, created_at)"
    )
    .eq("candidate_id", candidate.id)
    .order("applied_at", { ascending: false });

  const videoPaths = (applications ?? [])
    .map((a) => a.video_url)
    .filter((p): p is string => Boolean(p));
  const videoUrlMap = new Map<string, string>();
  if (videoPaths.length > 0) {
    const { data: signedUrls } = await admin.storage
      .from(VIDEO_BUCKET)
      .createSignedUrls(videoPaths, 3600);
    signedUrls?.forEach((s) => {
      if (s.signedUrl) videoUrlMap.set(s.path ?? "", s.signedUrl);
    });
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.subtitle}
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {(applications?.length ?? 0) === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            {t.noApplications}
          </Card>
        )}
        {applications?.map((application) => {
          const job = toOne(application.jobs);
          const translation =
            job?.job_translations.find((tr) => tr.locale === "pt") ??
            job?.job_translations[0];
          const company = toOne(job?.companies);
          const feedbackRows: FeedbackRow[] = Array.isArray(
            application.candidate_feedback
          )
            ? application.candidate_feedback
            : application.candidate_feedback
              ? [application.candidate_feedback]
              : [];
          const feedbackHistory = [...feedbackRows].sort((a, b) =>
            a.created_at < b.created_at ? 1 : -1
          );
          const isTerminal = TERMINAL_STATUSES.includes(application.status);

          return (
            <Card key={application.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{translation?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {company?.name}
                  </p>
                </div>
                <Badge variant={statusVariant(application.status)}>
                  {statusLabel(dict, application.status)}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t.appliedOn}{" "}
                {new Date(application.applied_at).toLocaleDateString(dateLocale)}
                {application.stage_updated_at &&
                  ` · ${t.lastUpdateOn} ${new Date(
                    application.stage_updated_at
                  ).toLocaleDateString(dateLocale)}`}
              </p>

              {application.video_url && videoUrlMap.get(application.video_url) && (
                <div className="mt-3 border-t border-surface-border pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t.yourPresentationVideo}
                  </p>
                  <video
                    controls
                    src={videoUrlMap.get(application.video_url)}
                    className="mt-2 w-full max-w-sm rounded-lg"
                  />
                </div>
              )}

              {feedbackHistory.length > 0 && (
                <div className="mt-3 border-t border-surface-border pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t.companyFeedback}
                  </p>
                  <ul className="mt-1 flex flex-col gap-1.5">
                    {feedbackHistory.map((fb, i) => (
                      <li key={i} className="text-sm text-foreground/90">
                        {fb.content}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!isTerminal && (
                <div className="mt-3 border-t border-surface-border pt-3">
                  <form action={withdrawApplication.bind(null, application.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      {t.withdrawApplication}
                    </Button>
                  </form>
                </div>
              )}
            </Card>
          );
        })}
      </ul>
    </>
  );
}
