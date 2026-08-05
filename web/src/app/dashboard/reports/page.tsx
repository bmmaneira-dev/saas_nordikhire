import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/current-user";
import { toOne } from "@/lib/to-one";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Card } from "@/components/ui/card";

export default async function ReportsPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const company = toOne(appUser.companies);
  const dict = await getDictionary(toLocale(company?.default_locale));
  const t = dict.reportsPlaceholder;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>

      <Card className="mt-6 border-dashed px-6 py-10 text-center shadow-none">
        <p className="font-medium text-foreground">{dict.comingSoon.label}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.bodyBefore}{" "}
          <a href="/dashboard" className="text-primary underline">
            {t.dashboardLabel}
          </a>{" "}
          {t.bodyMiddle}{" "}
          <a href="/dashboard/pipeline" className="text-primary underline">
            {t.pipelineLabel}
          </a>{" "}
          {t.bodyAfter}
        </p>
      </Card>
    </>
  );
}
