import { getAnthropicClient } from "./anthropic";

const MODEL = "claude-haiku-4-5";

export const SUPPORTED_LOCALES = ["pt", "en", "fr", "es"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  fr: "Français",
  es: "Español",
};

export interface JobTranslationContent {
  title: string;
  description: string;
  requirements_text: string;
}

const TRANSLATION_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    requirements_text: { type: "string" },
  },
  required: ["title", "description", "requirements_text"],
  additionalProperties: false,
} as const;

export async function translateJobContent(
  source: JobTranslationContent,
  targetLocale: Locale
): Promise<JobTranslationContent> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    output_config: {
      format: { type: "json_schema", schema: TRANSLATION_SCHEMA },
    },
    system: `És um tradutor profissional especializado em anúncios de emprego. Traduzes fielmente para ${LOCALE_LABELS[targetLocale]} (código "${targetLocale}"), mantendo o tom profissional e sem adicionar ou remover informação.`,
    messages: [
      {
        role: "user",
        content: `TÍTULO:
${source.title}

DESCRIÇÃO:
${source.description}

REQUISITOS:
${source.requirements_text}

Traduz os três campos para ${LOCALE_LABELS[targetLocale]}.`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Resposta vazia da Anthropic.");
  }
  return JSON.parse(block.text) as JobTranslationContent;
}
