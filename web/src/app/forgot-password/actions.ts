"use server";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function requestPasswordReset(
  _prevState: unknown,
  formData: FormData
) {
  const email = String(formData.get("email") ?? "").trim();
  const origin = process.env.SITE_URL ?? "http://localhost:3000";

  if (!email) {
    return { error: "Indica o teu email." };
  }

  const ip = await getClientIp();
  const [byIp, byEmail] = await Promise.all([
    checkRateLimit("password_reset_ip", ip, { maxAttempts: 10, windowMinutes: 60 }),
    checkRateLimit("password_reset_email", email, {
      maxAttempts: 3,
      windowMinutes: 15,
    }),
  ]);

  // Se excedeu o limite, respondemos com o mesmo sucesso silencioso em vez
  // de pedir o reset, para não revelar o motivo nem se o email existe.
  if (byIp.allowed && byEmail.allowed) {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    // Não revelamos se o email existe ou não, para evitar enumeração de contas.
    if (error) {
      console.error("Erro ao pedir reset de password:", error.message);
    }
  }

  return { success: true };
}
