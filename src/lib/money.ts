/**
 * Money crosses the API as an integer number of minor units (cents), because a
 * float amount loses fractions once it is summed across a report. These are the
 * only two places that conversion happens, so a rounding rule cannot drift
 * between screens.
 */

/** Minor units to a localised amount, e.g. 125000 EUR -> "€1,250.00". */
export function formatMoneyMinor(minor: number, currency = 'EUR'): string {
  const amount = (Number(minor) || 0) / 100

  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
  } catch {
    // An unrecognised currency code throws rather than degrading, and a
    // three-letter code the browser does not know is still worth showing.
    return `${currency} ${amount.toFixed(2)}`
  }
}

/**
 * A major-unit amount from a form to minor units.
 *
 * Rounded, not truncated: the backend rejects a fractional minor unit outright,
 * and 12.555 entered by hand means 12.56 rather than an error.
 */
export function toMinorUnits(amount: number): number {
  return Math.round((Number(amount) || 0) * 100)
}

/** Minor units back to the major-unit number a form field holds. */
export function fromMinorUnits(minor: number): number {
  return (Number(minor) || 0) / 100
}
