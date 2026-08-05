"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
