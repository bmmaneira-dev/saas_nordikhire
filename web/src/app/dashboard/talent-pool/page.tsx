import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/current-user";
import { Card } from "@/components/ui/card";

export default async function TalentPoolPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        Banco de Talentos
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Candidatos que podem ser reutilizados em futuras vagas.
      </p>

      <Card className="mt-6 border-dashed px-6 py-10 text-center shadow-none">
        <p className="font-medium text-foreground">Em breve</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pesquisa por competências, talent pools organizados por área, e
          recomendações da IA de candidatos anteriores adequados a novas
          vagas. Entretanto, usa a secção{" "}
          <a href="/dashboard/candidates" className="text-primary underline">
            Candidatos
          </a>{" "}
          para pesquisar todos os candidatos que já se candidataram.
        </p>
      </Card>
    </>
  );
}
