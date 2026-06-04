/* eslint-disable regexp/prefer-character-class -- explicit alternations read clearer for Tailwind utility values */
import type { Config } from 'tailwindcss'

// CMS-safelist: utility classes that admins may type into the page builder
// (saved to DB, never seen by Tailwind's content scanner) need explicit safelisting,
// otherwise they have no CSS on the public /[slug] pages.
//
// Variants (hover, focus, sm/md/lg) are added where the cost/benefit makes sense.
// Total CSS-size cost is in the low-hundreds of KB and one-time cached.

const COLORS = 'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|gray|slate|zinc|neutral|stone|white|black'
const SHADES = '50|100|200|300|400|500|600|700|800|900|950'
const SPACING = '0|0\\.5|1|1\\.5|2|2\\.5|3|3\\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96'
const SCREENS = ['sm', 'md', 'lg']

export default {
  safelist: [
    // ─── Colors ─────────────────────────────────────────────────────────────
    // text-{color}-{shade}, bg-, border-, ring-, fill-, stroke- + hover/focus
    {
      pattern: new RegExp(`^(text|bg|border|ring|fill|stroke)-(${COLORS})(-(${SHADES}))?$`),
      variants: ['hover', 'focus'],
    },

    // ─── Gradients ──────────────────────────────────────────────────────────
    { pattern: /^bg-gradient-to-([tr]|tr|br|[bl]|bl|tl)$/ },
    { pattern: new RegExp(`^(from|via|to)-(${COLORS})(-(${SHADES}))?$`) },

    // ─── Spacing ────────────────────────────────────────────────────────────
    // padding, margin, gap, space-x/y — responsive
    {
      pattern: new RegExp(`^([pm][xytrbl]?|gap(-[xy])?|space-[xy])-(${SPACING})$`),
      variants: SCREENS,
    },

    // ─── Typography ─────────────────────────────────────────────────────────
    { pattern: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/, variants: SCREENS },
    { pattern: /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/ },
    { pattern: /^text-(left|center|right|justify)$/ },
    { pattern: /^leading-(none|tight|snug|normal|relaxed|loose|[3-9]|10)$/ },
    { pattern: /^tracking-(tighter|tight|normal|wide|wider|widest)$/ },
    'italic',
    'not-italic',
    'underline',
    'no-underline',
    'line-through',
    'uppercase',
    'lowercase',
    'capitalize',

    // ─── Display / layout ───────────────────────────────────────────────────
    {
      pattern: /^(block|inline-block|inline|flex|inline-flex|grid|inline-grid|hidden|contents)$/,
      variants: SCREENS,
    },
    { pattern: /^flex-(row|col|row-reverse|col-reverse|wrap|nowrap|wrap-reverse|1|auto|initial|none)$/ },
    { pattern: /^(grow|shrink)(-0)?$/ },

    // ─── Grid ───────────────────────────────────────────────────────────────
    { pattern: /^grid-cols-([1-9]|10|11|12)$/, variants: SCREENS },
    { pattern: /^grid-rows-([1-6])$/ },
    { pattern: /^col-span-([1-9]|10|11|12|full)$/ },
    { pattern: /^row-span-([1-6]|full)$/ },

    // ─── Alignment ──────────────────────────────────────────────────────────
    { pattern: /^items-(start|center|end|baseline|stretch)$/ },
    { pattern: /^justify-(start|center|end|between|around|evenly)$/ },
    { pattern: /^self-(auto|start|center|end|stretch|baseline)$/ },
    { pattern: /^content-(start|center|end|between|around|evenly)$/ },
    { pattern: /^place-(items|content|self)-(start|center|end|between|around|evenly|stretch)$/ },

    // ─── Sizing ─────────────────────────────────────────────────────────────
    { pattern: new RegExp(`^((min-|max-)?[wh])-(${SPACING}|auto|full|screen|fit|min|max)$`) },
    { pattern: /^(w|h)-(1\/2|1\/3|2\/3|1\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|5\/6)$/ },
    { pattern: /^max-w-(xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|full|prose|none)$/ },

    // ─── Borders & shape ────────────────────────────────────────────────────
    { pattern: /^rounded(-(none|sm|md|lg|xl|2xl|3xl|full))?$/ },
    { pattern: /^rounded-([trbl]|tl|tr|br|bl)(-(none|sm|md|lg|xl|2xl|3xl|full))?$/ },
    { pattern: /^border(-([0248]))?$/ },
    { pattern: /^border-([trblxy])(-([0248]))?$/ },
    { pattern: /^divide-(x|y)(-([0248]))?$/ },

    // ─── Effects ────────────────────────────────────────────────────────────
    { pattern: /^shadow(-(sm|md|lg|xl|2xl|inner|none))?$/ },
    { pattern: /^opacity-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100)$/ },

    // ─── Position ───────────────────────────────────────────────────────────
    { pattern: /^(absolute|relative|fixed|sticky|static)$/ },
    { pattern: /^(top|right|bottom|left|inset)-(0|auto|full|1\/2)$/ },
    'z-0',
    'z-10',
    'z-20',
    'z-30',
    'z-40',
    'z-50',
    'z-auto',

    // ─── Overflow ───────────────────────────────────────────────────────────
    { pattern: /^overflow(-(x|y))?-(auto|hidden|visible|scroll)$/ },

    // ─── Transitions & motion ───────────────────────────────────────────────
    { pattern: /^transition(-(none|all|colors|opacity|shadow|transform))?$/ },
    { pattern: /^duration-(75|100|150|200|300|500|700|1000)$/ },
    { pattern: /^ease-(linear|in|out|in-out)$/ },
    { pattern: /^cursor-(auto|default|pointer|wait|text|move|not-allowed)$/ },
  ],
} satisfies Config
