"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentCandidate } from "@/lib/current-candidate";

const TERMINAL_STATUSES = ["hired", "rejected", "withdrawn"];

export async function withdrawApplication(applicationId: string) {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const admin = createAdminClient();
  const { data: application } = await admin
    .from("applications")
    .select("id, status")
    .eq("id", applicationId)
    .eq("candidate_id", candidate.id)
    .maybeSingle();

  if (!application || TERMINAL_STATUSES.includes(application.status)) return;

  await admin
    .from("applications")
    .update({ status: "withdrawn", stage_updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  revalidatePath("/candidate/applications");
  revalidatePath("/candidate/dashboard");
}
