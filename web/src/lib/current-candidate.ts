import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getCurrentCandidate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: candidate } = await admin
    .from("candidates")
    .select("id, full_name, email, auth_user_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return candidate;
}
