"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { toOne } from "@/lib/to-one";
import {
  generateOpeningMessage,
  generateReply,
  generateEvaluation,
  type JobContext,
  type CandidateContext,
  type TranscriptTurn,
} from "@/lib/ai-interview";

async function loadInterviewContext(
  applicationId: string
): Promise<{ jobContext: JobContext; candidateContext: CandidateContext }> {
  const admin = createAdminClient();

  const { data: application } = await admin
    .from("applications")
    .select("job_id, candidates(full_name)")
    .eq("id", applicationId)
    .single();
  if (!application) throw new Error("Candidatura não encontrada.");

  const { data: job } = await admin
    .from("jobs")
    .select(
      "skills_required, seniority_level, job_translations(title, description, requirements_text, locale)"
    )
    .eq("id", application.job_id)
    .single();
  if (!job) throw new Error("Vaga não encontrada.");

  const { data: cvExtraction } = await admin
    .from("cv_extractions")
    .select("parsed_data")
    .eq("application_id", applicationId)
    .maybeSingle();

  const translation =
    job.job_translations.find((t: { locale: string }) => t.locale === "pt") ??
    job.job_translations[0];
  const candidate = toOne(application.candidates);

  return {
    jobContext: {
      title: translation?.title ?? "",
      description: translation?.description ?? null,
      requirementsText: translation?.requirements_text ?? null,
      skillsRequired: Array.isArray(job.skills_required)
        ? (job.skills_required as string[])
        : [],
      seniorityLevel: job.seniority_level,
    },
    candidateContext: {
      fullName: candidate?.full_name ?? "Candidato",
      parsedCv: (cvExtraction?.parsed_data as Record<string, unknown>) ?? null,
    },
  };
}

export async function startInterview(applicationId: string) {
  const admin = createAdminClient();
  const { jobContext, candidateContext } = await loadInterviewContext(
    applicationId
  );

  const opening = await generateOpeningMessage(jobContext, candidateContext);

  const { data: interview, error } = await admin
    .from("ai_interviews")
    .insert({
      application_id: applicationId,
      status: "scheduled",
      transcript: [{ role: "ai", text: opening }],
      scheduled_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !interview) {
    throw new Error("Erro ao criar entrevista: " + error?.message);
  }

  redirect(`/interview/${interview.id}`);
}

export async function sendInterviewMessage(
  interviewId: string,
  _prevState: unknown,
  formData: FormData
) {
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Escreve uma resposta." };

  const admin = createAdminClient();
  const { data: interview } = await admin
    .from("ai_interviews")
    .select("id, application_id, transcript, status")
    .eq("id", interviewId)
    .single();

  if (!interview) return { error: "Entrevista não encontrada." };
  if (interview.status === "completed") {
    return { error: "Esta entrevista já terminou." };
  }

  const { jobContext, candidateContext } = await loadInterviewContext(
    interview.application_id
  );

  const transcript = [
    ...((interview.transcript as TranscriptTurn[]) ?? []),
    { role: "candidate", text: message } as TranscriptTurn,
  ];

  const reply = await generateReply(transcript, jobContext, candidateContext);
  const updatedTranscript = [
    ...transcript,
    { role: "ai", text: reply } as TranscriptTurn,
  ];

  await admin
    .from("ai_interviews")
    .update({ transcript: updatedTranscript })
    .eq("id", interviewId);

  revalidatePath(`/interview/${interviewId}`);
  return { success: true };
}

export async function endInterview(interviewId: string) {
  const admin = createAdminClient();
  const { data: interview } = await admin
    .from("ai_interviews")
    .select("id, application_id, transcript, scheduled_at")
    .eq("id", interviewId)
    .single();

  if (!interview) throw new Error("Entrevista não encontrada.");

  const { jobContext } = await loadInterviewContext(interview.application_id);
  const transcript = (interview.transcript as TranscriptTurn[]) ?? [];
  const evaluation = await generateEvaluation(transcript, jobContext);

  const durationSeconds = interview.scheduled_at
    ? Math.round(
        (Date.now() - new Date(interview.scheduled_at).getTime()) / 1000
      )
    : null;

  await admin
    .from("ai_interviews")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      ai_evaluation: {
        communication: evaluation.communication,
        technical_depth: evaluation.technical_depth,
        problem_solving: evaluation.problem_solving,
        cultural_fit: evaluation.cultural_fit,
      },
      ai_summary: evaluation.summary,
    })
    .eq("id", interviewId);

  redirect(`/interview/${interviewId}`);
}
