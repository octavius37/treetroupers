// Strips tags from CMS-authored HTML and truncates to a plain-text teaser for
// blog listing cards, breaking on a word boundary rather than mid-word.
export function excerptFromHtml(html: string | null, maxLength = 200): string {
  const text = (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= maxLength) {
    return text
  }

  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trimEnd()}…`
}
