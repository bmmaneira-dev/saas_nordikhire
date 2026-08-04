"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";

function isAdmin(appUser: { roles: { name: string } | { name: string }[] | null }) {
  const role = Array.isArray(appUser.roles) ? appUser.roles[0] : appUser.roles;
  return role?.name === "Admin";
}

export async function updateCompanyProfile(
  _prevState: unknown,
  formData: FormData
) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");
  if (!isAdmin(appUser)) return { error: "Só administradores podem editar." };

  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();

  if (!name) {
    return { error: "O nome da empresa é obrigatório." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("companies")
    .update({
      name,
      industry: industry || null,
      country: country || "AO",
      logo_url: logoUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appUser.company_id);

  if (error) {
    return { error: "Erro ao guardar: " + error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markIntegrationsReviewed() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const admin = createAdminClient();
  await admin
    .from("company_onboarding_progress")
    .upsert(
      {
        company_id: appUser.company_id,
        step: "integrations_reviewed",
        completed_at: new Date().toISOString(),
      },
      { onConflict: "company_id,step" }
    );

  revalidatePath("/dashboard");
}
