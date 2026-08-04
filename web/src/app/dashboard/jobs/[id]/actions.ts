"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import {
  generateTestQuestions,
  TEST_CATEGORY_LABELS,
  type JobContext,
  type TestCategory,
} from "@/lib/skill-tests";
import {
  translateJobContent,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/translate-job";
import { generateDevelopmentReport } from "@/lib/development-report";

const VALID_TEST_CATEGORIES: TestCategory[] = ["technical", "behavioral", "psychometric"];

// received/screening/scored acontecem automaticamente (candidatura + scoring
// da IA); a partir de "shortlisted" as transições são decisões do recrutador.
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

function nextStage(current: string): string | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) return null;
  const shortlistedIdx = STAGE_ORDER.indexOf("shortlisted");
  return idx < shortlistedIdx ? "shortlisted" : STAGE_ORDER[idx + 1];
}

async function loadOwnedApplication(
  admin: ReturnType<typeof createAdminClient>,
  applicationId: string,
  companyId: string
) {
  const { data } = await admin
    .from("applications")
    .select("id, status")
    .eq("id", applicationId)
    .eq("company_id", companyId)
    .maybeSingle();
  return data;
}

export async function advanceApplication(applicationId: string, jobId: string) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");
  const admin = createAdminClient();

  const application = await loadOwnedApplication(admin, applicationId, appUser.company_id);
  if (!application) return;

  const next = nextStage(application.status);
  if (!next) return;

  await admin
    .from("applications")
    .update({ status: next, stage_updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  revalidatePath(`/dashboard/jobs/${jobId}`);
}

export async function rejectApplication(
  applicationId: string,
  jobId: string,
  formData: FormData
) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");
  const admin = createAdminClient();

  const application = await loadOwnedApplication(admin, applicationId, appUser.company_id);
  if (!application) return;

  await admin
    .from("applications")
    .update({ status: "rejected", stage_updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  const feedbackText = String(formData.get("feedback") ?? "").trim();
  if (feedbackText) {
    await admin.from("candidate_feedback").insert({
      application_id: applicationId,
      feedback_type: "rejection",
      content: feedbackText,
      channel: "platform",
      sent_at: new Date().toISOString(),
    });
  }

  revalidatePath(`/dashboard/jobs/${jobId}`);
}

export async function sendFeedback(
  applicationId: string,
  jobId: string,
  formData: FormData
) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");
  const admin = createAdminClient();

  const application = await loadOwnedApplication(admin, applicationId, appUser.company_id);
  if (!application) return;

  const content = String(formData.get("feedback") ?? "").trim();
  if (!content) return;

  await admin.from("candidate_feedback").insert({
    application_id: applicationId,
    feedback_type: "improvement_tips",
    content,
    channel: "platform",
    sent_at: new Date().toISOString(),
  });

  revalidatePath(`/dashboard/jobs/${jobId}`);
}

export async function assignTest(
  applicationId: string,
  jobId: string,
  formData: FormData
) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");
  const admin = createAdminClient();

  const application = await loadOwnedApplication(admin, applicationId, appUser.company_id);
  if (!application) return;

  const category = String(formData.get("category") ?? "") as TestCategory;
  if (!VALID_TEST_CATEGORIES.includes(category)) return;

  const { data: provider } = await admin
    .from("test_providers")
    .select("id")
    .eq("provider_type", category)
    .eq("is_active", true)
    .maybeSingle();
  if (!provider) return;

  const { data: job } = await admin
    .from("jobs")
    .select(
      "skills_required, seniority_level, job_translations(title, description, requirements_text, locale)"
    )
    .eq("id", jobId)
    .single();
  if (!job) return;

  const translation =
    job.job_translations.find((t: { locale: string }) => t.locale === "pt") ??
    job.job_translations[0];

  const jobContext: JobContext = {
    title: translation?.title ?? "",
    description: translation?.description ?? null,
    requirementsText: translation?.requirements_text ?? null,
    skillsRequired: Array.isArray(job.skills_required)
      ? (job.skills_required as string[])
      : [],
    seniorityLevel: job.seniority_level,
  };

  const generated = await generateTestQuestions(category, jobContext);

  await admin.from("test_assignments").insert({
    application_id: applicationId,
    provider_id: provider.id,
    test_name: generated.test_name || TEST_CATEGORY_LABELS[category],
    status: "assigned",
    result_raw: { category, questions: generated.questions },
  });

  revalidatePath(`/dashboard/jobs/${jobId}`);
}

