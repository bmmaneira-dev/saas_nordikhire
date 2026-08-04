import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export default async function CandidatePracticeIndexPage() {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const admin = createAdminClient();
  const { data: sessions } = await admin
    .from("candidate_interview_practice")
    .select("id, target_role, status, created_at")
    .eq("candidate_id", candidate.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Simulador IA
        </h1>
        <ButtonLink href="/candidate/practice/new" size="sm">
          Praticar entrevista
        </ButtonLink>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Treina para entrevistas reais com um entrevistador simulado por IA —
        perguntas personalizadas para o cargo, feedback em tempo real, pontos
        fortes e a melhorar. Independente de qualquer candidatura — nunca
        visto por nenhuma empresa nem usado em nenhum processo de selecção.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {(sessions?.length ?? 0) === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            Ainda não praticaste nenhuma entrevista.
          </Card>
        )}
        {sessions?.map((session) => (
          <Card key={session.id} className="px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{session.target_role}</span>
              <Badge variant={statusVariant(session.status)}>
                {session.status}
              </Badge>
            </div>
            <Link
              href={`/candidate/practice/${session.id}`}
              className="mt-2 inline-block text-sm font-medium text-primary underline"
            >
              {session.status === "completed" ? "Ver avaliação →" : "Continuar →"}
            </Link>
          </Card>
        ))}
      </ul>
    </>
  );
}
