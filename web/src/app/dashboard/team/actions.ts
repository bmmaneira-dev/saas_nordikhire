"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { getOrCreateSubscription, getUsageCounts } from "@/lib/billing";

function isAdmin(appUser: { roles: { name: string } | { name: string }[] | null }) {
  const role = Array.isArray(appUser.roles) ? appUser.roles[0] : appUser.roles;
  return role?.name === "Admin";
}

export async function inviteTeammate(_prevState: unknown, formData: FormData) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");
  if (!isAdmin(appUser)) return { error: "Só administradores podem convidar." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim() || null;
  const roleId = String(formData.get("roleId") ?? "");

  if (!email || !roleId) {
    return { error: "Preenche o email e escolhe um papel." };
  }

  const admin = createAdminClient();

  const { data: existingUser } = await admin
    .from("users")
    .select("id")
    .eq("company_id", appUser.company_id)
    .eq("email", email)
    .maybeSingle();
  if (existingUser) {
    return { error: "Já existe um utilizador com este email na equipa." };
  }

  const subscription = await getOrCreateSubscription(admin, appUser.company_id);
  const userLimit = subscription?.plan.max_users ?? null;
  if (userLimit != null) {
    const usage = await getUsageCounts(admin, appUser.company_id);
    if (usage.teamMembers >= userLimit) {
      return {
        error: `Atingiste o limite de ${userLimit} membro(s) de equipa do plano ${subscription?.plan.name}. Actualiza o plano em Facturação.`,
      };
    }
  }

  const token = crypto.randomUUID();

  const { error } = await admin.from("company_invites").insert({
    company_id: appUser.company_id,
    email,
    full_name: fullName,
    role_id: roleId,
    invited_by: appUser.id,
    token,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um convite pendente para este email." };
    }
    return { error: "Erro ao criar convite: " + error.message };
  }

  revalidatePath("/dashboard/team");
  return { success: true };
}

export async function revokeInvite(inviteId: string) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");
  if (!isAdmin(appUser)) return;

  const admin = createAdminClient();
  await admin
    .from("company_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("company_id", appUser.company_id)
    .eq("status", "pending");

  revalidatePath("/dashboard/team");
}

export async function setTeammateActive(
  userId: string,
  isActive: boolean
) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");
  if (!isAdmin(appUser)) return;
  if (userId === appUser.id) return;

  const admin = createAdminClient();
  await admin
    .from("users")
    .update({ is_active: isActive })
    .eq("id", userId)
    .eq("company_id", appUser.company_id);

  revalidatePath("/dashboard/team");
}
