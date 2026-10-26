interface NotFoundIllustrationProps {
  className?: string
}

/**
 * The 404 artwork: oversized numerals with two figures standing on top of the
 * outer digits, and speech bubbles carrying the things that actually cause a
 * dead link.
 *
 * Inline rather than an asset because every colour is a theme token, so the
 * drawing follows the brand instead of being a flat file that drifts from it -
 * and because this is the only illustration in the app, which keeps no SVG
 * assets directory (every other glyph comes from lucide-react).
 *
 * Geometry, since nothing here is arbitrary: the numerals sit on a 300
 * baseline at font-size 170, so their cap height is ~122 and their top edge is
 * y=178. Both figures are built upward from that line with their feet resting
 * exactly on it - get this wrong by even 20px and they read as hovering in
 * front of the digits rather than standing on them.
 *
 * Decorative: the heading beside it carries the meaning, so it is hidden from
 * assistive technology.
 */
export function NotFoundIllustration({ className = '' }: NotFoundIllustrationProps) {
  return (
    <svg
      viewBox="0 0 640 330"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Depth: soft shapes well behind everything, never competing. */}
      <circle cx="62" cy="48" r="28" fill="var(--color-accent-100)" opacity="0.75" />
      <circle cx="592" cy="60" r="17" fill="var(--color-accent-100)" opacity="0.75" />
      <circle cx="112" cy="126" r="6" fill="var(--color-accent-200)" />
      <circle cx="534" cy="142" r="5" fill="var(--color-accent-200)" />

      {/* Grounds the digits so they read as standing on a surface. */}
      <ellipse cx="320" cy="310" rx="210" ry="11" fill="var(--color-line)" />

      {/* The numerals. */}
      <g
        fill="var(--color-accent-300)"
        fontFamily="var(--font-sans)"
        fontSize="170"
        fontWeight="800"
        textAnchor="middle"
      >
        <text x="152" y="300">4</text>
        <text x="320" y="300">0</text>
        <text x="488" y="300">4</text>
      </g>

      {/* Figure standing on the left numeral, holding a laptop.
          The laptop is navy against the orange shirt on purpose: drawn in the
          same orange family it read as a stripe on the clothing rather than an
          object being held. Each figure's prop therefore takes the other
          figure's body colour. */}
      <g>
        <rect x="143" y="130" width="12" height="44" rx="6" fill="var(--color-navy)" />
        <rect x="161" y="130" width="12" height="44" rx="6" fill="var(--color-navy)" />
        <ellipse cx="149" cy="176" rx="10" ry="5" fill="var(--color-navy-hover)" />
        <ellipse cx="167" cy="176" rx="10" ry="5" fill="var(--color-navy-hover)" />
        <rect x="138" y="74" width="40" height="58" rx="16" fill="var(--color-primary)" />
        <circle cx="158" cy="54" r="17" fill="var(--color-navy)" />
        {/* Arms before the prop, so the hands finish behind it. */}
        <g stroke="var(--color-primary)" strokeWidth="9" strokeLinecap="round">
          <path d="M143 88l-10 26" />
          <path d="M173 88l10 26" />
        </g>
        <rect x="128" y="104" width="60" height="30" rx="4" fill="var(--color-navy)" />
        <rect x="133" y="109" width="50" height="20" rx="2" fill="var(--color-accent-200)" />
        <rect x="122" y="134" width="72" height="7" rx="3.5" fill="var(--color-navy-hover)" />
      </g>

      {/* Figure standing on the right numeral, searching it with a magnifier.
          Different pose and inverted colours, so the pair does not read as one
          drawing used twice. */}
      <g>
        <rect x="475" y="130" width="12" height="44" rx="6" fill="var(--color-navy-hover)" />
        <rect x="493" y="130" width="12" height="44" rx="6" fill="var(--color-navy-hover)" />
        <ellipse cx="481" cy="176" rx="10" ry="5" fill="var(--color-navy)" />
        <ellipse cx="499" cy="176" rx="10" ry="5" fill="var(--color-navy)" />
        <rect x="470" y="74" width="40" height="58" rx="16" fill="var(--color-navy)" />
        <circle cx="490" cy="54" r="17" fill="var(--color-primary)" />
        <g stroke="var(--color-navy)" strokeWidth="9" strokeLinecap="round">
          <path d="M475 88l-10 26" />
          <path d="M507 94l15 14" />
        </g>
        <path
          d="M530 118l-9-9"
          stroke="var(--color-primary)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <circle cx="542" cy="130" r="17" stroke="var(--color-primary)" strokeWidth="6" />
      </g>

      {/* Speech bubbles: the four things that actually break a link. */}

      {/* Something went wrong. */}
      <g>
        <rect x="26" y="30" width="92" height="66" rx="18" fill="var(--color-accent-100)" />
        <path d="M56 94v18l20-18z" fill="var(--color-accent-100)" />
        <path d="M72 48l20 34H52z" stroke="var(--color-primary)" strokeWidth="6" strokeLinejoin="round" />
        <path d="M72 60v9" stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="72" cy="75" r="3.2" fill="var(--color-primary)" />
      </g>

      {/* Nothing at this address. */}
      <g>
        <rect x="512" y="20" width="92" height="66" rx="18" fill="var(--color-accent-100)" />
        <path d="M574 84v18l-20-18z" fill="var(--color-accent-100)" />
        <circle cx="558" cy="53" r="19" stroke="var(--color-navy)" strokeWidth="5" />
        <path d="M539 53h38" stroke="var(--color-navy)" strokeWidth="5" />
        <path d="M558 34c9.5 11 9.5 27 0 38-9.5-11-9.5-27 0-38z" stroke="var(--color-navy)" strokeWidth="5" />
        <path d="M543 69l30-32" stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* A broken link. */}
      <g>
        <rect x="10" y="170" width="86" height="64" rx="18" fill="var(--color-accent-100)" />
        <path d="M40 232v18l20-18z" fill="var(--color-accent-100)" />
        <g stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round">
          <path d="M40 188l-7 7a12.5 12.5 0 0 0 17.5 17.5l7-7" />
          <path d="M66 216l7-7a12.5 12.5 0 0 0-17.5-17.5l-7 7" />
        </g>
      </g>

      {/* A bug. */}
      <g>
        <rect x="544" y="178" width="86" height="64" rx="18" fill="var(--color-accent-100)" />
        <path d="M600 240v18l-20-18z" fill="var(--color-accent-100)" />
        <rect x="573" y="194" width="28" height="33" rx="14" stroke="var(--color-navy)" strokeWidth="5" />
        <path d="M587 194v33" stroke="var(--color-navy)" strokeWidth="4" />
        <g stroke="var(--color-navy)" strokeWidth="4.5" strokeLinecap="round">
          <path d="M573 204l-11-6" />
          <path d="M573 218l-11 6" />
          <path d="M601 204l11-6" />
          <path d="M601 218l11 6" />
          <path d="M579 191l-4-8" />
          <path d="M595 191l4-8" />
        </g>
      </g>
    </svg>
  )
}
