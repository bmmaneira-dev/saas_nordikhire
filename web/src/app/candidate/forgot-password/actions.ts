"use server";

import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(
  _prevState: unknown,
  formData: FormData
) {
  const email = String(formData.get("email") ?? "").trim();
  const origin = String(formData.get("origin") ?? "").trim();

  if (!email) {
    return { error: "Indica o teu email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/candidate/reset-password`,
  });

  // Não revelamos se o email existe ou não, para evitar enumeração de contas.
  if (error) {
    console.error("Erro ao pedir reset de password:", error.message);
  }

  return { success: true };
}
