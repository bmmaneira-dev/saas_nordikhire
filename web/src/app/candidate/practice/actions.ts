"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateOpeningMessage,
  generateReply,
  generateEvaluation,
  type JobContext,
  type TranscriptTurn,
} from "@/lib/ai-interview";

function buildPracticeJobContext(targetRole: string, notes: string): JobContext {
  return {
    title: targetRole,
    description: notes || null,
    requirementsText: null,
    skillsRequired: [],
    seniorityLevel: null,
  };
}

export async function startPractice(_prevState: unknown, formData: FormData) {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const targetRole = String(formData.get("targetRole") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!targetRole) {
    return { error: "Indica o cargo que queres treinar." };
  }

  const jobContext = buildPracticeJobContext(targetRole, notes);
  const opening = await generateOpeningMessage(jobContext, {
    fullName: candidate.full_name,
    parsedCv: null,
  });

  const admin = createAdminClient();
  const { data: practice, error } = await admin
    .from("candidate_interview_practice")
    .insert({
      candidate_id: candidate.id,
      target_role: targetRole,
      notes: notes || null,
      transcript: [{ role: "ai", text: opening }],
    })
    .select("id")
    .single();

  if (error || !practice) {
    return { error: "Erro ao criar sessão de prática: " + error?.message };
  }

  redirect(`/candidate/practice/${practice.id}`);
}

export async function sendPracticeMessage(
  practiceId: string,
  _prevState: unknown,
  formData: FormData
) {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Escreve uma resposta." };

  const admin = createAdminClient();
  const { data: practice } = await admin
    .from("candidate_interview_practice")
    .select("id, candidate_id, target_role, notes, transcript, status")
    .eq("id", practiceId)
    .single();

  if (!practice || practice.candidate_id !== candidate.id) {
    return { error: "Sessão não encontrada." };
  }
  if (practice.status === "completed") {
    return { error: "Esta sessão já terminou." };
  }

  const jobContext = buildPracticeJobContext(
    practice.target_role,
    practice.notes ?? ""
  );

  const transcript = [
    ...((practice.transcript as TranscriptTurn[]) ?? []),
    { role: "candidate", text: message } as TranscriptTurn,
  ];

  const reply = await generateReply(transcript, jobContext, {
    fullName: candidate.full_name,
    parsedCv: null,
  });
  const updatedTranscript = [
    ...transcript,
    { role: "ai", text: reply } as TranscriptTurn,
  ];

  await admin
    .from("candidate_interview_practice")
    .update({ transcript: updatedTranscript })
    .eq("id", practiceId);

  revalidatePath(`/candidate/practice/${practiceId}`);
  return { success: true };
}

export async function endPractice(practiceId: string) {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const admin = createAdminClient();
  const { data: practice } = await admin
    .from("candidate_interview_practice")
    .select("id, candidate_id, target_role, notes, transcript")
    .eq("id", practiceId)
    .single();

  if (!practice || practice.candidate_id !== candidate.id) {
    throw new Error("Sessão não encontrada.");
  }

  const jobContext = buildPracticeJobContext(
    practice.target_role,
    practice.notes ?? ""
  );
  const transcript = (practice.transcript as TranscriptTurn[]) ?? [];
  const evaluation = await generateEvaluation(transcript, jobContext);

  await admin
    .from("candidate_interview_practice")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      ai_evaluation: {
        communication: evaluation.communication,
        technical_depth: evaluation.technical_depth,
        problem_solving: evaluation.problem_solving,
        cultural_fit: evaluation.cultural_fit,
      },
      ai_summary: evaluation.summary,
    })
    .eq("id", practiceId);

  redirect(`/candidate/practice/${practiceId}`);
}
