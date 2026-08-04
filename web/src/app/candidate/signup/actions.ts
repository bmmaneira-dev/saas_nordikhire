"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function candidateSignup(_prevState: unknown, formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const consent = formData.get("consent") === "on";

  if (!fullName || !email || !password) {
    return { error: "Preenche todos os campos." };
  }
  if (password.length < 8) {
    return { error: "A password deve ter pelo menos 8 caracteres." };
  }
  if (!consent) {
    return {
      error: "É necessário aceitar o tratamento de dados pessoais.",
    };
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
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
    // Ver nota equivalente em src/app/signup/actions.ts: o projecto exige
    // confirmação de email por omissão, ainda sem envio configurado.
    const { error: confirmError } = await admin.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );
    if (confirmError) {
      return { error: "Erro ao confirmar conta: " + confirmError.message };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      return { error: "Erro ao iniciar sessão: " + signInError.message };
    }
  }

  // Pode já existir um registo de candidato global (ex: candidatou-se como
  // convidado a uma vaga antes de criar conta) — ligamos a conta a esse
  // registo em vez de criar um duplicado.
  const { data: existing } = await admin
    .from("candidates")
    .select("id, auth_user_id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    if (!existing.auth_user_id) {
      const { error: linkError } = await admin
        .from("candidates")
        .update({
          auth_user_id: userId,
          full_name: fullName,
          consent_data_processing: true,
          consent_date: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (linkError) {
        return { error: "Erro ao ligar candidato: " + linkError.message };
      }
    }
  } else {
    const { error: insertError } = await admin.from("candidates").insert({
      auth_user_id: userId,
      full_name: fullName,
      email,
      consent_data_processing: true,
      consent_date: new Date().toISOString(),
    });
    if (insertError) {
      return { error: "Erro ao criar candidato: " + insertError.message };
    }
  }

  redirect("/candidate/dashboard");
}
