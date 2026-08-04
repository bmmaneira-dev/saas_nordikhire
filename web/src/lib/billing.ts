import { createAdminClient } from "./supabase/admin";

export interface PlanInfo {
  id: string;
  name: string;
  price_monthly_kz: number | null;
  price_monthly_usd: number | null;
  max_active_jobs: number | null;
  max_users: number | null;
  max_active_applications: number | null;
  overage_price_per_application: number | null;
  features: Record<string, boolean>;
}

export interface SubscriptionInfo {
  id: string;
  status: string;
  billing_provider: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  plan: PlanInfo;
}

function toOnePlan(value: PlanInfo | PlanInfo[] | null): PlanInfo | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// Empresas criadas antes desta funcionalidade existir não têm subscrição —
// cria-se uma no plano Starter em modo trial, de forma preguiçosa, para não
// exigir uma migração de dados à parte.
export async function getOrCreateSubscription(
  admin: ReturnType<typeof createAdminClient>,
  companyId: string
): Promise<SubscriptionInfo | null> {
  const { data: existing } = await admin
    .from("subscriptions")
    .select(
      "id, status, billing_provider, current_period_start, current_period_end, plans(id, name, price_monthly_kz, price_monthly_usd, max_active_jobs, max_users, max_active_applications, overage_price_per_application, features)"
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const plan = toOnePlan(existing.plans as PlanInfo | PlanInfo[] | null);
    if (!plan) return null;
    return { ...existing, plan };
  }

  const { data: starterPlan } = await admin
    .from("plans")
    .select("id")
    .eq("name", "Starter")
    .single();
  if (!starterPlan) return null;

  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 14);

  const { data: created } = await admin
    .from("subscriptions")
    .insert({
      company_id: companyId,
      plan_id: starterPlan.id,
      status: "trialing",
      billing_provider: "manual",
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .select(
      "id, status, billing_provider, current_period_start, current_period_end, plans(id, name, price_monthly_kz, price_monthly_usd, max_active_jobs, max_users, max_active_applications, overage_price_per_application, features)"
    )
    .single();

  if (!created) return null;
  const plan = toOnePlan(created.plans as PlanInfo | PlanInfo[] | null);
  if (!plan) return null;
  return { ...created, plan };
}

export interface UsageCounts {
  activeJobs: number;
  teamMembers: number;
  activeApplications: number;
}

export async function getUsageCounts(
  admin: ReturnType<typeof createAdminClient>,
  companyId: string
): Promise<UsageCounts> {
  const [jobsResult, usersResult, applicationsResult] = await Promise.all([
    admin
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "open"),
    admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("is_active", true),
    admin
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .not("status", "in", "(hired,rejected,withdrawn)"),
  ]);

  return {
    activeJobs: jobsResult.count ?? 0,
    teamMembers: usersResult.count ?? 0,
    activeApplications: applicationsResult.count ?? 0,
  };
}
