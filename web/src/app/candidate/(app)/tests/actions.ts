"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  evaluateTestAnswers,
  type JobContext,
  type TestCategory,
} from "@/lib/skill-tests";

export async function submitTestAnswers(
  assignmentId: string,
  _prevState: unknown,
  formData: FormData
) {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const admin = createAdminClient();

  const { data: assignment } = await admin
    .from("test_assignments")
    .select("id, application_id, status, result_raw, applications(candidate_id, job_id)")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!assignment) return { error: "Teste não encontrado." };

  const application = Array.isArray(assignment.applications)
    ? assignment.applications[0]
    : assignment.applications;

  if (!application || application.candidate_id !== candidate.id) {
    return { error: "Teste não encontrado." };
  }
  if (assignment.status === "completed") {
    return { error: "Este teste já foi submetido." };
  }

  const questions: string[] = assignment.result_raw?.questions ?? [];
  const category: TestCategory = assignment.result_raw?.category ?? "technical";
  const answers = questions.map((_, i) =>
    String(formData.get(`answer_${i}`) ?? "").trim()
  );

  if (answers.some((a) => !a)) {
    return { error: "Responde a todas as perguntas antes de submeter." };
  }

  const { data: job } = await admin
    .from("jobs")
    .select(
      "skills_required, seniority_level, job_translations(title, description, requirements_text, locale)"
    )
    .eq("id", application.job_id)
    .single();

  const translation =
    job?.job_translations.find((t: { locale: string }) => t.locale === "pt") ??
    job?.job_translations[0];

  const jobContext: JobContext = {
    title: translation?.title ?? "",
    description: translation?.description ?? null,
    requirementsText: translation?.requirements_text ?? null,
    skillsRequired: Array.isArray(job?.skills_required)
      ? (job.skills_required as string[])
      : [],
    seniorityLevel: job?.seniority_level ?? null,
  };

  const evaluation = await evaluateTestAnswers(category, jobContext, questions, answers);

  await admin
    .from("test_assignments")
    .update({
      status: "completed",
      result_score: evaluation.overall_score,
      result_raw: {
        category,
        questions,
        answers,
        overall_summary: evaluation.overall_summary,
        per_question: evaluation.per_question,
        recommendation: evaluation.recommendation,
        recommendation_reason: evaluation.recommendation_reason,
      },
      completed_at: new Date().toISOString(),
    })
    .eq("id", assignmentId);

  revalidatePath(`/candidate/tests/${assignmentId}`);
  revalidatePath("/candidate/tests");
  revalidatePath("/candidate/dashboard");
  return { success: true };
}
