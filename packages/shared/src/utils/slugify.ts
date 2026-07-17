/**
 * ASCII slugs for URLs. Devanagari-only names produce an empty slug —
 * the admin panel requires an explicit slug in that case (Phase 8).
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
