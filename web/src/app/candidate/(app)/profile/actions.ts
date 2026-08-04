"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentCandidate } from "@/lib/current-candidate";

export async function updateCandidateProfile(
  _prevState: unknown,
  formData: FormData
) {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const linkedinUrl = String(formData.get("linkedinUrl") ?? "").trim();

  if (!fullName) {
    return { error: "O nome é obrigatório." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("candidates")
    .update({
      full_name: fullName,
      phone: phone || null,
      linkedin_url: linkedinUrl || null,
    })
    .eq("id", candidate.id);

  if (error) {
    return { error: "Erro ao guardar: " + error.message };
  }

  revalidatePath("/candidate/profile");
  return { success: true };
}
