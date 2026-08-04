import { notFound, redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { toOne } from "@/lib/to-one";
import { PSYCHOMETRIC_DISCLAIMER } from "@/lib/skill-tests";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { TestForm } from "./test-form";

interface QuestionFeedbackRow {
  question: string;
  answer: string;
  feedback: string;
  score: number;
}

export default async function CandidateTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const admin = createAdminClient();
  const { data: assignment } = await admin
    .from("test_assignments")
    .select(
      "id, test_name, status, result_score, result_raw, applications(candidate_id, jobs(job_translations(title, locale)))"
    )
    .eq("id", id)
    .maybeSingle();

  if (!assignment) notFound();

  const application = toOne(assignment.applications);
  if (!application || application.candidate_id !== candidate.id) notFound();

  const job = toOne(application.jobs);
  const translation =
    job?.job_translations.find((t: { locale: string }) => t.locale === "pt") ??
    job?.job_translations[0];

  const resultRaw = assignment.result_raw as {
    category?: "technical" | "behavioral" | "psychometric";
    questions?: string[];
    overall_summary?: string;
    per_question?: QuestionFeedbackRow[];
  } | null;
  const questions = resultRaw?.questions ?? [];
  const perQuestion = resultRaw?.per_question ?? [];

  return (
    <>
      <PageHeader href="/candidate/dashboard" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
        <p className="text-sm text-muted-foreground">
          {translation?.title ?? "Candidatura"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {assignment.test_name}
        </h1>

        {resultRaw?.category === "psychometric" && (
          <p className="mt-2 text-sm text-muted-foreground">
            {PSYCHOMETRIC_DISCLAIMER}
          </p>
        )}

        {assignment.status === "completed" ? (
          <div className="mt-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium">Resultado</h2>
              {assignment.result_score != null && (
                <span className="text-2xl font-semibold text-primary">
                  {Math.round(assignment.result_score)}
                </span>
              )}
            </div>
            {resultRaw?.overall_summary && (
              <p className="mt-2 text-sm text-foreground/90">
                {resultRaw.overall_summary}
              </p>
            )}

            <ul className="mt-6 flex flex-col gap-4">
              {perQuestion.map((qf, i) => (
                <Card key={i} className="px-5 py-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Pergunta {i + 1}
                  </p>
                  <p className="mt-1 font-medium">{qf.question}</p>
                  <p className="mt-2 text-sm text-foreground/90">
                    {qf.answer}
                  </p>
                  <p className="mt-2 text-sm text-primary">{qf.feedback}</p>
                </Card>
              ))}
            </ul>
          </div>
        ) : (
          <TestForm assignmentId={assignment.id} questions={questions} />
        )}
      </main>
    </>
  );
}
