import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

const SOURCE_LABELS: Record<string, string> = {
  linkedin: "Perfil de LinkedIn",
  cv: "CV",
  other_platform: "Outra plataforma",
};

export default async function CandidateDevelopmentPage() {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const admin = createAdminClient();
  const { data: optimizations } = await admin
    .from("candidate_profile_optimizations")
    .select("id, source_type, source_label, overall_score, generated_at")
    .eq("candidate_id", candidate.id)
    .order("generated_at", { ascending: false });

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Desenvolvimento Profissional
        </h1>
        <ButtonLink href="/candidate/optimize/new" size="sm">
          Nova análise
        </ButtonLink>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Recebe feedback e sugestões de reescrita para o teu LinkedIn ou CV.
        Ferramenta pessoal — nunca partilhada com empresas nem usada em
        nenhuma candidatura. Lacunas de competências por vaga, cursos
        recomendados e um plano de carreira personalizado ficam para uma
        próxima fase.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {(optimizations?.length ?? 0) === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            Ainda não analisaste o teu perfil ou CV.
          </Card>
        )}
        {optimizations?.map((optimization) => (
          <Card key={optimization.id} className="px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {optimization.source_label ||
                  SOURCE_LABELS[optimization.source_type] ||
                  optimization.source_type}
              </span>
              {optimization.overall_score != null && (
                <span className="text-lg font-semibold text-primary">
                  {Math.round(optimization.overall_score)}
                </span>
              )}
            </div>
            <Link
              href={`/candidate/optimize/${optimization.id}`}
              className="mt-2 inline-block text-sm font-medium text-primary underline"
            >
              Ver análise →
            </Link>
          </Card>
        ))}
      </ul>
    </>
  );
}
