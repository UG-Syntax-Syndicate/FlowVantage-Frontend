/**
 * Generic greedy interval -> lane packing (like a simplified Gantt-row layout).
 * Shared by the month/week/day "all-day" spanning-bar rows and the hourly
 * meeting grid's overlap handling - the one piece of layout math in the
 * calendar feature, written once.
 */
export interface PackedInterval<T> {
  item: T
  start: number
  end: number
  lane: number
}

/**
 * `start`/`end` are inclusive, in whatever unit the caller uses (day-column
 * index for all-day rows, minutes-since-midnight for the hourly grid).
 */
export function packIntervalsIntoLanes<T>(
  items: T[],
  getStart: (item: T) => number,
  getEnd: (item: T) => number,
): { packed: PackedInterval<T>[]; laneCount: number } {
  const sorted = [...items].sort((a, b) => {
    const byStart = getStart(a) - getStart(b)
    if (byStart !== 0) return byStart
    return getEnd(b) - getStart(b) - (getEnd(a) - getStart(a)) // longer interval first on ties
  })

  const laneEnd: number[] = []
  const packed: PackedInterval<T>[] = []

  for (const item of sorted) {
    const start = getStart(item)
    const end = getEnd(item)
    let lane = laneEnd.findIndex((lastEnd) => lastEnd < start)
    if (lane === -1) {
      lane = laneEnd.length
      laneEnd.push(end)
    } else {
      laneEnd[lane] = end
    }
    packed.push({ item, start, end, lane })
  }

  return { packed, laneCount: laneEnd.length }
}
