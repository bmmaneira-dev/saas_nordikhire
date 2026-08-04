import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { toOne } from "@/lib/to-one";
import { AuthShell } from "@/components/auth-shell";
import { InviteAcceptForm } from "./accept-form";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("company_invites")
    .select("id, email, full_name, status, companies(name), roles(name)")
    .eq("token", token)
    .maybeSingle();

  if (!invite) notFound();

  const company = toOne(invite.companies);
  const role = toOne(invite.roles);

  if (invite.status !== "pending") {
    return (
      <AuthShell
        title="Convite já utilizado"
        subtitle="Este link de convite já não é válido. Pede um novo convite a quem te convidou."
        footer={
          <Link href="/login" className="font-medium text-primary underline">
            Ir para o login
          </Link>
        }
      >
        <></>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={`Juntar-te a ${company?.name}`}
      subtitle={`Foste convidado(a) como ${role?.name}. Cria a tua password para aceder.`}
      footer={
        <>
          Já tens conta?{" "}
          <Link href="/login" className="font-medium text-primary underline">
            Entrar
          </Link>
        </>
      }
    >
      <InviteAcceptForm
        token={token}
        email={invite.email}
        defaultFullName={invite.full_name ?? ""}
      />
    </AuthShell>
  );
}
