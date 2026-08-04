import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "./anthropic";

const MODEL = "claude-haiku-4-5";

export interface TrainingRecommendation {
  gap: string;
  suggested_topic: string;
  resource_type: string;
}

export interface DevelopmentReportResult {
  strengths: string[];
  technical_gaps: string[];
  behavioral_gaps: string[];
  training_recommendations: TrainingRecommendation[];
  overall_summary: string;
}

const REPORT_SCHEMA = {
  type: "object",
  properties: {
    strengths: { type: "array", items: { type: "string" } },
    technical_gaps: { type: "array", items: { type: "string" } },
    behavioral_gaps: { type: "array", items: { type: "string" } },
    training_recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          gap: { type: "string" },
          suggested_topic: { type: "string" },
          resource_type: { type: "string" },
        },
        required: ["gap", "suggested_topic", "resource_type"],
        additionalProperties: false,
      },
    },
    overall_summary: { type: "string" },
  },
  required: [
    "strengths",
    "technical_gaps",
    "behavioral_gaps",
    "training_recommendations",
    "overall_summary",
  ],
  additionalProperties: false,
} as const;

export interface ReportInputs {
  jobTitle: string;
  candidateName: string;
  cvScore: number | null;
  cvBreakdown: Record<string, number> | null;
  cvReasoning: string | null;
  redFlags: { flag_type: string; severity: string; description: string | null }[];
  interviewSummary: string | null;
  interviewEvaluation: Record<string, number> | null;
  testResults: {
    test_name: string | null;
    category: string | null;
    score: number | null;
    summary: string | null;
    recommendation: string | null;
  }[];
}

function extractJson<T>(response: Anthropic.Message): T {
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Resposta vazia da Anthropic.");
  }
  return JSON.parse(block.text) as T;
}

export async function generateDevelopmentReport(
  input: ReportInputs
): Promise<DevelopmentReportResult> {
  const client = getAnthropicClient();

  const parts: string[] = [
    `VAGA: ${input.jobTitle}`,
    `CANDIDATO: ${input.candidateName}`,
  ];

  if (input.cvScore != null) {
    parts.push(
      `\nSCORE DO CV: ${input.cvScore}/100\nBreakdown: ${JSON.stringify(
        input.cvBreakdown
      )}\nRaciocínio: ${input.cvReasoning ?? "-"}`
    );
  }

  if (input.redFlags.length > 0) {
    parts.push(
      `\nRED FLAGS:\n${input.redFlags
        .map((f) => `- [${f.severity}] ${f.flag_type}: ${f.description}`)
        .join("\n")}`
    );
  }

  if (input.interviewSummary) {
    parts.push(
      `\nENTREVISTA SIMULADA:\nAvaliação: ${JSON.stringify(
        input.interviewEvaluation
      )}\nResumo: ${input.interviewSummary}`
    );
  }

  if (input.testResults.length > 0) {
    parts.push(
      `\nTESTES:\n${input.testResults
        .map(
          (t) =>
            `- ${t.test_name} (${t.category}): score ${t.score ?? "-"}. ${t.summary ?? ""} Recomendação: ${t.recommendation ?? "-"}`
        )
        .join("\n")}`
    );
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    output_config: { format: { type: "json_schema", schema: REPORT_SCHEMA } },
    system:
      "És um assistente de RH que sintetiza toda a informação disponível sobre um candidato (CV, entrevista, testes) num relatório de desenvolvimento claro e accionável, em português. Baseia-te apenas na informação fornecida, sem inventar factos. Serve tanto para apoiar a decisão de contratação como, opcionalmente, para dar feedback construtivo ao candidato.",
    messages: [
      {
        role: "user",
        content: `${parts.join("\n")}

Produz um relatório de desenvolvimento com: pontos fortes, lacunas técnicas, lacunas comportamentais, recomendações de formação (tópico + tipo de recurso, ex: 'curso_online', 'livro', 'mentoria', 'prática'), e um resumo geral (2-3 frases).`,
      },
    ],
  });

  return extractJson<DevelopmentReportResult>(response);
}
