const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/**
 * Format an ISO date string "YYYY-MM-DD" as "Jan 31, 2026".
 */
export function fmtDate(iso) {
  if (!iso) return ''
  const parts = String(iso).slice(0, 10).split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts
  return `${MONTHS[+m - 1]} ${+d}, ${y}`
}
