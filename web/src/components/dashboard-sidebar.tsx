"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export function DashboardSidebar({ labels }: { labels: Dictionary["nav"] }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: labels.dashboard },
    { href: "/dashboard/jobs", label: labels.jobs },
    { href: "/dashboard/candidates", label: labels.candidates },
    { href: "/dashboard/pipeline", label: labels.pipeline },
    { href: "/dashboard/tests", label: labels.tests },
    { href: "/dashboard/interviews", label: labels.interviews },
    { href: "/dashboard/talent-pool", label: labels.talentPool },
    { href: "/dashboard/messages", label: labels.messages },
    { href: "/dashboard/reports", label: labels.reports },
    { href: "/dashboard/company", label: labels.company },
  ];

  return (
    <nav className="flex h-full w-56 shrink-0 flex-col border-r border-surface-border bg-surface px-4 py-6">
      <Link href="/dashboard" className="px-2">
        <Logo />
      </Link>
      <ul className="mt-8 flex flex-col gap-0.5">
        {navItems.map((item) => {
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
