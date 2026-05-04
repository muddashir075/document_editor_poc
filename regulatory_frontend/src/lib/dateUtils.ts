/**
 * Parse a datetime string from the backend.
 *
 * The backend stores datetimes with datetime.utcnow() which produces naive
 * UTC strings like "2026-04-09T10:00:00" (no timezone suffix).
 * Browsers parse strings without a timezone as LOCAL time, causing an offset
 * equal to the user's UTC offset (e.g. UTC+6 → shows "6 hours ago").
 *
 * Fix: always append "Z" if no timezone info is present, forcing UTC parsing.
 */
export function parseUTC(dateStr: string): Date {
  if (!dateStr) return new Date()
  // Already has timezone info (+XX:XX, -XX:XX, or Z)
  if (/[Z+\-]\d*$/.test(dateStr.trim())) return new Date(dateStr)
  // Naive string — treat as UTC
  return new Date(dateStr + 'Z')
}
