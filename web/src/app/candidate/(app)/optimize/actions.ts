"use server";

import { redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { optimizeProfile } from "@/lib/profile-optimization";
import { checkRateLimit } from "@/lib/rate-limit";

const VALID_SOURCE_TYPES = ["linkedin", "cv", "other_platform"];

export async function startOptimization(
  _prevState: unknown,
  formData: FormData
) {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const sourceType = String(formData.get("sourceType") ?? "");
  const sourceLabel = String(formData.get("sourceLabel") ?? "").trim() || null;
  const inputText = String(formData.get("inputText") ?? "").trim();

  if (!VALID_SOURCE_TYPES.includes(sourceType)) {
    return { error: "Escolhe o tipo de conteúdo." };
  }
  if (!inputText) {
    return { error: "Cola o texto do teu perfil ou CV." };
  }

  const { allowed } = await checkRateLimit("profile_optimization", candidate.id, {
    maxAttempts: 10,
    windowMinutes: 60,
  });
  if (!allowed) {
    return { error: "Demasiadas análises pedidas recentemente. Tenta novamente mais tarde." };
  }

  let result;
  try {
    result = await optimizeProfile(sourceType, inputText);
  } catch (err) {
    return {
      error:
        "Erro ao analisar o perfil: " +
        (err instanceof Error ? err.message : String(err)),
    };
  }

  const admin = createAdminClient();
  const { data: optimization, error } = await admin
    .from("candidate_profile_optimizations")
    .insert({
      candidate_id: candidate.id,
      source_type: sourceType,
      source_label: sourceLabel,
      input_text: inputText,
      section_feedback: result.section_feedback,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      overall_score: result.overall_score,
      overall_summary: result.overall_summary,
      tier_used: "free",
      ai_model: "claude-haiku-4-5",
    })
    .select("id")
    .single();

  if (error || !optimization) {
    return { error: "Erro ao guardar a análise: " + error?.message };
  }

  redirect(`/candidate/optimize/${optimization.id}`);
}
