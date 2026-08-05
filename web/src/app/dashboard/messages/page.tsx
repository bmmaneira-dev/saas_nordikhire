import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
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

export default async function MessagesIndexPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const company = toOne(appUser.companies);
  const dict = await getDictionary(toLocale(company?.default_locale));
  const t = dict.messagesList;

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
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>

      <ul className="mt-6 flex flex-col gap-3">
        {(messages?.length ?? 0) === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            {t.noneSent}
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
