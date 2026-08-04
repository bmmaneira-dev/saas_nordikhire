"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function acceptInvite(
  token: string,
  _prevState: unknown,
  formData: FormData
) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !password) {
    return { error: "Preenche todos os campos." };
  }
  if (password.length < 8) {
    return { error: "A password deve ter pelo menos 8 caracteres." };
  }

  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("company_invites")
    .select("id, company_id, email, role_id, status")
    .eq("token", token)
    .maybeSingle();

  if (!invite || invite.status !== "pending") {
    return { error: "Este convite não é válido ou já foi utilizado." };
  }

  const supabase = await createClient();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: invite.email,
    password,
  });

  if (signUpError) {
    return { error: signUpError.message };
  }
  if (!signUpData.user) {
    return { error: "Não foi possível criar a conta." };
  }

  const userId = signUpData.user.id;

  if (!signUpData.session) {
    const { data: confirmed, error: confirmError } =
      await admin.auth.admin.updateUserById(userId, { email_confirm: true });

    if (confirmError || !confirmed.user) {
      return { error: "Erro ao confirmar conta: " + confirmError?.message };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: invite.email,
      password,
    });

    if (signInError) {
      return { error: "Erro ao iniciar sessão: " + signInError.message };
    }
  }

  const { error: userError } = await admin.from("users").insert({
    id: userId,
    company_id: invite.company_id,
    role_id: invite.role_id,
    full_name: fullName,
    email: invite.email,
    invited_by: null,
  });

  if (userError) {
    return { error: "Erro ao juntar-te à equipa: " + userError.message };
  }

  await admin
    .from("company_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  redirect("/dashboard");
}
