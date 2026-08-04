"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function candidateLogin(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Preenche email e password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/candidate/dashboard");
}

export async function candidateLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/candidate/login");
}
