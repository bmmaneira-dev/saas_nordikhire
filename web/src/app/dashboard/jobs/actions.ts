"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { getOrCreateSubscription, getUsageCounts } from "@/lib/billing";

function randomSlug() {
  return Math.random().toString(36).slice(2, 10);
}

export async function createJob(_prevState: unknown, formData: FormData) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const requirementsText = String(formData.get("requirementsText") ?? "").trim();
  const skills = String(formData.get("skills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const seniorityLevel = String(formData.get("seniorityLevel") ?? "") || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const workMode = String(formData.get("workMode") ?? "") || null;
  const salaryMinRaw = String(formData.get("salaryMin") ?? "").trim();
  const salaryMaxRaw = String(formData.get("salaryMax") ?? "").trim();
  const publish = formData.get("publish") === "on";

  if (!title) {
    return { error: "O título da vaga é obrigatório." };
  }

  const admin = createAdminClient();

  if (publish) {
    const subscription = await getOrCreateSubscription(admin, appUser.company_id);
    const limit = subscription?.plan.max_active_jobs ?? null;
    if (limit != null) {
      const usage = await getUsageCounts(admin, appUser.company_id);
      if (usage.activeJobs >= limit) {
        return {
          error: `Atingiste o limite de ${limit} vaga(s) activa(s) do plano ${subscription?.plan.name}. Actualiza o plano em Facturação, ou guarda como rascunho.`,
        };
      }
    }
  }

  const { data: job, error: jobError } = await admin
    .from("jobs")
    .insert({
      company_id: appUser.company_id,
      created_by: appUser.id,
      default_locale: "pt",
      skills_required: skills,
      seniority_level: seniorityLevel,
      location,
      work_mode: workMode,
      salary_range_min: salaryMinRaw ? Number(salaryMinRaw) : null,
      salary_range_max: salaryMaxRaw ? Number(salaryMaxRaw) : null,
      status: publish ? "open" : "draft",
      public_slug: randomSlug(),
      published_at: publish ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return { error: "Erro ao criar vaga: " + jobError?.message };
  }

  const { error: translationError } = await admin
    .from("job_translations")
    .insert({
      job_id: job.id,
      locale: "pt",
      title,
      description,
      requirements_text: requirementsText,
    });

  if (translationError) {
    return { error: "Erro ao guardar conteúdo da vaga: " + translationError.message };
  }

  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard");
  redirect("/dashboard/jobs");
}
