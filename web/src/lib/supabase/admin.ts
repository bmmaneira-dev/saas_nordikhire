import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client: bypasses RLS entirely. Server-only — never import
 * this from a Client Component. Used because most tables in the schema
 * have RLS enabled without matching policies yet (only jobs, applications,
 * candidate_profile_optimizations have policies), so tenant isolation for
 * everything else is enforced in application code (explicit company_id
 * filters) until the remaining policies are written.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
