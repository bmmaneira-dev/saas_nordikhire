import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getCurrentAppUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: appUser } = await admin
    .from("users")
    .select(
      "id, full_name, email, company_id, companies(name, slug, default_locale), roles(name, permissions)"
    )
    .eq("id", user.id)
    .single();

  return appUser;
}
