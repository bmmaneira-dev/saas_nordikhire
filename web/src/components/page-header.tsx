import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";

export function PageHeader({
  href = "/",
  children,
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-surface-border bg-surface">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href={href}>
          <Logo />
        </Link>
        {children}
      </div>
    </header>
  );
}
