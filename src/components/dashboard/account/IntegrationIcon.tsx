/**
 * Brand marks for the integrations catalogue.
 *
 * Inline SVG rather than an icon package: lucide-react carries no brand logos,
 * and pulling in a whole brand-icon dependency for six marks is not worth the
 * bundle. Each path is the vendor's own simple mark, drawn in its brand colour
 * on a neutral tile so the grid reads evenly.
 *
 * Vendors with no widely-recognised mark (Yuki, PerfectView) get a lettermark
 * tile instead of a guessed-at logo.
 */

export type IntegrationIconName =
  | 'google'
  | 'whatsapp'
  | 'gmail'
  | 'outlook'
  | 'google-calendar'
  | 'slack'
  | 'google-drive'
  | 'dropbox'
  | 'zoom'
  | 'yuki'
  | 'perfectview'

interface IntegrationIconProps {
  name: IntegrationIconName
  className?: string
}

/** A lettermark fallback for vendors without a recognisable logo. */
function LetterMark({ letters, background }: { letters: string; background: string }) {
  return (
    <span
      className="flex h-full w-full items-center justify-center rounded-[inherit] text-[13px] font-bold tracking-tight text-white"
      style={{ backgroundColor: background }}
      aria-hidden
    >
      {letters}
    </span>
  )
}

export function IntegrationIcon({ name, className = '' }: IntegrationIconProps) {
  const wrapper = `flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ${className}`

  if (name === 'yuki') {
    return (
      <span className={wrapper}>
        <LetterMark letters="Yu" background="#0b7285" />
      </span>
    )
  }

  if (name === 'perfectview') {
    return (
      <span className={wrapper}>
        <LetterMark letters="PV" background="#1f4e79" />
      </span>
    )
  }

  return (
    <span className={`${wrapper} bg-slate-50`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" role="img" aria-hidden focusable="false">
        {name === 'whatsapp' && (
          <path
            fill="#25D366"
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
          />
        )}
        {name === 'google' && (
          <>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
            <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 010-4.22V7.05H2.18a11 11 0 000 9.9l3.66-2.84z" />
            <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5a11 11 0 00-9.82 6.55l3.66 2.84c.87-2.6 3.3-4.14 6.16-4.14z" />
          </>
        )}
        {name === 'gmail' && (
          <>
            <path fill="#4285F4" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
          </>
        )}
        {name === 'outlook' && (
          <path
            fill="#0078D4"
            d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.11-.86q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.32.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.79v-2.96l.7.33 9.67-4.5 1.47 4.5.37-.33V12zm-6.26-7.11L24 9.3v1.4l-6.26-4.4zM0 4.5v15l6.01-2.8V7.3zm7.13-1.88h9.74v4.98l-1.3.92-8.44 5.1V2.62z"
          />
        )}
        {name === 'google-calendar' && (
          <>
            <rect x="3" y="4.5" width="18" height="16" rx="2.5" fill="#fff" stroke="#4285F4" strokeWidth="1.6" />
            <path fill="#4285F4" d="M3 7h18v1.6H3z" />
            <path fill="#1A73E8" d="M7.6 2.6h1.6v3.2H7.6zM14.8 2.6h1.6v3.2h-1.6z" />
            <text x="12" y="17" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#4285F4">
              31
            </text>
          </>
        )}
        {name === 'slack' && (
          <path
            fill="#E01E5A"
            d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z"
          />
        )}
        {name === 'google-drive' && (
          <>
            <path fill="#0066DA" d="M1.6 17.5 3.1 20.1c.3.5.7.9 1.2 1.2l3.4-5.9H1.1c0 .6.2 1.2.5 1.7z" />
            <path fill="#00AC47" d="M12 7.9 8.6 2c-.5.3-.9.7-1.2 1.2L1.6 13.5c-.3.5-.5 1.1-.5 1.7h6.8z" />
            <path fill="#EA4335" d="M19.7 21.3c.5-.3.9-.7 1.2-1.2l.6-1.1 3-5.2c.3-.5.5-1.1.5-1.7h-6.8l1.4 2.8z" />
            <path fill="#00832D" d="M12 7.9 15.4 2c-.5-.3-1-.4-1.6-.4h-3.6c-.6 0-1.1.2-1.6.4z" />
            <path fill="#2684FC" d="M16.3 15.4H7.7l-3.4 5.9c.5.3 1 .4 1.6.4h12.2c.6 0 1.1-.2 1.6-.4z" />
            <path fill="#FFBA00" d="m19.7 8.3-3-5.2c-.3-.5-.7-.9-1.2-1.2L12 7.9l4.3 7.5h6.8c0-.6-.2-1.2-.5-1.7z" />
          </>
        )}
        {name === 'dropbox' && (
          <path fill="#0061FF" d="M6 2 0 5.8l6 3.8 6-3.8zm12 0-6 3.8 6 3.8 6-3.8zM0 13.4l6 3.8 6-3.8-6-3.8zm18-3.8-6 3.8 6 3.8 6-3.8zM6 18.5l6 3.8 6-3.8-6-3.8z" />
        )}
        {name === 'zoom' && (
          <path
            fill="#0B5CFF"
            d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.806 14.73c0 .39-.317.706-.707.706H8.2a2.47 2.47 0 01-2.47-2.47V9.27c0-.39.317-.706.707-.706h7.9a2.47 2.47 0 012.47 2.47zm1.47-1.24V10.5l2.47-1.76c.29-.21.7 0 .7.36v5.78c0 .36-.41.57-.7.36z"
          />
        )}
      </svg>
    </span>
  )
}
