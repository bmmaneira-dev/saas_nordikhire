import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { candidateLogout } from "@/app/candidate/login/actions";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { CandidateSidebar } from "@/components/candidate-sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function CandidateAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const dict = await getDictionary(toLocale(candidate.preferred_locale));

  return (
    <div className="flex min-h-screen flex-1">
      <CandidateSidebar labels={dict.candidateNav} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-surface-border bg-surface px-8 py-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {candidate.full_name}
            </p>
            <p className="text-xs text-muted-foreground">{candidate.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action={candidateLogout}>
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
