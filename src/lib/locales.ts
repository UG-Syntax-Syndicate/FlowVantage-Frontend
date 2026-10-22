/**
 * Country and timezone lists for the onboarding wizard.
 *
 * Built from `Intl` rather than a dependency. `world-countries` is ~200KB for
 * data the platform already has, and `Intl.supportedValuesOf('timeZone')`
 * returns the IANA list the browser itself uses - which is, by definition, the
 * list that will resolve correctly in that browser.
 */

/**
 * ISO 3166-1 alpha-2 codes with their English display names.
 *
 * The codes are a static list because there is no Intl API that enumerates
 * countries - only one that names a code you already have. Sorted by display
 * name, since that is the order someone scans.
 */
const COUNTRY_CODES = [
  'AD','AE','AF','AG','AL','AM','AO','AR','AT','AU','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ',
  'BN','BO','BR','BS','BT','BW','BY','BZ','CA','CD','CF','CG','CH','CI','CL','CM','CN','CO','CR','CU',
  'CV','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','ER','ES','ET','FI','FJ','FM','FR','GA',
  'GB','GD','GE','GH','GM','GN','GQ','GR','GT','GW','GY','HN','HR','HT','HU','ID','IE','IL','IN','IQ',
  'IR','IS','IT','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KZ','LA','LB','LC','LI',
  'LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MG','MH','MK','ML','MM','MN','MR','MT','MU',
  'MV','MW','MX','MY','MZ','NA','NE','NG','NI','NL','NO','NP','NR','NZ','OM','PA','PE','PG','PH','PK',
  'PL','PT','PW','PY','QA','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SI','SK','SL','SM','SN',
  'SO','SR','SS','ST','SV','SY','SZ','TD','TG','TH','TJ','TL','TM','TN','TO','TR','TT','TV','TZ','UA',
  'UG','US','UY','UZ','VA','VC','VE','VN','VU','WS','YE','ZA','ZM','ZW',
] as const

export interface CountryOption {
  code: string
  name: string
}

/** Lazily built and cached: the Intl lookup is cheap but not free, and this is rendered in a select. */
let countryCache: CountryOption[] | null = null

export function countryOptions(): CountryOption[] {
  if (countryCache) return countryCache

  let names: Intl.DisplayNames | null = null
  try {
    names = new Intl.DisplayNames(['en'], { type: 'region' })
  } catch {
    // Intl.DisplayNames is widely supported, but falling back to the raw code
    // is better than an empty list.
    names = null
  }

  countryCache = COUNTRY_CODES.map((code) => ({ code, name: names?.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return countryCache
}

/** The IANA timezone list the browser itself uses, so anything offered here will resolve. */
export function timezoneOptions(): string[] {
  try {
    const supported = Intl.supportedValuesOf?.('timeZone')
    if (supported && supported.length > 0) return [...supported]
  } catch {
    // Older engines lack supportedValuesOf.
  }
  // At minimum, offer the one the browser is actually in.
  return [detectTimezone()].filter(Boolean) as string[]
}

/** The browser's own timezone, used to prefill rather than make someone hunt for it. */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** The browser's locale, for date and number formatting. */
export function detectLocale(): string {
  try {
    return navigator.language || 'en-GB'
  } catch {
    return 'en-GB'
  }
}

/** Guesses the country from the browser locale, e.g. "en-GB" -> "GB". Only ever a default. */
export function detectCountryCode(): string | null {
  const locale = detectLocale()
  const region = locale.split('-')[1]
  return region && /^[A-Z]{2}$/.test(region.toUpperCase()) ? region.toUpperCase() : null
}

export const TEAM_SIZES = ['Just me', '2-10', '11-50', '51-200', '200+'] as const
