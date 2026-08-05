import type { Dictionary } from "./dictionaries/pt";

export function statusLabel(dict: Dictionary, status: string): string {
  const map = dict.status as Record<string, string>;
  return map[status] ?? status;
}
