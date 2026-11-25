/**
 * An optional text field from a request body: trimmed, `null` when missing or
 * empty, and 400 when it isn't text or is longer than `max`. `name` starts the
 * error message ("Notes can be at most 2000 characters").
 */
export function optionalText(value: unknown, max: number, name: string): string | null {
  if (value == null || value === '') { return null }
  if (typeof value !== 'string') { throw createError({ statusCode: 400, message: `${name} must be text` }) }
  const text = value.trim()
  if (text.length > max) { throw createError({ statusCode: 400, message: `${name} can be at most ${max} characters` }) }
  return text || null
}
