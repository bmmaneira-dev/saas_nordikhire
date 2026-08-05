import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/current-user";
import { logout } from "@/app/login/actions";
import { toOne } from "@/lib/to-one";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const company = toOne(appUser.companies);
  const dict = await getDictionary(toLocale(company?.default_locale));

  return (
    <div className="flex min-h-screen flex-1">
      <DashboardSidebar labels={dict.nav} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-surface-border bg-surface px-8 py-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {company?.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {appUser.full_name} · {appUser.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action={logout}>
              <Button type="submit" variant="secondary" size="sm">
                {dict.common.signOut}
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
