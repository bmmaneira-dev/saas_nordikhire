"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";

const NAV_ITEMS = [
  { href: "/candidate/dashboard", label: "Dashboard" },
  { href: "/candidate/jobs", label: "Explorar Vagas" },
  { href: "/candidate/applications", label: "As Minhas Candidaturas" },
  { href: "/candidate/profile", label: "O Meu Perfil" },
  { href: "/candidate/tests", label: "Testes" },
  { href: "/candidate/interviews", label: "Entrevistas" },
  { href: "/candidate/practice", label: "Simulador IA" },
  { href: "/candidate/messages", label: "Mensagens" },
  { href: "/candidate/development", label: "Desenvolvimento Profissional" },
];

function isActive(pathname: string, href: string) {
  if (href === "/candidate/dashboard") return pathname === "/candidate/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export function CandidateSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-56 shrink-0 flex-col border-r border-surface-border bg-surface px-4 py-6">
      <Link href="/candidate/dashboard" className="px-2">
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
