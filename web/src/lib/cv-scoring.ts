import { getPath } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import { getAnthropicClient } from "./anthropic";
import { createAdminClient } from "./supabase/admin";

// Required in Node/Next.js server environments so pdfjs-dist (used under the
// hood by pdf-parse) doesn't try to spawn a browser-style worker and fail
// with "Setting up fake worker failed".
PDFParse.setWorker(getPath());

// Haiku 4.5 does not support output_config.effort (errors if sent) — only
// omit/include thinking and structured-output format, both of which it does
// support.
const MODEL = "claude-haiku-4-5";

export const CV_BUCKET = "cvs";

const SCORING_SCHEMA = {
  type: "object",
  properties: {
    extraction: {
      type: "object",
      properties: {
        full_name: { type: ["string", "null"] },
        email: { type: ["string", "null"] },
        phone: { type: ["string", "null"] },
        skills: { type: "array", items: { type: "string" } },
        experience_years: { type: ["number", "null"] },
        education: { type: "array", items: { type: "string" } },
        languages: { type: "array", items: { type: "string" } },
        previous_roles: { type: "array", items: { type: "string" } },
      },
      required: [
        "full_name",
        "email",
        "phone",
        "skills",
        "experience_years",
        "education",
        "languages",
        "previous_roles",
      ],
      additionalProperties: false,
    },
    confidence_score: { type: "number" },
    score: {
      type: "object",
      properties: {
        overall_score: { type: "number" },
        breakdown: {
          type: "object",
          properties: {
            skills_match: { type: "number" },
            experience_match: { type: "number" },
            education_match: { type: "number" },
            language_match: { type: "number" },
          },
          required: [
            "skills_match",
            "experience_match",
            "education_match",
            "language_match",
          ],
          additionalProperties: false,
        },
        reasoning: { type: "string" },
      },
      required: ["overall_score", "breakdown", "reasoning"],
      additionalProperties: false,
    },
    red_flags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          flag_type: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          description: { type: "string" },
        },
        required: ["flag_type", "severity", "description"],
        additionalProperties: false,
      },
    },
  },
  required: ["extraction", "confidence_score", "score", "red_flags"],
  additionalProperties: false,
} as const;

export interface JobContext {
  title: string;
  description: string | null;
  requirementsText: string | null;
  skillsRequired: string[];
  seniorityLevel: string | null;
}

export interface ScoringResult {
  extraction: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    skills: string[];
    experience_years: number | null;
    education: string[];
    languages: string[];
    previous_roles: string[];
  };
  confidence_score: number;
  score: {
    overall_score: number;
    breakdown: {
      skills_match: number;
      experience_match: number;
      education_match: number;
      language_match: number;
    };
    reasoning: string;
  };
  red_flags: {
    flag_type: string;
    severity: "low" | "medium" | "high";
    description: string;
  }[];
}

async function extractPdfText(data: Uint8Array): Promise<string> {
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function callClaudeForScoring(
  cvText: string,
  job: JobContext
): Promise<ScoringResult> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    output_config: {
      format: { type: "json_schema", schema: SCORING_SCHEMA },
    },
    system:
      "És um assistente de recrutamento. Extrais dados estruturados de CVs, calculas um score de compatibilidade (0-100) entre um candidato e uma vaga, e identificas red flags — sem inventar dados que não estão no CV.",
    messages: [
      {
        role: "user",
        content: `VAGA
Título: ${job.title}
Senioridade: ${job.seniorityLevel ?? "não especificada"}
Skills pedidas: ${job.skillsRequired.join(", ") || "nenhuma especificada"}
Descrição: ${job.description ?? "-"}
Requisitos: ${job.requirementsText ?? "-"}

CV DO CANDIDATO (texto extraído do PDF):
"""
${cvText.slice(0, 12000)}
"""

Extrai os dados do CV (incluindo nome completo, email e telefone se estiverem presentes no texto — caso contrário usa null, não inventes) e calcula o score de compatibilidade com a vaga. "reasoning" deve ter 2-4 frases em português.

Identifica também red flags claramente presentes no CV — ex: gaps de emprego não explicados, inconsistências entre datas ou cargos, sobrequalificação significativa para o nível da vaga, mudanças de carreira frequentes sem explicação. Não inventes red flags que não estejam suportadas pelo texto; se não houver nenhuma, devolve uma lista vazia. "description" deve ser 1-2 frases em português.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Resposta vazia da Anthropic.");
  }
  return JSON.parse(textBlock.text) as ScoringResult;
}

export async function loadJobContext(
  jobId: string
): Promise<JobContext | null> {
  const admin = createAdminClient();

  const { data: job } = await admin
    .from("jobs")
    .select(
      "skills_required, seniority_level, job_translations(title, description, requirements_text, locale)"
    )
    .eq("id", jobId)
    .single();

  if (!job) return null;

  const translation =
    job.job_translations.find((t: { locale: string }) => t.locale === "pt") ??
    job.job_translations[0];

  return {
    title: translation?.title ?? "",
    description: translation?.description ?? null,
    requirementsText: translation?.requirements_text ?? null,
    skillsRequired: Array.isArray(job.skills_required)
      ? (job.skills_required as string[])
      : [],
    seniorityLevel: job.seniority_level,
  };
}

export async function extractAndScoreCv(
  cvBytes: Uint8Array,
  job: JobContext
): Promise<{ result: ScoringResult; cvText: string }> {
  const cvText = await extractPdfText(cvBytes);
  if (!cvText.trim()) {
    throw new Error("CV vazio ou ilegível.");
  }
  const result = await callClaudeForScoring(cvText, job);
  return { result, cvText };
}

export async function writeScoringResult(
  applicationId: string,
  result: ScoringResult,
  cvText: string
) {
  const admin = createAdminClient();

  await admin.from("cv_extractions").insert({
    application_id: applicationId,
    raw_text: cvText.slice(0, 20000),
    parsed_data: result.extraction,
    ai_model: MODEL,
    confidence_score: result.confidence_score,
  });

  await admin.from("scoring_results").insert({
    application_id: applicationId,
    overall_score: result.score.overall_score,
    breakdown: result.score.breakdown,
    ai_model: MODEL,
    ai_reasoning: result.score.reasoning,
  });

  await admin
    .from("applications")
    .update({
      score_total: result.score.overall_score,
      status: "scored",
    })
    .eq("id", applicationId);

  if (result.red_flags.length > 0) {
    await admin.from("red_flags").insert(
      result.red_flags.map((flag) => ({
        application_id: applicationId,
        flag_type: flag.flag_type,
        severity: flag.severity,
        description: flag.description,
      }))
    );
  }
}

export async function ensureCvBucket(
  admin: ReturnType<typeof createAdminClient>
) {
  const { data: bucket } = await admin.storage.getBucket(CV_BUCKET);
  if (!bucket) {
    await admin.storage.createBucket(CV_BUCKET, { public: false });
  }
}

export async function scoreApplication(
  applicationId: string,
  jobId: string,
  cvBytes: Uint8Array
) {
  const job = await loadJobContext(jobId);
  if (!job) return;

  let scored: { result: ScoringResult; cvText: string };
  try {
    scored = await extractAndScoreCv(cvBytes, job);
  } catch {
    return;
  }

  await writeScoringResult(applicationId, scored.result, scored.cvText);
}
