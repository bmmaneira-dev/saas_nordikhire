"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function login(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Preenche email e password." };
  }

  const ip = await getClientIp();
  const [byIp, byEmail] = await Promise.all([
    checkRateLimit("login_ip", ip, { maxAttempts: 20, windowMinutes: 60 }),
    checkRateLimit("login_email", email, { maxAttempts: 10, windowMinutes: 15 }),
  ]);
  if (!byIp.allowed || !byEmail.allowed) {
    return { error: "Demasiadas tentativas. Tenta novamente mais tarde." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const admin = createAdminClient();
  const { data: appUser } = await admin
    .from("users")
    .select("company_id")
    .eq("id", data.user.id)
    .maybeSingle();
  if (appUser) {
    await admin.from("audit_log").insert({
      company_id: appUser.company_id,
      user_id: data.user.id,
      action: "auth.login",
    });
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
