import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { toOne } from "@/lib/to-one";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { getOrCreateSubscription, getUsageCounts, type PlanInfo } from "@/lib/billing";
import { changePlan } from "./actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_VARIANT: Record<string, "info" | "success" | "warning" | "danger"> = {
  trialing: "info",
  active: "success",
  past_due: "warning",
  canceled: "danger",
};

function formatPrice(
  kz: number | null,
  usd: number | null,
  t: Dictionary["billing"]
) {
  if (kz == null && usd == null) return t.priceOnRequest;
  const parts: string[] = [];
  if (usd != null) parts.push(`$${usd}`);
  if (kz != null) parts.push(`${kz.toLocaleString("pt-PT")} Kz`);
  return parts.join(" · ") + t.perMonth;
}

function UsageRow({
  label,
  used,
  limit,
  unlimitedLabel,
}: {
  label: string;
  used: number;
  limit: number | null;
  unlimitedLabel: string;
}) {
  const pct = limit == null ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const overLimit = limit != null && used >= limit;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className={overLimit ? "font-medium text-danger" : "text-muted-foreground"}>
          {used} / {limit ?? unlimitedLabel}
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

  const company = toOne(appUser.companies);
  const dict = await getDictionary(toLocale(company?.default_locale));
  const t = dict.billing;

  const STATUS_LABELS: Record<string, string> = {
    trialing: t.statusTrialing,
    active: t.statusActive,
    past_due: t.statusPastDue,
    canceled: t.statusCanceled,
  };
  const FEATURE_LABELS: Record<string, string> = {
    ai_scoring: t.featureAiScoring,
    ai_interview: t.featureAiInterview,
    whatsapp: t.featureWhatsapp,
    market_trends: t.featureMarketTrends,
  };

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
    <div className="mx-auto flex w-full max-w-3xl flex-col">
        <Link
          href="/dashboard/company"
          className="text-sm text-muted-foreground underline"
        >
          {t.backToCompany}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {t.title}
        </h1>

        {subscription && (
          <Card className="mt-6 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{t.plan} {subscription.plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(
                    subscription.plan.price_monthly_kz,
                    subscription.plan.price_monthly_usd,
                    t
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
                  ? `${daysLeft} ${t.trialDaysLeft}`
                  : t.trialEnded}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3 border-t border-surface-border pt-4">
              <UsageRow
                label={t.activeJobs}
                used={usage.activeJobs}
                limit={subscription.plan.max_active_jobs}
                unlimitedLabel={t.unlimited}
              />
              <UsageRow
                label={t.teamMembers}
                used={usage.teamMembers}
                limit={subscription.plan.max_users}
                unlimitedLabel={t.unlimited}
              />
              <UsageRow
                label={t.activeApplications}
                used={usage.activeApplications}
                limit={subscription.plan.max_active_applications}
                unlimitedLabel={t.unlimited}
              />
            </div>
          </Card>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-medium">{t.plans}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.plansSubtitle}
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {(plans as PlanInfo[] | null)?.map((plan) => {
              const isCurrent = subscription?.plan.id === plan.id;
              return (
                <Card key={plan.id} className="flex flex-col px-5 py-4">
                  <p className="font-medium">{plan.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatPrice(plan.price_monthly_kz, plan.price_monthly_usd, t)}
                  </p>
                  <ul className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
                    <li>
                      {plan.max_active_jobs ?? t.unlimited} {t.activeJobs}
                    </li>
                    <li>{plan.max_users ?? t.unlimited} {t.teamMembers}</li>
                    <li>
                      {plan.max_active_applications ?? t.unlimited} {t.activeApplications}
                    </li>
                    {Object.entries(plan.features)
                      .filter(([, enabled]) => enabled)
                      .map(([key]) => (
                        <li key={key}>✓ {FEATURE_LABELS[key] ?? key}</li>
                      ))}
                  </ul>
                  <div className="mt-4">
                    {isCurrent ? (
                      <Badge variant="info">{t.currentPlan}</Badge>
                    ) : isAdmin ? (
                      <form action={changePlan.bind(null, plan.id)}>
                        <Button type="submit" variant="secondary" size="sm">
                          {t.switchToThisPlan}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
    </div>
  );
}
