import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-surface-border px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:justify-between">
        <div>
          <Logo />
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Plataforma de recrutamento com inteligência artificial.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <p className="font-medium text-foreground">Produto</p>
            <Link href="/#empresas" className="text-muted-foreground hover:text-foreground">
              Para empresas
            </Link>
            <Link href="/#candidatos" className="text-muted-foreground hover:text-foreground">
              Para candidatos
            </Link>
            <Link href="/#precos" className="text-muted-foreground hover:text-foreground">
              Preços
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground">
              Sobre nós
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-medium text-foreground">Conta</p>
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Entrar
            </Link>
            <Link href="/signup" className="text-muted-foreground hover:text-foreground">
              Criar conta da empresa
            </Link>
            <Link
              href="/candidate/signup"
              className="text-muted-foreground hover:text-foreground"
            >
              Criar conta de candidato
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-medium text-foreground">Legal</p>
            <Link href="/legal/terms" className="text-muted-foreground hover:text-foreground">
              Termos de serviço
            </Link>
            <Link
              href="/legal/privacy"
              className="text-muted-foreground hover:text-foreground"
            >
              Privacidade
            </Link>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-7xl text-xs text-muted-foreground">
        © {new Date().getFullYear()} NordikHire. Todos os direitos reservados.
      </p>
    </footer>
  );
}
