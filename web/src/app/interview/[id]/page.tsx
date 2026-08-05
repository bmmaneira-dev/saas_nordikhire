import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { toOne } from "@/lib/to-one";
import type { TranscriptTurn } from "@/lib/ai-interview";
import { InterviewChat } from "./chat";
import { endInterview } from "../actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getCurrentAppUser } from "@/lib/current-user";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";

interface Evaluation {
  communication: number;
  technical_depth: number;
  problem_solving: number;
  cultural_fit: number;
}

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const [appUser, candidateUser] = await Promise.all([
    getCurrentAppUser(),
    getCurrentCandidate(),
  ]);
  const company = toOne(appUser?.companies);
  const locale = appUser
    ? toLocale(company?.default_locale)
    : toLocale(candidateUser?.preferred_locale);
  const dict = await getDictionary(locale);
  const t = dict.interviewPage;
  const te = dict.interviewEvaluation;

  const { data: interview } = await admin
    .from("ai_interviews")
    .select(
      "id, status, transcript, ai_evaluation, ai_summary, applications(candidates(full_name), jobs(job_translations(title, locale)))"
    )
    .eq("id", id)
    .maybeSingle();

  if (!interview) notFound();

  const application = toOne(interview.applications);
  const candidate = toOne(application?.candidates);
  const job = toOne(application?.jobs);
  const translation =
    job?.job_translations?.find(
      (tr: { locale: string }) => tr.locale === "pt"
    ) ?? job?.job_translations?.[0];

  const transcript = (interview.transcript ?? []) as TranscriptTurn[];
  const evaluation = interview.ai_evaluation as Evaluation | null;

  return (
    <>
      <PageHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
        <p className="text-sm text-muted-foreground">{translation?.title}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {t.aiInterviewWith} {candidate?.full_name}
        </h1>

        <div className="mt-6 flex flex-col gap-3">
          {transcript.map((turn, i) => (
            <div
              key={i}
              className={`flex ${turn.role === "ai" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  turn.role === "ai"
                    ? "bg-surface-muted text-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {turn.text}
              </div>
            </div>
          ))}
        </div>

        {interview.status === "completed" ? (
          <section className="mt-8 border-t border-surface-border pt-6">
            <h2 className="text-lg font-medium">{t.evaluation}</h2>
            {evaluation && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{te.communication}: {evaluation.communication}</span>
                <span>{te.technicalDepth}: {evaluation.technical_depth}</span>
                <span>{te.problemSolving}: {evaluation.problem_solving}</span>
                <span>{te.culturalFit}: {evaluation.cultural_fit}</span>
              </div>
            )}
            {interview.ai_summary && (
              <p className="mt-2 text-sm text-foreground/90">
                {interview.ai_summary}
              </p>
            )}
          </section>
        ) : (
          <>
            <div className="mt-6">
              <InterviewChat interviewId={interview.id} dict={dict} />
            </div>
            <form
              action={endInterview.bind(null, interview.id)}
              className="mt-4"
            >
              <Button type="submit" variant="ghost" size="sm">
                {t.endInterview}
              </Button>
            </form>
          </>
        )}
      </main>
    </>
  );
}
