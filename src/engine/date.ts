// All dates in this app are 'YYYY-MM-DD' strings representing an
// Asia/Seoul calendar date (CLAUDE.md rule 6). We do date math on the
// (year, month, day) components via Date.UTC so the host machine's local
// timezone/DST never leaks in.

export function formatDate(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function toUtcMillis(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(dateStr: string, days: number): string {
  const dt = new Date(toUtcMillis(dateStr));
  dt.setUTCDate(dt.getUTCDate() + days);
  return formatDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** b - a, in whole days. Positive when b is after a. */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtcMillis(b) - toUtcMillis(a)) / 86_400_000);
}

export function isAfter(a: string, b: string): boolean {
  return a > b;
}

/** Today's date as 'YYYY-MM-DD' in Asia/Seoul (fixed UTC+9, no DST). */
export function todayInSeoul(now: Date = new Date()): string {
  const seoulMillis = now.getTime() + 9 * 60 * 60 * 1000;
  const seoul = new Date(seoulMillis);
  return formatDate(seoul.getUTCFullYear(), seoul.getUTCMonth() + 1, seoul.getUTCDate());
}
