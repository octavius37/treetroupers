/** "Lombok West!" → "lombok-west", "Zürich" → "zurich" */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    // Drop the accents NFKD split off the letters.
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'community'
}
