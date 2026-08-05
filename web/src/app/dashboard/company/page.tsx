import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/current-user";
import { toOne } from "@/lib/to-one";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Card } from "@/components/ui/card";

export default async function CompanyIndexPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const company = toOne(appUser.companies);
  const dict = await getDictionary(toLocale(company?.default_locale));
  const t = dict.companyLanding;

  const SECTIONS = [
    {
      href: "/dashboard/settings",
      title: t.profileTitle,
      description: t.profileDescription,
    },
    {
      href: "/dashboard/team",
      title: t.teamTitle,
      description: t.teamDescription,
    },
    {
      href: "/dashboard/billing",
      title: t.billingTitle,
      description: t.billingDescription,
    },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>

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
