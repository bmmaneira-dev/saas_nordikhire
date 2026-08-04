import { createAdminClient } from "./supabase/admin";

export interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
}

export async function getOnboardingSteps(
  admin: ReturnType<typeof createAdminClient>,
  companyId: string
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
      label: "Conta criada",
      description: "A tua conta e empresa já estão registadas.",
      href: "/dashboard",
      done: true,
    },
    {
      key: "company_profile",
      label: "Completa o perfil da empresa",
      description: "Indica o sector de actividade da tua empresa.",
      href: "/dashboard/settings",
      done: !!companyResult.data?.industry,
    },
    {
      key: "first_job_created",
      label: "Cria a tua primeira vaga",
      description: "Publica uma vaga para começares a receber candidaturas.",
      href: "/dashboard/jobs/new",
      done: (jobsResult.count ?? 0) > 0,
    },
    {
      key: "invited_team",
      label: "Convida a tua equipa",
      description: "Junta colegas recrutadores à tua empresa.",
      href: "/dashboard/team",
      done: (usersResult.count ?? 0) > 1 || (invitesResult.count ?? 0) > 0,
    },
    {
      key: "integrations_reviewed",
      label: "Explora as ferramentas de IA",
      description:
        "Conhece o scoring de CV, entrevistas simuladas e testes gerados por IA.",
      href: "/dashboard/billing",
      done: !!progressResult.data,
    },
  ];
}
