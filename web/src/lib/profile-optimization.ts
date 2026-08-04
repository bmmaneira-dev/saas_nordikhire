import { getAnthropicClient } from "./anthropic";

const MODEL = "claude-haiku-4-5";

export interface SectionFeedback {
  section: string;
  current: string;
  feedback: string;
  suggested_rewrite: string;
}

export interface ProfileOptimizationResult {
  overall_score: number;
  overall_summary: string;
  strengths: string[];
  weaknesses: string[];
  section_feedback: SectionFeedback[];
}

const OPTIMIZATION_SCHEMA = {
  type: "object",
  properties: {
    overall_score: { type: "number" },
    overall_summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    section_feedback: {
      type: "array",
      items: {
        type: "object",
        properties: {
          section: { type: "string" },
          current: { type: "string" },
          feedback: { type: "string" },
          suggested_rewrite: { type: "string" },
        },
        required: ["section", "current", "feedback", "suggested_rewrite"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "overall_score",
    "overall_summary",
    "strengths",
    "weaknesses",
    "section_feedback",
  ],
  additionalProperties: false,
} as const;

const SOURCE_LABELS: Record<string, string> = {
  linkedin: "perfil de LinkedIn",
  cv: "CV",
  other_platform: "perfil noutra plataforma de emprego",
};

export async function optimizeProfile(
  sourceType: string,
  inputText: string
): Promise<ProfileOptimizationResult> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    output_config: {
      format: { type: "json_schema", schema: OPTIMIZATION_SCHEMA },
    },
    system:
      "És um consultor de carreira que ajuda candidatos a melhorarem o seu próprio perfil profissional (LinkedIn, CV ou similar) para se apresentarem melhor no mercado de trabalho. Esta ferramenta é de uso pessoal do candidato — não está ligada a nenhuma candidatura, vaga ou processo de selecção específico, e a tua avaliação nunca deve mencionar ou comparar com nenhuma empresa. Dá feedback honesto, específico e construtivo, em português.",
    messages: [
      {
        role: "user",
        content: `O candidato colou o texto do seu ${
          SOURCE_LABELS[sourceType] ?? "perfil profissional"
        } abaixo. Analisa secção a secção (ex: headline/título, resumo, experiência, competências) o que existir no texto, identifica pontos fortes e fracos gerais, atribui uma força geral do perfil de 0 a 100, e sugere reescritas concretas para as secções mais fracas.

TEXTO DO CANDIDATO:
${inputText}`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Resposta vazia da Anthropic.");
  }
  return JSON.parse(block.text) as ProfileOptimizationResult;
}
