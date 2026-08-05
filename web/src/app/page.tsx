import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/current-user";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanInfo } from "@/lib/billing";
import { LandingPage } from "@/components/marketing/landing-page";

export default async function Home() {
  const [appUser, candidate] = await Promise.all([
    getCurrentAppUser(),
    getCurrentCandidate(),
  ]);

  if (appUser) redirect("/dashboard");
  if (candidate) redirect("/candidate/dashboard");

  const admin = createAdminClient();
  const { data: plans } = await admin
    .from("plans")
    .select(
      "id, name, price_monthly_kz, price_monthly_usd, max_active_jobs, max_users, max_active_applications, overage_price_per_application, features"
    )
    .order("price_monthly_usd", { ascending: true, nullsFirst: false });

  return <LandingPage plans={(plans as PlanInfo[] | null) ?? []} />;
}
