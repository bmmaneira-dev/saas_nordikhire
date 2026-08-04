import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { toOne } from "@/lib/to-one";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  rejection: "Rejeição",
  next_stage: "Próxima fase",
  improvement_tips: "Feedback",
};

export default async function MessagesIndexPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const admin = createAdminClient();
  const { data: messages } = await admin
    .from("candidate_feedback")
    .select(
      "id, feedback_type, content, sent_at, created_at, application_id, applications!inner(company_id, job_id, candidates(full_name), jobs(job_translations(title, locale)))"
    )
    .eq("applications.company_id", appUser.company_id)
    .order("created_at", { ascending: false });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Mensagens</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Histórico de feedback enviado a candidatos, em todas as vagas. Sem
        WhatsApp ou email real ligados ainda — as mensagens ficam registadas
        aqui e visíveis ao candidato na sua área.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {(messages?.length ?? 0) === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            Ainda não enviaste nenhuma mensagem.
          </Card>
        )}
        {messages?.map((message) => {
          const application = toOne(message.applications);
          const candidate = toOne(application?.candidates);
          const job = toOne(application?.jobs);
          const title =
            job?.job_translations.find((t) => t.locale === "pt")?.title ??
            job?.job_translations[0]?.title;

          return (
            <Card key={message.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/dashboard/jobs/${application?.job_id}#candidate-${message.application_id}`}
                    className="font-medium text-primary underline"
                  >
                    {candidate?.full_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{title}</p>
                </div>
                <Badge variant="neutral">
                  {FEEDBACK_TYPE_LABELS[message.feedback_type ?? ""] ??
                    message.feedback_type}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-foreground/90">
                {message.content}
              </p>
            </Card>
          );
        })}
      </ul>
    </>
  );
}
