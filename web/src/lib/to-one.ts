/**
 * Supabase-js types embedded to-one relations as arrays when no generated
 * Database type is supplied, but PostgREST actually returns a single object
 * at runtime for a to-one relation (e.g. jobs.company_id -> companies.id).
 * This normalizes either shape to a single item.
 */
export function toOne<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}
