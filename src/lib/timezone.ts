/**
 * Native-Intl timezone helpers - no date/timezone library, matching the rest
 * of the codebase (see calendarDate.ts). Nothing here is persisted anywhere:
 * the backend has no timezone column on projects, tasks, or calendar events,
 * so a selected zone only ever affects what UTC instant gets computed from a
 * wall-clock date+time before it's sent.
 */

let cachedZones: string[] | null = null

export function getBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/** All IANA zone names the runtime knows about (~400), computed once and cached. */
export function listIanaTimeZones(): string[] {
  if (!cachedZones) {
    cachedZones = Intl.supportedValuesOf('timeZone')
  }
  return cachedZones
}

/**
 * Converts a `yyyy-mm-dd` date + `HH:mm` time, interpreted as wall-clock time
 * *in* `timeZone`, into the UTC instant it actually represents (as an ISO
 * string) - correctly across DST, without a date library.
 *
 * Technique: treat the wall-clock string as if it were already UTC, then ask
 * Intl what that instant's wall-clock time looks like inside `timeZone`. The
 * gap between the intended and displayed wall-clock time is exactly the
 * zone's offset at that moment (DST included), so shifting by that gap lands
 * on the correct UTC instant.
 *
 * Known non-goals (acceptable for this app, not bugs to "fix" later): a
 * wall-clock time that doesn't exist (spring-forward gap) or that occurs
 * twice (fall-back repeat) resolves to *some* deterministic instant, not
 * both/an error.
 */
export function zonedDateTimeToUtcIso(dateStr: string, timeStr: string, timeZone: string): string {
  const naive = new Date(`${dateStr}T${timeStr || '00:00'}:00Z`)

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(naive)

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '00'
  const asIfUtc = Date.UTC(
    Number(get('year')),
    Number(get('month')) - 1,
    Number(get('day')),
    Number(get('hour')),
    Number(get('minute')),
    Number(get('second')),
  )

  const offsetMs = asIfUtc - naive.getTime()
  return new Date(naive.getTime() - offsetMs).toISOString()
}

/** A short "3:00 PM EDT" style label for `iso`'s instant as seen in `timeZone` - UX sugar, not used for any conversion. */
export function formatInTimeZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(iso))
}
