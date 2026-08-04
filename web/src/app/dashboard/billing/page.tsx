import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { toOne } from "@/lib/to-one";
import { getOrCreateSubscription, getUsageCounts, type PlanInfo } from "@/lib/billing";
import { changePlan } from "./actions";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  trialing: "Em período de teste",
  active: "Activa",
  past_due: "Pagamento em atraso",
  canceled: "Cancelada",
};

const STATUS_VARIANT: Record<string, "info" | "success" | "warning" | "danger"> = {
  trialing: "info",
  active: "success",
  past_due: "warning",
  canceled: "danger",
};

const FEATURE_LABELS: Record<string, string> = {
  ai_scoring: "Scoring de CV por IA",
  ai_interview: "Entrevista simulada por IA",
  whatsapp: "Candidaturas via WhatsApp",
  market_trends: "Tendências de mercado",
};

function formatPrice(kz: number | null, usd: number | null) {
  if (kz == null && usd == null) return "Sob consulta";
  const parts: string[] = [];
  if (usd != null) parts.push(`$${usd}`);
  if (kz != null) parts.push(`${kz.toLocaleString("pt-PT")} Kz`);
  return parts.join(" · ") + "/mês";
}

function UsageRow({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const pct = limit == null ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const overLimit = limit != null && used >= limit;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className={overLimit ? "font-medium text-danger" : "text-muted-foreground"}>
          {used} / {limit ?? "ilimitado"}
        </span>
      </div>
      {limit != null && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className={`h-full rounded-full ${overLimit ? "bg-danger" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default async function BillingPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const currentRole = toOne(appUser.roles);
  const isAdmin = currentRole?.name === "Admin";

  const admin = createAdminClient();
  const subscription = await getOrCreateSubscription(admin, appUser.company_id);
  const usage = await getUsageCounts(admin, appUser.company_id);

  const { data: plans } = await admin
    .from("plans")
    .select(
      "id, name, price_monthly_kz, price_monthly_usd, max_active_jobs, max_users, max_active_applications, overage_price_per_application, features"
    )
    .order("price_monthly_usd", { ascending: true, nullsFirst: false });

  const daysLeft =
    subscription?.status === "trialing" && subscription.current_period_end
      ? Math.max(
          0,
          Math.ceil(
            (new Date(subscription.current_period_end).getTime() - Date.now()) /
              86400000
          )
        )
      : null;

  return (
    <>
      <PageHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground underline"
        >
          ← Voltar ao dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Facturação
        </h1>

        {subscription && (
          <Card className="mt-6 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Plano {subscription.plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(
                    subscription.plan.price_monthly_kz,
                    subscription.plan.price_monthly_usd
                  )}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[subscription.status] ?? "neutral"}>
                {STATUS_LABELS[subscription.status] ?? subscription.status}
              </Badge>
            </div>
            {daysLeft != null && (
              <p className="mt-2 text-sm text-muted-foreground">
                {daysLeft > 0
                  ? `${daysLeft} dia(s) restantes no período de teste.`
                  : "O período de teste terminou."}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3 border-t border-surface-border pt-4">
              <UsageRow
                label="Vagas activas"
                used={usage.activeJobs}
                limit={subscription.plan.max_active_jobs}
              />
              <UsageRow
                label="Membros da equipa"
                used={usage.teamMembers}
                limit={subscription.plan.max_users}
              />
              <UsageRow
                label="Candidaturas activas"
                used={usage.activeApplications}
                limit={subscription.plan.max_active_applications}
              />
            </div>
          </Card>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-medium">Planos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Facturação manual nesta fase — mudar de plano actualiza o limite
            de imediato, a factura é tratada directamente com a equipa
            NordikHire.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {(plans as PlanInfo[] | null)?.map((plan) => {
              const isCurrent = subscription?.plan.id === plan.id;
              return (
                <Card key={plan.id} className="flex flex-col px-5 py-4">
                  <p className="font-medium">{plan.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatPrice(plan.price_monthly_kz, plan.price_monthly_usd)}
                  </p>
                  <ul className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
                    <li>
                      {plan.max_active_jobs ?? "Ilimitadas"} vaga(s) activa(s)
                    </li>
                    <li>{plan.max_users ?? "Ilimitados"} membro(s) de equipa</li>
                    <li>
                      {plan.max_active_applications ?? "Ilimitadas"} candidatura(s)
                      activa(s)
                    </li>
                    {Object.entries(plan.features)
                      .filter(([, enabled]) => enabled)
                      .map(([key]) => (
                        <li key={key}>✓ {FEATURE_LABELS[key] ?? key}</li>
                      ))}
                  </ul>
                  <div className="mt-4">
                    {isCurrent ? (
                      <Badge variant="info">Plano actual</Badge>
                    ) : isAdmin ? (
                      <form action={changePlan.bind(null, plan.id)}>
                        <Button type="submit" variant="secondary" size="sm">
                          Mudar para este plano
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
