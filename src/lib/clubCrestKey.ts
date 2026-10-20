/** Accent, punctuation and case independent identity; never fuzzy-match clubs at runtime. */
export function clubCrestKey(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}
