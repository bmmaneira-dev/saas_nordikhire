import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { toOne } from "@/lib/to-one";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const currentRole = toOne(appUser.roles);
  const isAdmin = currentRole?.name === "Admin";

  const company = toOne(appUser.companies);
  const dict = await getDictionary(toLocale(company?.default_locale));
  const t = dict.settingsPage;

  const admin = createAdminClient();
  const { data: companyRow } = await admin
    .from("companies")
    .select("name, industry, country, logo_url")
    .eq("id", appUser.company_id)
    .single();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
        <Link
          href="/dashboard/company"
          className="text-sm text-muted-foreground underline"
        >
          {t.backToCompany}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {t.title}
        </h1>

        <Card className="mt-6 px-6 py-6">
          {isAdmin ? (
            <SettingsForm
              name={companyRow?.name ?? ""}
              industry={companyRow?.industry ?? ""}
              country={companyRow?.country ?? "AO"}
              logoUrl={companyRow?.logo_url ?? ""}
              dict={dict}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.adminOnly}
            </p>
          )}
        </Card>
    </div>
  );
}
