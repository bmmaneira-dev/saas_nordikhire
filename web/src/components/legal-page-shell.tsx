import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";

export function LegalPageShell({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <Link href="/" className="text-sm text-muted-foreground underline">
          Voltar ao site
        </Link>
      </div>

      <h1 className="mt-10 text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Última actualização: {updatedAt}
      </p>

      <div className="prose-legal mt-8 flex flex-col gap-6 text-sm leading-relaxed text-foreground/90">
        {children}
      </div>

      <div className="mt-16 flex gap-4 border-t border-surface-border pt-6 text-sm">
        <Link href="/legal/terms" className="text-primary underline">
          Termos de serviço
        </Link>
        <Link href="/legal/privacy" className="text-primary underline">
          Política de privacidade
        </Link>
      </div>
    </div>
  );
}
