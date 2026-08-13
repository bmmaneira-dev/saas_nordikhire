"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { getOrCreateSubscription, getUsageCounts } from "@/lib/billing";
import { hasPermission } from "@/lib/permissions";

export async function inviteTeammate(_prevState: unknown, formData: FormData) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");
  if (!hasPermission(appUser, "team.manage")) {
    return { error: "Não tens permissão para convidar membros de equipa." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim() || null;
  const roleId = String(formData.get("roleId") ?? "");

  if (!email || !roleId) {
    return { error: "Preenche o email e escolhe um papel." };
  }

  const admin = createAdminClient();

  const { data: role } = await admin
    .from("roles")
    .select("id")
    .eq("id", roleId)
    .eq("company_id", appUser.company_id)
    .maybeSingle();
  if (!role) {
    return { error: "Papel inválido." };
  }

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
  if (!hasPermission(appUser, "team.manage")) return;

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
  if (!hasPermission(appUser, "team.manage")) return;
  if (userId === appUser.id) return;

  const admin = createAdminClient();
  const { data: updated } = await admin
    .from("users")
    .update({ is_active: isActive })
    .eq("id", userId)
    .eq("company_id", appUser.company_id)
    .select("id")
    .maybeSingle();

  // Desactivar não bastava para tirar acesso: getCurrentAppUser() já filtra
  // is_active, mas a sessão existente do Supabase continuava válida até
  // expirar sozinha. Revoga-a já, para o efeito ser imediato.
  if (updated && !isActive) {
    await admin.auth.admin.signOut(userId, "global");
  }

  if (updated) {
    await admin.from("audit_log").insert({
      company_id: appUser.company_id,
      user_id: appUser.id,
      action: isActive ? "team.member_activated" : "team.member_deactivated",
      entity_type: "user",
      entity_id: userId,
    });
  }

  revalidatePath("/dashboard/team");
}
