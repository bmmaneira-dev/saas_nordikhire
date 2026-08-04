import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { toOne } from "@/lib/to-one";
import { revokeInvite, setTeammateActive } from "./actions";
import { InviteForm } from "./invite-form";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const DEFAULT_ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  Recrutador: {
    "jobs.create": true,
    "jobs.delete": false,
    "candidates.view": true,
    "billing.manage": false,
    "team.manage": false,
  },
};

export default async function TeamPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const currentRole = toOne(appUser.roles);
  const isAdmin = currentRole?.name === "Admin";

  const admin = createAdminClient();

  let { data: roles } = await admin
    .from("roles")
    .select("id, name")
    .eq("company_id", appUser.company_id)
    .order("name");

  // Empresas criadas antes do papel "Recrutador" existir só têm "Admin" —
  // cria-o de forma preguiçosa para não exigir uma migração de dados à parte.
  if (isAdmin && !roles?.some((r) => r.name === "Recrutador")) {
    const { data: newRole } = await admin
      .from("roles")
      .insert({
        company_id: appUser.company_id,
        name: "Recrutador",
        permissions: DEFAULT_ROLE_PERMISSIONS.Recrutador,
      })
      .select("id, name")
      .single();
    if (newRole) roles = [...(roles ?? []), newRole];
  }

  const { data: teammates } = await admin
    .from("users")
    .select("id, full_name, email, is_active, roles(name)")
    .eq("company_id", appUser.company_id)
    .order("created_at");

  const { data: invites } = await admin
    .from("company_invites")
    .select("id, email, full_name, token, created_at, roles(name)")
    .eq("company_id", appUser.company_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const headerList = await headers();
  const origin =
    headerList.get("x-forwarded-proto") && headerList.get("host")
      ? `${headerList.get("x-forwarded-proto")}://${headerList.get("host")}`
      : `http://${headerList.get("host") ?? "localhost:3000"}`;

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
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Equipa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gere quem tem acesso ao dashboard da tua empresa.
        </p>

        {isAdmin && (
          <section className="mt-8">
            <h2 className="text-lg font-medium">Convidar colega</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ainda não temos envio de email — copia o link gerado e envia
              directamente ao colega.
            </p>
            <div className="mt-4">
              <InviteForm roles={roles ?? []} />
            </div>
          </section>
        )}

        {isAdmin && invites && invites.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-medium">Convites pendentes</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {invites.map((invite) => {
                const role = toOne(invite.roles);
                const link = `${origin}/signup/invite/${invite.token}`;
                return (
                  <Card key={invite.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          {invite.full_name || invite.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {invite.email} · {role?.name}
                        </p>
                      </div>
                      <form action={revokeInvite.bind(null, invite.id)}>
                        <Button type="submit" variant="ghost" size="sm">
                          Revogar
                        </Button>
                      </form>
                    </div>
                    <p className="mt-2 break-all rounded-lg bg-surface-muted px-3 py-2 text-xs text-muted-foreground">
                      {link}
                    </p>
                  </Card>
                );
              })}
            </ul>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-medium">Membros da equipa</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {teammates?.map((teammate) => {
              const role = toOne(teammate.roles);
              const isSelf = teammate.id === appUser.id;
              return (
                <Card key={teammate.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {teammate.full_name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (tu)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {teammate.email} · {role?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={teammate.is_active ? "success" : "neutral"}>
                        {teammate.is_active ? "activo" : "inactivo"}
                      </Badge>
                      {isAdmin && !isSelf && (
                        <form
                          action={setTeammateActive.bind(
                            null,
                            teammate.id,
                            !teammate.is_active
                          )}
                        >
                          <Button type="submit" variant="ghost" size="sm">
                            {teammate.is_active ? "Desactivar" : "Reactivar"}
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </ul>
        </section>
      </main>
    </>
  );
}
