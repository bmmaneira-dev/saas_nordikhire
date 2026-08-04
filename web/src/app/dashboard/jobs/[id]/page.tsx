import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { toOne } from "@/lib/to-one";
import { startInterview } from "@/app/interview/actions";
import {
  advanceApplication,
  rejectApplication,
  sendFeedback,
  assignTest,
  translateJob,
} from "./actions";
import { SUPPORTED_LOCALES, LOCALE_LABELS } from "@/lib/translate-job";
import {
  TEST_CATEGORY_LABELS,
  PSYCHOMETRIC_DISCLAIMER,
  RECOMMENDATION_LABELS,
  type TestRecommendation,
} from "@/lib/skill-tests";
import { Card } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { FeedbackComposer } from "./feedback-composer";
import { ReportSection } from "./report-section";
import { SourcedCvUpload } from "./sourced-cv-upload";
import { SharePanel } from "./share-panel";

const STAGE_ORDER = [
  "received",
  "screening",
  "scored",
  "shortlisted",
  "interview",
  "test",
  "offer",
  "hired",
];
const STAGE_LABELS: Record<string, string> = {
  shortlisted: "Pré-selecionado",
  interview: "Entrevista",
  test: "Teste",
  offer: "Oferta",
  hired: "Contratado",
};
const TERMINAL_STATUSES = ["hired", "rejected", "withdrawn"];
const VIDEO_BUCKET = "application-videos";

function nextStageLabel(current: string): string | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) return null;
  const shortlistedIdx = STAGE_ORDER.indexOf("shortlisted");
  const next = idx < shortlistedIdx ? "shortlisted" : STAGE_ORDER[idx + 1];
  return STAGE_LABELS[next] ?? next;
}

interface FeedbackRow {
  feedback_type: string | null;
  content: string;
  sent_at: string | null;
  created_at: string;
}

interface ScoringRow {
  overall_score: number;
  breakdown: {
    skills_match?: number;
    experience_match?: number;
    education_match?: number;
    language_match?: number;
  } | null;
  ai_reasoning: string | null;
  created_at: string;
}

interface InterviewRow {
  id: string;
  status: string;
  created_at: string;
}

interface RedFlagRow {
  flag_type: string;
  severity: "low" | "medium" | "high";
  description: string | null;
}

const SEVERITY_VARIANT: Record<RedFlagRow["severity"], "info" | "warning" | "danger"> = {
  low: "info",
  medium: "warning",
  high: "danger",
};

interface QuestionFeedbackRow {
  question: string;
  answer: string;
  feedback: string;
  score: number;
}

interface TestAssignmentRow {
  id: string;
  test_name: string | null;
  status: string;
  result_score: number | null;
  result_raw: {
    category?: "technical" | "behavioral" | "psychometric";
    questions?: string[];
    overall_summary?: string;
    per_question?: QuestionFeedbackRow[];
    recommendation?: TestRecommendation;
    recommendation_reason?: string;
  } | null;
  assigned_at: string;
}

const RECOMMENDATION_VARIANT: Record<TestRecommendation, "success" | "warning" | "danger" | "neutral"> = {
  advance: "success",
  caution: "warning",
  reject: "danger",
  not_applicable: "neutral",
};

interface TrainingRecommendationRow {
  gap: string;
  suggested_topic: string;
  resource_type: string;
}

interface DevReportRow {
  strengths: string[] | null;
  technical_gaps: string[] | null;
  behavioral_gaps: string[] | null;
  training_recommendations: TrainingRecommendationRow[] | null;
  overall_summary: string | null;
  generated_at: string;
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const admin = createAdminClient();

  const { data: job } = await admin
    .from("jobs")
    .select(
      "id, status, public_slug, job_translations(title, locale, is_machine_translated)"
    )
    .eq("id", id)
    .eq("company_id", appUser.company_id)
    .maybeSingle();

  if (!job) notFound();

  const translation =
    job.job_translations.find(
      (t: { locale: string }) => t.locale === "pt"
    ) ?? job.job_translations[0];

  const { data: applications } = await admin
    .from("applications")
    .select(
      "id, status, score_total, applied_at, video_url, candidates(full_name, email, phone), scoring_results(overall_score, breakdown, ai_reasoning, created_at), ai_interviews(id, status, created_at), candidate_feedback(feedback_type, content, sent_at, created_at), red_flags(flag_type, severity, description), test_assignments(id, test_name, status, result_score, result_raw, assigned_at), candidate_development_reports(strengths, technical_gaps, behavioral_gaps, training_recommendations, overall_summary, generated_at)"
    )
    .eq("job_id", id)
    .order("score_total", { ascending: false, nullsFirst: false });

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

