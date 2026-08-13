import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// x-forwarded-for is, by default, whatever the CLIENT sends — a direct
// attacker can set any value they like unless a trusted reverse proxy in
// front of this app strips/overwrites it. We don't know the exact hosting
// platform this runs behind (no infra config lives in this repo), so this
// takes the LAST hop of the header instead of the first: in a standard
// single-trusted-proxy chain, each proxy APPENDS the peer IP it observed,
// so the right-most entry is the one set by the proxy closest to this app —
// anything a client prepends before that is attacker-controlled and
// ignored. If this is deployed behind more than one trusted proxy hop,
// adjust the offset from the end accordingly.
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((ip) => ip.trim());
    return hops[hops.length - 1] || "unknown";
  }
  return h.get("x-real-ip") ?? "unknown";
}

// Contador de tentativas simples, apoiado na base de dados (sem depender de
// nenhum serviço externo). O check-then-record corre inteiro dentro de uma
// única função Postgres (ver migração atomic_rate_limit_check), serializada
// por (bucket, key) via advisory lock — evita a corrida que permitia a N
// pedidos concorrentes passarem todos pelo mesmo limite.
export async function checkRateLimit(
  bucket: string,
  key: string,
  { maxAttempts, windowMinutes }: { maxAttempts: number; windowMinutes: number }
): Promise<{ allowed: boolean }> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("check_and_record_rate_limit", {
    p_bucket: bucket,
    p_key: key,
    p_max_attempts: maxAttempts,
    p_window_minutes: windowMinutes,
  });

  // Ao contrário do comportamento anterior, uma falha aqui NÃO deixa passar
  // por omissão — um erro na base de dados não deve desactivar o limite.
  if (error) {
    console.error("Erro no rate limit:", error.message);
    return { allowed: false };
  }

  return { allowed: data === true };
}
