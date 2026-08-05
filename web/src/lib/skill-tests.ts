import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "./anthropic";

const MODEL = "claude-haiku-4-5";

export type TestCategory = "technical" | "behavioral" | "psychometric";

export const TEST_CATEGORY_LABELS: Record<TestCategory, string> = {
  technical: "Teste Técnico",
  behavioral: "Teste Comportamental",
  psychometric: "Autoavaliação de Estilo de Trabalho",
};

// Diferente de um teste psicométrico validado (ex: SHL, Hogan): não existe
// aqui nenhum instrumento normalizado nem chave de pontuação calibrada
// estatisticamente. É um sinal indicativo gerado por IA, não um substituto
// para um teste psicométrico a sério — ver REGRA DE GOVERNANÇA no schema.
export const PSYCHOMETRIC_DISCLAIMER =
  "Sinal indicativo gerado automaticamente — não é um teste psicométrico validado cientificamente. Para avaliação psicométrica formal, liga um provider especializado (ex: SHL, Hogan, Thomas) em Configurações > Integrações.";

export interface JobContext {
  title: string;
  description: string | null;
  requirementsText: string | null;
  skillsRequired: string[];
  seniorityLevel: string | null;
}

export interface GeneratedTest {
  test_name: string;
  questions: string[];
}

export interface QuestionFeedback {
  question: string;
  answer: string;
  feedback: string;
  score: number;
}

export type TestRecommendation = "advance" | "caution" | "reject" | "not_applicable";

export const RECOMMENDATION_LABELS: Record<TestRecommendation, string> = {
  advance: "Avançar",
  caution: "Avaliar com cautela",
  reject: "Não avançar",
  not_applicable: "Sem recomendação",
};

export interface TestEvaluation {
  overall_score: number;
  overall_summary: string;
  per_question: QuestionFeedback[];
  recommendation: TestRecommendation;
  recommendation_reason: string;
}

const GENERATE_SCHEMA = {
  type: "object",
  properties: {
    test_name: { type: "string" },
    questions: { type: "array", items: { type: "string" } },
  },
  required: ["test_name", "questions"],
  additionalProperties: false,
} as const;

const EVALUATE_SCHEMA = {
  type: "object",
  properties: {
    overall_score: { type: "number" },
    overall_summary: { type: "string" },
    per_question: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
          feedback: { type: "string" },
          score: { type: "number" },
        },
        required: ["question", "answer", "feedback", "score"],
        additionalProperties: false,
      },
    },
    recommendation: {
      type: "string",
      enum: ["advance", "caution", "reject", "not_applicable"],
    },
    recommendation_reason: { type: "string" },
  },
  required: [
    "overall_score",
    "overall_summary",
    "per_question",
    "recommendation",
    "recommendation_reason",
  ],
  additionalProperties: false,
} as const;

function jobSummary(job: JobContext): string {
  return `Título: ${job.title}
Senioridade: ${job.seniorityLevel ?? "não especificada"}
Skills pedidas: ${job.skillsRequired.join(", ") || "não especificadas"}
Descrição: ${job.description ?? "-"}
Requisitos: ${job.requirementsText ?? "-"}`;
}

function extractJson<T>(response: Anthropic.Message): T {
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Resposta vazia da Anthropic.");
  }
  return JSON.parse(block.text) as T;
}

const CATEGORY_INSTRUCTIONS: Record<TestCategory, string> = {
  technical:
    "Gera 5 perguntas técnicas de resposta curta/média sobre as skills e tecnologias pedidas na vaga, adequadas ao nível de senioridade indicado. Perguntas de conhecimento prático e resolução de problemas, não só teoria.",
  behavioral:
    "Gera 5 perguntas comportamentais (metodologia STAR: Situação, Tarefa, Acção, Resultado) sobre como o candidato lidou com situações de trabalho reais — colaboração, conflitos, prazos, liderança — adequadas à senioridade da vaga.",
  psychometric:
    "Gera 6 perguntas curtas de autoavaliação sobre estilo e preferências de trabalho (ex: forma de lidar com prazos, preferência por trabalho em equipa vs. individual, tolerância à ambiguidade, gestão de prioridades). Não são perguntas de personalidade clínica nem substituem um instrumento psicométrico validado — são apenas sinal qualitativo para o recrutador.",
};

export async function generateTestQuestions(
  category: TestCategory,
  job: JobContext
): Promise<GeneratedTest> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    output_config: { format: { type: "json_schema", schema: GENERATE_SCHEMA } },
    system:
      "És um assistente de recrutamento que cria testes para candidatos a uma vaga específica, em português. As perguntas devem ser claras, objectivas e directamente relevantes à vaga.",
    messages: [
      {
        role: "user",
        content: `VAGA
${jobSummary(job)}

${CATEGORY_INSTRUCTIONS[category]}

"test_name" deve ser um nome curto e descritivo para este teste (ex: "Teste Técnico: Node.js e APIs REST").`,
      },
    ],
  });

  return extractJson<GeneratedTest>(response);
}

export async function evaluateTestAnswers(
  category: TestCategory,
  job: JobContext,
  questions: string[],
  answers: string[]
): Promise<TestEvaluation> {
  const client = getAnthropicClient();

  const qa = questions
    .map((q, i) => `Pergunta ${i + 1}: ${q}\nResposta: ${answers[i] ?? "(sem resposta)"}`)
    .join("\n\n");

  const evaluationGuidance =
    category === "psychometric"
      ? 'Não existe resposta "certa" ou "errada" — avalia apenas a clareza e consistência das respostas, e atribui "score" como um indicador de completude/reflexão (não de mérito). Deixa isto explícito no "overall_summary". Usa sempre "recommendation": "not_applicable" para este tipo de teste, com "recommendation_reason" a explicar que não é uma avaliação de mérito.'
      : 'Avalia a qualidade, especificidade e correcção de cada resposta face ao que seria esperado de um profissional com a senioridade da vaga. "score" de 0 a 10 por pergunta. Com base no conjunto das respostas, dá uma "recommendation": "advance" (respostas sólidas, alinhadas com a senioridade), "caution" (mistura de respostas fortes e fracas, ou dúvidas específicas a esclarecer) ou "reject" (respostas genéricas/erradas na maioria das perguntas, não demonstram a competência esperada). "recommendation_reason" deve justificar a recomendação em 1-2 frases.';

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2500,
    output_config: { format: { type: "json_schema", schema: EVALUATE_SCHEMA } },
    system:
      "És um assistente de recrutamento que avalia respostas de candidatos a testes, de forma justa e específica, sem inventar factos que não constam das respostas.",
    messages: [
      {
        role: "user",
        content: `VAGA
${jobSummary(job)}

RESPOSTAS DO CANDIDATO
${qa}

${evaluationGuidance} "overall_score" de 0 a 100. "overall_summary" deve ter 2-4 frases em português.`,
      },
    ],
  });

  return extractJson<TestEvaluation>(response);
}
