import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { statusLabel } from "@/lib/i18n/status-label";
import { Card } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export default async function CandidatePracticeIndexPage() {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const dict = await getDictionary(toLocale(candidate.preferred_locale));
  const t = dict.candidatePracticeList;

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
          {t.title}
        </h1>
        <ButtonLink href="/candidate/practice/new" size="sm">
          {t.practiceInterview}
        </ButtonLink>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.subtitle}
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {(sessions?.length ?? 0) === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            {t.noSessions}
          </Card>
        )}
        {sessions?.map((session) => (
          <Card key={session.id} className="px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{session.target_role}</span>
              <Badge variant={statusVariant(session.status)}>
                {statusLabel(dict, session.status)}
              </Badge>
            </div>
            <Link
              href={`/candidate/practice/${session.id}`}
              className="mt-2 inline-block text-sm font-medium text-primary underline"
            >
              {session.status === "completed" ? t.viewEvaluation : t.continueSession}
            </Link>
          </Card>
        ))}
      </ul>
    </>
  );
}