  const summaryRows = (applications ?? []).map((application) => {
    const candidate = toOne(application.candidates);

    const interviewRows: InterviewRow[] = Array.isArray(application.ai_interviews)
      ? application.ai_interviews
      : application.ai_interviews
        ? [application.ai_interviews as InterviewRow]
        : [];
    const interview = [...interviewRows].sort((a, b) =>
      a.created_at < b.created_at ? 1 : -1
    )[0];

    const redFlagRows: RedFlagRow[] = Array.isArray(application.red_flags)
      ? application.red_flags
      : application.red_flags
        ? [application.red_flags as RedFlagRow]
        : [];

    const testRows: TestAssignmentRow[] = Array.isArray(application.test_assignments)
      ? application.test_assignments
      : application.test_assignments
        ? [application.test_assignments as TestAssignmentRow]
        : [];
    const bestTestScore = testRows.reduce<number | null>((best, t) => {
      if (t.result_score == null) return best;
      return best == null ? t.result_score : Math.max(best, t.result_score);
    }, null);

    return {
      id: application.id,
      name: candidate?.full_name ?? "-",
      score: application.score_total,
      status: application.status,
      interviewStatus: interview?.status ?? null,
      bestTestScore,
      redFlagCount: redFlagRows.length,
      highRedFlagCount: redFlagRows.filter((f) => f.severity === "high").length,
    };
  });

