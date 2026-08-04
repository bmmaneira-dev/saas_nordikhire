import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/current-user";
import { Card } from "@/components/ui/card";

const SECTIONS = [
  {
    href: "/dashboard/settings",
    title: "Perfil da empresa",
    description: "Nome, sector de actividade, país e logótipo.",
  },
  {
    href: "/dashboard/team",
    title: "Equipa de recrutamento",
    description: "Convida colegas e gere quem tem acesso ao dashboard.",
  },
  {
    href: "/dashboard/billing",
    title: "Plano de subscrição",
    description: "Plano actual, uso e opções de facturação.",
  },
];

export default async function CompanyIndexPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Empresa</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Informações da empresa e da conta.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full px-5 py-4 transition-colors hover:bg-surface-muted">
              <p className="font-medium text-foreground">{section.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {section.description}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
