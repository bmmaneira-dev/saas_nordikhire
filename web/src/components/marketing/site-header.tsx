import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/about" className="hover:text-foreground">
            Sobre nós
          </Link>
          <Link href="/#empresas" className="hover:text-foreground">
            Para empresas
          </Link>
          <Link href="/#candidatos" className="hover:text-foreground">
            Para candidatos
          </Link>
          <Link href="/#precos" className="hover:text-foreground">
            Preços
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
          >
            Entrar
          </Link>
          <ButtonLink href="/signup" size="sm">
            Sou uma empresa
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
