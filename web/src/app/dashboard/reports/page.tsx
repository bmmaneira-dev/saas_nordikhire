import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/current-user";
import { Card } from "@/components/ui/card";

export default async function ReportsPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Métricas e desempenho do recrutamento.
      </p>

      <Card className="mt-6 border-dashed px-6 py-10 text-center shadow-none">
        <p className="font-medium text-foreground">Em breve</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Tempo médio de contratação, conversão por etapa do pipeline, origem
          dos candidatos, performance por vaga, e exportações. Entretanto, o{" "}
          <a href="/dashboard" className="text-primary underline">
            Dashboard
          </a>{" "}
          já mostra os KPIs principais e a{" "}
          <a href="/dashboard/pipeline" className="text-primary underline">
            Pipeline
          </a>{" "}
          dá uma vista visual do funil por etapa.
        </p>
      </Card>
    </>
  );
}
