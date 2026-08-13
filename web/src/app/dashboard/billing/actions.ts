"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { getOrCreateSubscription } from "@/lib/billing";
import { checkRateLimit } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/permissions";

export async function changePlan(planId: string) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");
  if (!hasPermission(appUser, "billing.manage")) return;

  const { allowed } = await checkRateLimit("change_plan", appUser.company_id, {
    maxAttempts: 10,
    windowMinutes: 60,
  });
  if (!allowed) return;

  const admin = createAdminClient();

  // planId chega de um <form action> ligado ao id de um plano renderizado no
  // servidor, mas a server action em si é invocável directamente com
  // qualquer valor — validar contra a tabela `plans` impede que alguém peça
  // a mudança para um id inexistente/arbitrário.
  const { data: plan } = await admin
    .from("plans")
    .select("id, name")
    .eq("id", planId)
    .maybeSingle();
  if (!plan) return;

  const subscription = await getOrCreateSubscription(admin, appUser.company_id);
  if (!subscription) return;

  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  await admin
    .from("subscriptions")
    .update({
      plan_id: plan.id,
      status: "active",
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .eq("id", subscription.id);

  // A facturação em si continua manual (ver Termos de Serviço) — este
  // registo é o que permite à equipa reconciliar quem mudou de plano e
  // quando, já que não há confirmação de pagamento automática nesta fase.
  await admin.from("audit_log").insert({
    company_id: appUser.company_id,
    user_id: appUser.id,
    action: "billing.plan_changed",
    entity_type: "subscription",
    entity_id: subscription.id,
    metadata: { from_plan_id: subscription.plan.id, to_plan_id: plan.id, to_plan_name: plan.name },
  });

  revalidatePath("/dashboard/billing");
}
