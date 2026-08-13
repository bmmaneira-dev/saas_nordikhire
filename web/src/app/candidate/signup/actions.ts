"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toLocale } from "@/lib/i18n/locale";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function candidateSignup(_prevState: unknown, formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const consent = formData.get("consent") === "on";
  const locale = toLocale(String(formData.get("locale") ?? ""));

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

  const ip = await getClientIp();
  const { allowed } = await checkRateLimit("candidate_signup", ip, {
    maxAttempts: 5,
    windowMinutes: 60,
  });
  if (!allowed) {
    return { error: "Demasiadas tentativas. Tenta novamente daqui a uma hora." };
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
  // convidado a uma vaga antes de criar conta). NUNCA ligamos automaticamente
  // essa conta ao registo existente só por o email coincidir — o email não
  // foi verificado (ver nota acima), e essa candidatura antiga pode conter
  // CVs, transcrições de entrevista e feedback de outras empresas. Ligar
  // automaticamente daria a quem souber o email de outra pessoa acesso
  // instantâneo a todo esse histórico. Em vez disso, recusamos a criação de
  // conta nova quando já existe actividade não reclamada com este email, e
  // encaminhamos para suporte para uma reclamação manual e verificada.
  const { data: existing } = await admin
    .from("candidates")
    .select("id, auth_user_id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    if (!existing.auth_user_id) {
      await admin.auth.admin.deleteUser(userId);
      return {
        error:
          "Já existe actividade associada a este email (ex: uma candidatura anterior). Por segurança, não ligamos isso automaticamente a uma conta nova — contacta o suporte para recuperar o teu histórico.",
      };
    }
    // existing.auth_user_id já aponta para outra conta — email já registado;
    // supabase.auth.signUp() já teria devolvido erro nesse caso.
  } else {
    const { error: insertError } = await admin.from("candidates").insert({
      auth_user_id: userId,
      full_name: fullName,
      email,
      preferred_locale: locale,
      consent_data_processing: true,
      consent_date: new Date().toISOString(),
    });
    if (insertError) {
      return { error: "Erro ao criar candidato: " + insertError.message };
    }
  }

  redirect("/candidate/dashboard");
}
