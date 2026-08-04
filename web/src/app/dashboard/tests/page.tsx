import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { toOne } from "@/lib/to-one";
import {
  TEST_CATEGORY_LABELS,
  RECOMMENDATION_LABELS,
  type TestRecommendation,
} from "@/lib/skill-tests";
import { Card } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";

const RECOMMENDATION_VARIANT: Record<
  TestRecommendation,
  "success" | "warning" | "danger" | "neutral"
> = {
  advance: "success",
  caution: "warning",
  reject: "danger",
  not_applicable: "neutral",
};

const TABS = [
  { key: "all", label: "Todos" },
  { key: "technical", label: "Técnicos" },
  { key: "behavioral", label: "Comportamentais" },
  { key: "psychometric", label: "Psicométricos" },
] as const;

export default async function TestsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const { category } = await searchParams;
  const activeTab = TABS.find((t) => t.key === category) ?? TABS[0];

  const admin = createAdminClient();
  const { data: tests } = await admin
    .from("test_assignments")
    .select(
      "id, test_name, status, result_score, result_raw, assigned_at, application_id, applications!inner(company_id, job_id, candidates(full_name), jobs(job_translations(title, locale)))"
    )
    .eq("applications.company_id", appUser.company_id)
    .order("assigned_at", { ascending: false });

  const filtered = (tests ?? []).filter((test) => {
    if (activeTab.key === "all") return true;
    const category = (
      test.result_raw as { category?: string } | null
    )?.category;
    return category === activeTab.key;
  });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Testes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Todos os testes atribuídos a candidatos, em todas as vagas.
      </p>

      <div className="mt-6 flex gap-1 border-b border-surface-border">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/dashboard/tests?category=${tab.key}`}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab.key === activeTab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {filtered.length === 0 && (
          <Card className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground shadow-none">
            Nenhum teste nesta categoria.
          </Card>
        )}
        {filtered.map((test) => {
          const application = toOne(test.applications);
          const candidate = toOne(application?.candidates);
          const job = toOne(application?.jobs);
          const title =
            job?.job_translations.find((t) => t.locale === "pt")?.title ??
            job?.job_translations[0]?.title;
          const resultRaw = test.result_raw as {
            category?: string;
            recommendation?: TestRecommendation;
          } | null;

          return (
            <Card key={test.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/dashboard/jobs/${application?.job_id}#candidate-${test.application_id}`}
                    className="font-medium text-primary underline"
                  >
                    {candidate?.full_name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {title} · {test.test_name}
                    {resultRaw?.category
                      ? ` · ${TEST_CATEGORY_LABELS[resultRaw.category as keyof typeof TEST_CATEGORY_LABELS] ?? resultRaw.category}`
                      : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {test.result_score != null && (
                    <span className="text-lg font-semibold text-primary">
                      {Math.round(test.result_score)}
                    </span>
                  )}
                  <div className="mt-1">
                    <Badge variant={statusVariant(test.status)}>
                      {test.status}
                    </Badge>
                  </div>
                </div>
              </div>
              {resultRaw?.recommendation &&
                resultRaw.recommendation !== "not_applicable" && (
                  <div className="mt-2">
                    <Badge variant={RECOMMENDATION_VARIANT[resultRaw.recommendation]}>
                      {RECOMMENDATION_LABELS[resultRaw.recommendation]}
                    </Badge>
                  </div>
                )}
            </Card>
          );
        })}
      </ul>
    </>
  );
}
