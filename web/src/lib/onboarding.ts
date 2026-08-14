import { createAdminClient } from "./supabase/admin";
import type { Dictionary } from "./i18n/get-dictionary";

export interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
}

export async function getOnboardingSteps(
  admin: ReturnType<typeof createAdminClient>,
  companyId: string,
  t: Dictionary["onboardingSteps"]
): Promise<OnboardingStep[]> {
  const [companyResult, usersResult, invitesResult, jobsResult, progressResult] =
    await Promise.all([
      admin.from("companies").select("industry").eq("id", companyId).single(),
      admin
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_active", true),
      admin
        .from("company_invites")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId),
      admin
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId),
      admin
        .from("company_onboarding_progress")
        .select("step")
        .eq("company_id", companyId)
        .eq("step", "integrations_reviewed")
        .maybeSingle(),
    ]);

  return [
    {
      key: "account_created",
      label: t.accountCreatedLabel,
      description: t.accountCreatedDescription,
      href: "/dashboard",
      done: true,
    },
    {
      key: "company_profile",
      label: t.companyProfileLabel,
      description: t.companyProfileDescription,
      href: "/dashboard/settings",
      done: !!companyResult.data?.industry,
    },
    {
      key: "first_job_created",
      label: t.firstJobLabel,
      description: t.firstJobDescription,
      href: "/dashboard/jobs/new",
      done: (jobsResult.count ?? 0) > 0,
    },
    {
      key: "invited_team",
      label: t.invitedTeamLabel,
      description: t.invitedTeamDescription,
      href: "/dashboard/team",
      done: (usersResult.count ?? 0) > 1 || (invitesResult.count ?? 0) > 0,
    },
    {
      key: "integrations_reviewed",
      label: t.integrationsReviewedLabel,
      description: t.integrationsReviewedDescription,
      // Aponta para a lista de vagas — é lá que scoring de CV, entrevistas
      // simuladas e testes automáticos são visíveis numa candidatura real.
      // Apontava incorrectamente para /dashboard/billing.
      href: "/dashboard/jobs",
      done: !!progressResult.data,
    },
  ];
}
