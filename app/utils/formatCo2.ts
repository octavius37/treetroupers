/** "45 kg", "1.2 t" — CO₂ in a size people can picture. */
export function formatCo2(kg: number): string {
  if (kg >= 1000) { return `${(kg / 1000).toFixed(kg >= 10_000 ? 0 : 1)} t` }
  return `${Math.round(kg)} kg`
}
