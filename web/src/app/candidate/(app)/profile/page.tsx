import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { toLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";

export default async function CandidateProfilePage() {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect("/candidate/login");

  const dict = await getDictionary(toLocale(candidate.preferred_locale));
  const t = dict.candidateProfilePage;

  const admin = createAdminClient();
  const { data: fullCandidate } = await admin
    .from("candidates")
    .select("full_name, email, phone, linkedin_url")
    .eq("id", candidate.id)
    .single();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {fullCandidate?.email}
      </p>

      <Card className="mt-6 max-w-xl px-6 py-6">
        <ProfileForm
          fullName={fullCandidate?.full_name ?? ""}
          phone={fullCandidate?.phone ?? ""}
          linkedinUrl={fullCandidate?.linkedin_url ?? ""}
          dict={dict}
        />
      </Card>

      <Card className="mt-4 max-w-xl border-dashed px-6 py-5 shadow-none">
        <p className="text-sm font-medium text-foreground">{t.cvHeading}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.cvBodyBefore}{" "}
          <Link
            href="/candidate/applications"
            className="text-primary underline"
          >
            {t.cvLinkLabel}
          </Link>
          {t.cvBodyAfter}
        </p>
      </Card>
    </>
  );
}
