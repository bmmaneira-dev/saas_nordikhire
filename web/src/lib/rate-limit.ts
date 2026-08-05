import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

// Contador de tentativas simples, apoiado na base de dados (sem depender de
// nenhum serviço externo). Suficiente para travar abuso básico de
// formulários públicos nesta fase do produto.
export async function checkRateLimit(
  bucket: string,
  key: string,
  { maxAttempts, windowMinutes }: { maxAttempts: number; windowMinutes: number }
): Promise<{ allowed: boolean }> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { count } = await admin
    .from("rate_limit_hits")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucket)
    .eq("key", key)
    .gte("created_at", since);

  if ((count ?? 0) >= maxAttempts) {
    return { allowed: false };
  }

  await admin.from("rate_limit_hits").insert({ bucket, key });

  // Limpeza oportunista para o registo não crescer sem limite, sem precisar
  // de um cron job dedicado.
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await admin
    .from("rate_limit_hits")
    .delete()
    .eq("bucket", bucket)
    .lt("created_at", oneDayAgo);

  return { allowed: true };
}
