import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { toOne } from "@/lib/to-one";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const currentRole = toOne(appUser.roles);
  const isAdmin = currentRole?.name === "Admin";

  const admin = createAdminClient();
  const { data: company } = await admin
    .from("companies")
    .select("name, industry, country, logo_url")
    .eq("id", appUser.company_id)
    .single();

  return (
    <>
      <PageHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground underline"
        >
          ← Voltar ao dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Perfil da empresa
        </h1>

        <Card className="mt-6 px-6 py-6">
          {isAdmin ? (
            <SettingsForm
              name={company?.name ?? ""}
              industry={company?.industry ?? ""}
              country={company?.country ?? "AO"}
              logoUrl={company?.logo_url ?? ""}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Só administradores podem editar o perfil da empresa.
            </p>
          )}
        </Card>
      </main>
    </>
  );
}
