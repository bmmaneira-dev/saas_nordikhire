import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/current-user";
import { logout } from "@/app/login/actions";
import { toOne } from "@/lib/to-one";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const company = toOne(appUser.companies);

  return (
    <div className="flex min-h-screen flex-1">
      <DashboardSidebar />
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
          <form action={logout}>
            <Button type="submit" variant="secondary" size="sm">
              Sair
            </Button>
          </form>
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
