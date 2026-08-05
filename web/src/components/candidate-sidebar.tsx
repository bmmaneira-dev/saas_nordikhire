"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

function isActive(pathname: string, href: string) {
  if (href === "/candidate/dashboard") return pathname === "/candidate/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export function CandidateSidebar({
  labels,
}: {
  labels: Dictionary["candidateNav"];
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/candidate/dashboard", label: labels.dashboard },
    { href: "/candidate/jobs", label: labels.jobs },
    { href: "/candidate/applications", label: labels.applications },
    { href: "/candidate/profile", label: labels.profile },
    { href: "/candidate/tests", label: labels.tests },
    { href: "/candidate/interviews", label: labels.interviews },
    { href: "/candidate/practice", label: labels.practice },
    { href: "/candidate/messages", label: labels.messages },
    { href: "/candidate/development", label: labels.development },
  ];

  return (
    <nav className="flex h-full w-56 shrink-0 flex-col border-r border-surface-border bg-surface px-4 py-6">
      <Link href="/candidate/dashboard" className="px-2">
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
