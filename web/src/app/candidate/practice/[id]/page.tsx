import { notFound, redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TranscriptTurn } from "@/lib/ai-interview";
import { PracticeVoiceChat } from "./voice-chat";
import { endPractice } from "../actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

interface Evaluation {
  communication: number;
  technical_depth: number;
  problem_solving: number;
  cultural_fit: number;
}

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const admin = createAdminClient();
  const { data: practice } = await admin
    .from("candidate_interview_practice")
    .select(
      "id, candidate_id, target_role, status, transcript, ai_evaluation, ai_summary"
    )
    .eq("id", id)
    .maybeSingle();

  if (!practice || practice.candidate_id !== candidate.id) notFound();

  const transcript = (practice.transcript ?? []) as TranscriptTurn[];
  const evaluation = practice.ai_evaluation as Evaluation | null;

  return (
    <>
      <PageHeader href="/candidate/dashboard" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
        <p className="text-sm text-muted-foreground">Prática de entrevista</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {practice.target_role}
        </h1>

        {practice.status === "completed" ? (
          <>
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

            <section className="mt-8 border-t border-surface-border pt-6">
              <h2 className="text-lg font-medium">Avaliação</h2>
              {evaluation && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Comunicação: {evaluation.communication}</span>
                  <span>
                    Profundidade técnica: {evaluation.technical_depth}
                  </span>
                  <span>
                    Resolução de problemas: {evaluation.problem_solving}
                  </span>
                  <span>Adequação cultural: {evaluation.cultural_fit}</span>
                </div>
              )}
              {practice.ai_summary && (
                <p className="mt-2 text-sm text-foreground/90">
                  {practice.ai_summary}
                </p>
              )}
            </section>
          </>
        ) : (
          <>
            <div className="mt-6">
              <PracticeVoiceChat
                practiceId={practice.id}
                transcript={transcript}
              />
            </div>
            <form
              action={endPractice.bind(null, practice.id)}
              className="mt-4"
            >
              <Button type="submit" variant="ghost" size="sm">
                Terminar e gerar avaliação
              </Button>
            </form>
          </>
        )}
      </main>
    </>
  );
}
