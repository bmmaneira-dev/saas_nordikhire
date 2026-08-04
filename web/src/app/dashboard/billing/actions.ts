"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { getOrCreateSubscription } from "@/lib/billing";

function isAdmin(appUser: { roles: { name: string } | { name: string }[] | null }) {
  const role = Array.isArray(appUser.roles) ? appUser.roles[0] : appUser.roles;
  return role?.name === "Admin";
}

export async function changePlan(planId: string) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");
  if (!isAdmin(appUser)) return;

  const admin = createAdminClient();
  const subscription = await getOrCreateSubscription(admin, appUser.company_id);
  if (!subscription) return;

  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  await admin
    .from("subscriptions")
    .update({
      plan_id: planId,
      status: "active",
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .eq("id", subscription.id);

  revalidatePath("/dashboard/billing");
}
