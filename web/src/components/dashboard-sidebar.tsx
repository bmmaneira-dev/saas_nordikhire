"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/jobs", label: "Vagas" },
  { href: "/dashboard/candidates", label: "Candidatos" },
  { href: "/dashboard/pipeline", label: "Pipeline" },
  { href: "/dashboard/tests", label: "Testes" },
  { href: "/dashboard/interviews", label: "Entrevistas" },
  { href: "/dashboard/talent-pool", label: "Banco de Talentos" },
  { href: "/dashboard/messages", label: "Mensagens" },
  { href: "/dashboard/reports", label: "Relatórios" },
  { href: "/dashboard/company", label: "Empresa" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-56 shrink-0 flex-col border-r border-surface-border bg-surface px-4 py-6">
      <Link href="/dashboard" className="px-2">
        <Logo />
      </Link>
      <ul className="mt-8 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-surface-muted"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
