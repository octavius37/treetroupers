/**
 * Standard competition ranking: equal points share a rank and the next rank
 * skips (100, 100, 90 → 1, 1, 3). Expects rows sorted by points, descending.
 */
export function rankRows<T extends { points: number }>(rows: T[]): (T & { rank: number })[] {
  return rows.map((row, i) => {
    let first = i
    while (first > 0 && rows[first - 1]!.points === row.points) {
      first--
    }
    return { ...row, rank: first + 1 }
  })
}