  return (
      <div className="mx-auto flex w-full max-w-3xl flex-col">
        <Link
          href="/dashboard/jobs"
          className="text-sm text-muted-foreground underline"
        >
          ← Voltar às vagas
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {translation?.title}
          </h1>
          {job.public_slug && (
            <Link
              href={`/jobs/${job.public_slug}`}
              target="_blank"
              className="text-sm font-medium text-primary underline"
            >
              Ver página pública →
            </Link>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {applications?.length ?? 0} candidatura(s)
        </p>

        {job.public_slug && (
          <SharePanel slug={job.public_slug} jobTitle={translation?.title ?? ""} />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {job.job_translations.map(
            (t: { locale: string; is_machine_translated: boolean | null }) => (
              <Badge key={t.locale} variant={t.locale === "pt" ? "info" : "neutral"}>
                {LOCALE_LABELS[t.locale as keyof typeof LOCALE_LABELS] ?? t.locale}
                {t.is_machine_translated ? " · IA" : ""}
              </Badge>
            )
          )}
          {SUPPORTED_LOCALES.some(
            (locale) =>
              !job.job_translations.some(
                (t: { locale: string }) => t.locale === locale
              )
          ) && (
            <details>
              <summary className="cursor-pointer list-none text-sm font-medium text-primary underline">
                + Adicionar tradução
              </summary>
              <form
                action={translateJob.bind(null, job.id)}
                className="mt-2 flex items-center gap-2"
              >
                <Select name="locale" defaultValue="">
                  <option value="" disabled>
                    Escolhe um idioma
                  </option>
                  {SUPPORTED_LOCALES.filter(
                    (locale) =>
                      !job.job_translations.some(
                        (t: { locale: string }) => t.locale === locale
                      )
                  ).map((locale) => (
                    <option key={locale} value={locale}>
                      {LOCALE_LABELS[locale]}
                    </option>
                  ))}
                </Select>
                <Button type="submit" variant="secondary" size="sm">
                  Traduzir com IA
                </Button>
              </form>
            </details>
          )}
        </div>

        <SourcedCvUpload jobId={job.id} />

        {summaryRows.length > 0 && (
          <Card className="mt-6 overflow-x-auto px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Resumo comparativo
            </p>
            <table className="mt-2 w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium">Candidato</th>
                  <th className="py-1.5 pr-3 font-medium">Score</th>
                  <th className="py-1.5 pr-3 font-medium">Estado</th>
                  <th className="py-1.5 pr-3 font-medium">Entrevista</th>
                  <th className="py-1.5 pr-3 font-medium">Melhor teste</th>
                  <th className="py-1.5 font-medium">Red flags</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((row) => (
                  <tr key={row.id} className="border-t border-surface-border">
                    <td className="py-1.5 pr-3">
                      <Link
                        href={`#candidate-${row.id}`}
                        className="font-medium text-primary underline"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="py-1.5 pr-3">
                      {row.score != null ? Math.round(row.score) : "-"}
                    </td>
                    <td className="py-1.5 pr-3">
                      <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="py-1.5 pr-3 text-muted-foreground">
                      {row.interviewStatus ?? "-"}
                    </td>
                    <td className="py-1.5 pr-3 text-muted-foreground">
                      {row.bestTestScore != null ? Math.round(row.bestTestScore) : "-"}
                    </td>
                    <td className="py-1.5">
                      {row.redFlagCount > 0 ? (
                        <Badge variant={row.highRedFlagCount > 0 ? "danger" : "warning"}>
                          {row.redFlagCount}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <ul className="mt-6 flex flex-col gap-4">
          {applications?.length === 0 && (
            <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
              Ainda não há candidaturas.
            </Card>
          )}
          {applications?.map((application) => {
            const candidate = toOne(application.candidates);
            const scoringRows: ScoringRow[] = Array.isArray(
              application.scoring_results
            )
              ? application.scoring_results
              : application.scoring_results
                ? [application.scoring_results as ScoringRow]
                : [];
            const scoring = [...scoringRows].sort((a, b) =>
              a.created_at < b.created_at ? 1 : -1
            )[0];

            const interviewRows: InterviewRow[] = Array.isArray(
              application.ai_interviews
            )
              ? application.ai_interviews
              : application.ai_interviews
                ? [application.ai_interviews as InterviewRow]
                : [];
            const interview = [...interviewRows].sort((a, b) =>
              a.created_at < b.created_at ? 1 : -1
            )[0];

            const feedbackRows: FeedbackRow[] = Array.isArray(
              application.candidate_feedback
            )
              ? application.candidate_feedback
              : application.candidate_feedback
                ? [application.candidate_feedback as FeedbackRow]
                : [];
            const feedbackHistory = [...feedbackRows].sort((a, b) =>
              a.created_at < b.created_at ? 1 : -1
            );

            const isTerminal = TERMINAL_STATUSES.includes(application.status);
            const nextLabel = nextStageLabel(application.status);

            const redFlags: RedFlagRow[] = Array.isArray(application.red_flags)
              ? application.red_flags
              : application.red_flags
                ? [application.red_flags as RedFlagRow]
                : [];

            const testAssignments: TestAssignmentRow[] = Array.isArray(
              application.test_assignments
            )
              ? application.test_assignments
              : application.test_assignments
                ? [application.test_assignments as TestAssignmentRow]
                : [];
            const sortedTests = [...testAssignments].sort((a, b) =>
              a.assigned_at < b.assigned_at ? 1 : -1
            );

            const devReport = toOne(
              application.candidate_development_reports as
                | DevReportRow
                | DevReportRow[]
                | null
            );

            const hasEvaluationData =
              scoring != null ||
              redFlags.length > 0 ||
              interview?.status === "completed" ||
              sortedTests.some((t) => t.status === "completed");

            return (
              <li key={application.id} id={`candidate-${application.id}`}>
              <Card className="scroll-mt-6 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{candidate?.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {candidate?.email}
                      {candidate?.phone ? ` · ${candidate.phone}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {application.score_total != null ? (
                      <span className="text-2xl font-semibold text-primary">
                        {Math.round(application.score_total)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        sem score
                      </span>
                    )}
                    <div className="mt-1">
                      <Badge variant={statusVariant(application.status)}>
                        {application.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {scoring && (
                  <div className="mt-3 border-t border-surface-border pt-3 text-sm">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Skills: {scoring.breakdown?.skills_match ?? "-"}</span>
                      <span>
                        Experiência: {scoring.breakdown?.experience_match ?? "-"}
                      </span>
                      <span>
                        Formação: {scoring.breakdown?.education_match ?? "-"}
                      </span>
                      <span>
                        Idiomas: {scoring.breakdown?.language_match ?? "-"}
                      </span>
                    </div>
                    {scoring.ai_reasoning && (
                      <p className="mt-2 text-foreground">
                        {scoring.ai_reasoning}
                      </p>
                    )}
                  </div>
                )}

                {application.video_url && videoUrlMap.get(application.video_url) && (
                  <div className="mt-3 border-t border-surface-border pt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Vídeo de apresentação
                    </p>
                    <video
                      controls
                      src={videoUrlMap.get(application.video_url)}
                      className="mt-2 w-full max-w-sm rounded-lg"
                    />
                  </div>
                )}

                {redFlags.length > 0 && (
                  <div className="mt-3 border-t border-surface-border pt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Red flags
                    </p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {redFlags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Badge variant={SEVERITY_VARIANT[flag.severity]}>
                            {flag.severity}
                          </Badge>
                          <span className="text-foreground/90">
                            {flag.description}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {sortedTests.length > 0 && (
                  <div className="mt-3 border-t border-surface-border pt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Testes
                    </p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {sortedTests.map((test) => {
                        const category = test.result_raw?.category;
                        const perQuestion = test.result_raw?.per_question ?? [];
                        const recommendation = test.result_raw?.recommendation;
                        return (
                          <li key={test.id} className="text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-foreground">
                                {test.test_name}
                              </span>
                              <div className="flex items-center gap-2">
                                {test.result_score != null && (
                                  <span className="font-semibold text-primary">
                                    {Math.round(test.result_score)}
                                  </span>
                                )}
                                <Badge variant={statusVariant(test.status)}>
                                  {test.status}
                                </Badge>
                              </div>
                            </div>
                            {recommendation && recommendation !== "not_applicable" && (
                              <div className="mt-1.5 flex items-start gap-2">
                                <Badge variant={RECOMMENDATION_VARIANT[recommendation]}>
                                  {RECOMMENDATION_LABELS[recommendation]}
                                </Badge>
                                {test.result_raw?.recommendation_reason && (
                                  <span className="text-xs text-muted-foreground">
                                    {test.result_raw.recommendation_reason}
                                  </span>
                                )}
                              </div>
                            )}
                            {category === "psychometric" && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {PSYCHOMETRIC_DISCLAIMER}
                              </p>
                            )}
                            {test.status === "completed" && (
                              <details className="mt-1">
                                <summary className="cursor-pointer list-none text-xs font-medium text-primary underline">
                                  Ver respostas e avaliação
                                </summary>
                                {test.result_raw?.overall_summary && (
                                  <p className="mt-2 text-foreground/90">
                                    {test.result_raw.overall_summary}
                                  </p>
                                )}
                                <ul className="mt-2 flex flex-col gap-3">
                                  {perQuestion.map((qf, i) => (
                                    <li
                                      key={i}
                                      className="rounded-lg bg-surface-muted p-3"
                                    >
                                      <p className="text-xs font-medium text-muted-foreground">
                                        {qf.question}
                                      </p>
                                      <p className="mt-1 text-foreground/90">
                                        {qf.answer}
                                      </p>
                                      <p className="mt-1 text-xs text-primary">
                                        {qf.feedback} ({qf.score})
                                      </p>
                                    </li>
                                  ))}
                                </ul>
                              </details>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="mt-3 border-t border-surface-border pt-3">
                  {interview ? (
                    <Link
                      href={`/interview/${interview.id}`}
                      className="text-sm font-medium text-primary underline"
                    >
                      {interview.status === "completed"
                        ? "Ver entrevista e avaliação →"
                        : "Continuar entrevista IA →"}
                    </Link>
                  ) : (
                    <form action={startInterview.bind(null, application.id)}>
                      <Button type="submit" variant="secondary" size="sm">
                        Iniciar entrevista com IA
                      </Button>
                    </form>
                  )}
                </div>

                <ReportSection
                  applicationId={application.id}
                  jobId={job.id}
                  devReport={devReport}
                  hasEvaluationData={hasEvaluationData}
                />

                {!isTerminal && (
                  <div className="mt-3 flex flex-col gap-3 border-t border-surface-border pt-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      {nextLabel && (
                        <form action={advanceApplication.bind(null, application.id, job.id)}>
                          <Button type="submit" size="sm">
                            Avançar para: {nextLabel}
                          </Button>
                        </form>
                      )}
                      <details className="w-full sm:w-auto">
                        <summary className="cursor-pointer list-none text-sm font-medium text-danger underline">
                          Rejeitar
                        </summary>
                        <FeedbackComposer
                          applicationId={application.id}
                          jobId={job.id}
                          draftType="rejection"
                          formAction={rejectApplication.bind(null, application.id, job.id)}
                          placeholder="Motivo / feedback para o candidato (opcional)"
                          submitLabel="Confirmar rejeição"
                          submitVariant="danger"
                        />
                      </details>
                      <details className="w-full sm:w-auto">
                        <summary className="cursor-pointer list-none text-sm font-medium text-primary underline">
                          Enviar feedback
                        </summary>
                        <FeedbackComposer
                          applicationId={application.id}
                          jobId={job.id}
                          draftType="general"
                          formAction={sendFeedback.bind(null, application.id, job.id)}
                          required
                          placeholder="Mensagem para o candidato"
                          submitLabel="Enviar"
                          submitVariant="secondary"
                        />
                      </details>
                      <details className="w-full sm:w-auto">
                        <summary className="cursor-pointer list-none text-sm font-medium text-primary underline">
                          Atribuir teste
                        </summary>
                        <form
                          action={assignTest.bind(null, application.id, job.id)}
                          className="mt-2 flex max-w-sm flex-col gap-2"
                        >
                          <Select name="category" defaultValue="technical">
                            {Object.entries(TEST_CATEGORY_LABELS).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              )
                            )}
                          </Select>
                          <Button type="submit" variant="secondary" size="sm" className="self-start">
                            Gerar e atribuir
                          </Button>
                        </form>
                      </details>
                    </div>
                  </div>
                )}

                {feedbackHistory.length > 0 && (
                  <div className="mt-3 border-t border-surface-border pt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Feedback enviado
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
              </Card>
              </li>
            );
          })}
        </ul>
      </div>
  );
}
