import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/current-user";
import { toOne } from "@/lib/to-one";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET() {
  const appUser = await getCurrentAppUser();
  if (!appUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: applications } = await admin
    .from("applications")
    .select(
      "status, score_total, source, applied_at, candidates(full_name, email), jobs(job_translations(title, locale))"
    )
    .eq("company_id", appUser.company_id)
    .order("applied_at", { ascending: false });

  const header = [
    "candidato",
    "email",
    "vaga",
    "estado",
    "score",
    "origem",
    "data_candidatura",
  ];
  const lines = [header.join(",")];

  for (const row of applications ?? []) {
    const candidate = toOne(row.candidates);
    const job = toOne(row.jobs);
    const title =
      job?.job_translations.find((tr) => tr.locale === "pt")?.title ??
      job?.job_translations[0]?.title ??
      "";
    lines.push(
      [
        csvEscape(candidate?.full_name ?? ""),
        csvEscape(candidate?.email ?? ""),
        csvEscape(title),
        csvEscape(row.status),
        row.score_total != null ? String(row.score_total) : "",
        csvEscape(row.source),
        csvEscape(row.applied_at),
      ].join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-candidaturas.csv"`,
    },
  });
}