export async function translateJob(jobId: string, formData: FormData) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");
  const admin = createAdminClient();

  const { data: job } = await admin
    .from("jobs")
    .select(
      "id, job_translations(locale, title, description, requirements_text)"
    )
    .eq("id", jobId)
    .eq("company_id", appUser.company_id)
    .maybeSingle();
  if (!job) return;

  const targetLocale = String(formData.get("locale") ?? "") as Locale;
  if (!(SUPPORTED_LOCALES as readonly string[]).includes(targetLocale)) return;
  if (job.job_translations.some((t: { locale: string }) => t.locale === targetLocale)) {
    return;
  }

  const source =
    job.job_translations.find((t: { locale: string }) => t.locale === "pt") ??
    job.job_translations[0];
  if (!source) return;

  const translated = await translateJobContent(
    {
      title: source.title,
      description: source.description ?? "",
      requirements_text: source.requirements_text ?? "",
    },
    targetLocale
  );

  await admin.from("job_translations").insert({
    job_id: jobId,
    locale: targetLocale,
    title: translated.title,
    description: translated.description,
    requirements_text: translated.requirements_text,
    is_machine_translated: true,
  });

  revalidatePath(`/dashboard/jobs/${jobId}`);
}

export async function generateReport(applicationId: string, jobId: string) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");
  const admin = createAdminClient();

  const { data: application } = await admin
    .from("applications")
    .select(
      "id, candidates(full_name), scoring_results(overall_score, breakdown, ai_reasoning, created_at), red_flags(flag_type, severity, description), ai_interviews(ai_summary, ai_evaluation, status, completed_at), test_assignments(test_name, status, result_score, result_raw)"
    )
    .eq("id", applicationId)
    .eq("company_id", appUser.company_id)
    .maybeSingle();
  if (!application) return;

  const { data: job } = await admin
    .from("jobs")
    .select("job_translations(title, locale)")
    .eq("id", jobId)
    .single();
  if (!job) return;

  const jobTitle =
    job.job_translations.find((t: { locale: string }) => t.locale === "pt")
      ?.title ?? job.job_translations[0]?.title ?? "";

  const candidate = Array.isArray(application.candidates)
    ? application.candidates[0]
    : application.candidates;

  const scoringRows = Array.isArray(application.scoring_results)
    ? application.scoring_results
    : application.scoring_results
      ? [application.scoring_results]
      : [];
  const scoring = [...scoringRows].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1
  )[0];

  const redFlags = Array.isArray(application.red_flags)
    ? application.red_flags
    : application.red_flags
      ? [application.red_flags]
      : [];

  const interviewRows = Array.isArray(application.ai_interviews)
    ? application.ai_interviews
    : application.ai_interviews
      ? [application.ai_interviews]
      : [];
  const interview = interviewRows.find((i) => i.status === "completed");

  const testRows = Array.isArray(application.test_assignments)
    ? application.test_assignments
    : application.test_assignments
      ? [application.test_assignments]
      : [];
  const completedTests = testRows.filter((t) => t.status === "completed");

  const report = await generateDevelopmentReport({
    jobTitle,
    candidateName: candidate?.full_name ?? "Candidato",
    cvScore: scoring?.overall_score ?? null,
    cvBreakdown: scoring?.breakdown ?? null,
    cvReasoning: scoring?.ai_reasoning ?? null,
    redFlags: redFlags.map((f) => ({
      flag_type: f.flag_type,
      severity: f.severity,
      description: f.description,
    })),
    interviewSummary: interview?.ai_summary ?? null,
    interviewEvaluation: interview?.ai_evaluation ?? null,
    testResults: completedTests.map((t) => ({
      test_name: t.test_name,
      category: t.result_raw?.category ?? null,
      score: t.result_score,
      summary: t.result_raw?.overall_summary ?? null,
      recommendation: t.result_raw?.recommendation ?? null,
    })),
  });

  await admin.from("candidate_development_reports").upsert(
    {
      application_id: applicationId,
      strengths: report.strengths,
      technical_gaps: report.technical_gaps,
      behavioral_gaps: report.behavioral_gaps,
      training_recommendations: report.training_recommendations,
      overall_summary: report.overall_summary,
      ai_model: "claude-haiku-4-5",
      generated_at: new Date().toISOString(),
    },
    { onConflict: "application_id" }
  );

  revalidatePath(`/dashboard/jobs/${jobId}`);
}
