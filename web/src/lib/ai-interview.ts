import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "./anthropic";

const MODEL = "claude-haiku-4-5";

export interface JobContext {
  title: string;
  description: string | null;
  requirementsText: string | null;
  skillsRequired: string[];
  seniorityLevel: string | null;
}

export interface CandidateContext {
  fullName: string;
  parsedCv: Record<string, unknown> | null;
}

export interface TranscriptTurn {
  role: "ai" | "candidate";
  text: string;
}

export interface EvaluationResult {
  communication: number;
  technical_depth: number;
  problem_solving: number;
  cultural_fit: number;
  summary: string;
}

const EVALUATION_SCHEMA = {
  type: "object",
  properties: {
    communication: { type: "number" },
    technical_depth: { type: "number" },
    problem_solving: { type: "number" },
    cultural_fit: { type: "number" },
    summary: { type: "string" },
  },
  required: [
    "communication",
    "technical_depth",
    "problem_solving",
    "cultural_fit",
    "summary",
  ],
  additionalProperties: false,
} as const;

function buildSystemPrompt(job: JobContext, candidate: CandidateContext) {
  return `Estás a conduzir uma entrevista simulada de recrutamento em nome de uma empresa, para a vaga "${job.title}".
Senioridade: ${job.seniorityLevel ?? "não especificada"}. Skills pretendidas: ${
    job.skillsRequired.join(", ") || "não especificadas"
  }.
${job.requirementsText ? `Requisitos: ${job.requirementsText}` : ""}

Candidato: ${candidate.fullName}.
${
  candidate.parsedCv
    ? `Dados extraídos do CV: ${JSON.stringify(candidate.parsedCv)}`
    : "Ainda não há CV analisado."
}

Conduz a entrevista em português, um turno de cada vez: faz UMA pergunta por mensagem, e faz perguntas de acompanhamento relevantes com base no que o candidato disser e no perfil da vaga. Cobre experiência técnica, resolução de problemas e adequação comportamental. Sê profissional, breve e directo — nunca mais do que um parágrafo curto por mensagem. Não repitas perguntas já feitas.`;
}

function extractText(response: Anthropic.Message): string {
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Resposta vazia da Anthropic.");
  }
  return block.text;
}

export async function generateOpeningMessage(
  job: JobContext,
  candidate: CandidateContext
): Promise<string> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    system: buildSystemPrompt(job, candidate),
    messages: [
      {
        role: "user",
        content: "Começa a entrevista com uma saudação breve e a primeira pergunta.",
      },
    ],
  });
  return extractText(response);
}

export async function generateReply(
  transcript: TranscriptTurn[],
  job: JobContext,
  candidate: CandidateContext
): Promise<string> {
  const client = getAnthropicClient();
  const messages: Anthropic.MessageParam[] = transcript.map((turn) => ({
    role: turn.role === "ai" ? "assistant" : "user",
    content: turn.text,
  }));

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    system: buildSystemPrompt(job, candidate),
    messages,
  });
  return extractText(response);
}

export async function generateEvaluation(
  transcript: TranscriptTurn[],
  job: JobContext
): Promise<EvaluationResult> {
  const client = getAnthropicClient();
  const transcriptText = transcript
    .map((t) => `${t.role === "ai" ? "Entrevistador" : "Candidato"}: ${t.text}`)
    .join("\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    output_config: {
      format: { type: "json_schema", schema: EVALUATION_SCHEMA },
    },
    system:
      "Avalias entrevistas de recrutamento com base na transcrição fornecida. Sê justo e específico, sem inventar factos que não constam da conversa.",
    messages: [
      {
        role: "user",
        content: `VAGA: ${job.title}
Skills pretendidas: ${job.skillsRequired.join(", ") || "não especificadas"}

TRANSCRIÇÃO DA ENTREVISTA:
${transcriptText}

Avalia o candidato nas dimensões pedidas (0-10) e escreve um resumo (2-4 frases, em português) das forças e fraquezas observadas.`,
      },
    ],
  });

  const text = extractText(response);
  return JSON.parse(text) as EvaluationResult;
}
