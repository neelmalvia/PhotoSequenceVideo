/**
 * @format
 */

/**
 * Playback clock: 3.7 -> "0:03", 75 -> "1:15".
 * Positions round down (time elapsed); totals round up so a 9.5s clip reads
 * "0:10", matching how durations are shown elsewhere in the app.
 */
export function formatClock(
  seconds: number,
  rounding: 'down' | 'up' = 'down',
): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const total = rounding === 'up' ? Math.ceil(safe) : Math.floor(safe);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${(total % 60).toString().padStart(2, '0')}`;
}
