// Neutral grey placeholder artwork for image slots that have no real image yet.
//
// The CMS page HTML repeated this exact data URI 27 times across six pages. It
// lives here so `ImageSlot` has one definition to fall back on, and so the
// bytes stay identical to what the CMS rendered — the single quotes inside the
// SVG are escaped rather than percent-encoded, because `%27` would decode to a
// different `src` string than the published pages used.
export const PLACEHOLDER_IMAGE
  = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 400 300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23e5e7eb\'/%3E%3Ccircle cx=\'140\' cy=\'110\' r=\'30\' fill=\'%239ca3af\'/%3E%3Cpath d=\'M0 260 L120 150 L200 220 L280 130 L400 260 Z\' fill=\'%239ca3af\'/%3E%3C/svg%3E'
