"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toLocale } from "@/lib/i18n/locale";

function slugify(name: string) {
  const diacritics = new RegExp(
    "[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]",
    "g"
  );
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(diacritics, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "empresa"}-${suffix}`;
}

export async function signup(_prevState: unknown, formData: FormData) {
  const companyName = String(formData.get("companyName") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const locale = toLocale(String(formData.get("locale") ?? ""));

  if (!companyName || !fullName || !email || !password) {
    return { error: "Preenche todos os campos." };
  }
  if (password.length < 8) {
    return { error: "A password deve ter pelo menos 8 caracteres." };
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

  let userId = signUpData.user.id;

  if (!signUpData.session) {
    // O projecto Supabase exige confirmação de email por omissão. Como ainda
    // não há envio de email configurado nesta fase, confirmamos a conta no
    // servidor (via service role) e iniciamos sessão de imediato, para o
    // fluxo de demo não depender de uma caixa de correio real.
    const { data: confirmed, error: confirmError } =
      await admin.auth.admin.updateUserById(userId, { email_confirm: true });

    if (confirmError || !confirmed.user) {
      return { error: "Erro ao confirmar conta: " + confirmError?.message };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return { error: "Erro ao iniciar sessão: " + signInError.message };
    }
  }

  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({ name: companyName, slug: slugify(companyName), default_locale: locale })
    .select("id")
    .single();

  if (companyError || !company) {
    return { error: "Erro ao criar empresa: " + companyError?.message };
  }

  const { data: roles, error: roleError } = await admin
    .from("roles")
    .insert([
      {
        company_id: company.id,
        name: "Admin",
        permissions: {
          "jobs.create": true,
          "jobs.delete": true,
          "candidates.view": true,
          "billing.manage": true,
          "team.manage": true,
        },
      },
      {
        company_id: company.id,
        name: "Recrutador",
        permissions: {
          "jobs.create": true,
          "jobs.delete": false,
          "candidates.view": true,
          "billing.manage": false,
          "team.manage": false,
        },
      },
    ])
    .select("id, name");

  if (roleError || !roles) {
    return { error: "Erro ao criar permissões: " + roleError?.message };
  }
  const role = roles.find((r) => r.name === "Admin")!;

  const { error: userError } = await admin.from("users").insert({
    id: userId,
    company_id: company.id,
    role_id: role.id,
    full_name: fullName,
    email,
  });

  if (userError) {
    return { error: "Erro ao criar utilizador: " + userError.message };
  }

  const { data: starterPlan } = await admin
    .from("plans")
    .select("id")
    .eq("name", "Starter")
    .single();

  if (starterPlan) {
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 14);

    await admin.from("subscriptions").insert({
      company_id: company.id,
      plan_id: starterPlan.id,
      status: "trialing",
      billing_provider: "manual",
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
    });
  }

  redirect("/dashboard");
}
