import { redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { toOne } from "@/lib/to-one";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  rejection: "Rejeição",
  next_stage: "Próxima fase",
  improvement_tips: "Feedback",
};

export default async function CandidateMessagesPage() {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const dict = await getDictionary(toLocale(candidate.preferred_locale));
  const t = dict.candidateMessagesPage;

  const admin = createAdminClient();
  const { data: messages } = await admin
    .from("candidate_feedback")
    .select(
      "id, feedback_type, content, created_at, applications!inner(candidate_id, jobs(job_translations(title, locale), companies(name)))"
    )
    .eq("applications.candidate_id", candidate.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.subtitle}
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {(messages?.length ?? 0) === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            {t.noMessages}
          </Card>
        )}
        {messages?.map((message) => {
          const application = toOne(message.applications);
          const job = toOne(application?.jobs);
          const company = toOne(job?.companies);
          const title =
            job?.job_translations.find((tr) => tr.locale === "pt")?.title ??
            job?.job_translations[0]?.title;
          return (
            <Card key={message.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{company?.name}</p>
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
