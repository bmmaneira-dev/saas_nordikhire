// Independente do que o schema JSON pede ao modelo, nunca confiamos cegamente
// no valor devolvido — uma resposta manipulada (ver nota de segurança nos
// prompts que usam texto de terceiros) não deve conseguir gravar um score
// fora do intervalo esperado.
export function clampScore(value: unknown, min = 0, max = 100): number {
  const num = typeof value === "number" && Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, num));
}
