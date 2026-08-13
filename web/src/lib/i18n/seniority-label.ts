import type { Dictionary } from "./dictionaries/pt";

const SENIORITY_KEYS = {
  junior: "seniorityJunior",
  pleno: "seniorityMid",
  senior: "senioritySenior",
  lead: "seniorityLead",
} as const satisfies Record<string, keyof Dictionary["newJob"]>;

export function seniorityLabel(
  dict: Dictionary,
  level: string | null | undefined
): string {
  if (!level) return "—";
  const key = SENIORITY_KEYS[level as keyof typeof SENIORITY_KEYS];
  return key ? dict.newJob[key] : level;
}
