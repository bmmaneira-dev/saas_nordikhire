export const SUPPORTED_LOCALES = ["pt", "en", "fr", "es"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  fr: "Français",
  es: "Español",
};

export const DEFAULT_LOCALE: Locale = "pt";

export function isSupportedLocale(
  value: string | null | undefined
): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function toLocale(value: string | null | undefined): Locale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

const DATE_LOCALE_MAP: Record<Locale, string> = {
  pt: "pt-PT",
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
};

export function toDateLocale(locale: Locale): string {
  return DATE_LOCALE_MAP[locale];
}
