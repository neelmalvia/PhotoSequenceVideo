/**
 * @format
 */

/** 16500 -> "0:17" (rounded up, so a 16.5s clip never reads shorter than it is). */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** "Today, 10:24", "Yesterday, 18:02" or "12 Nov, 09:15". */
export function formatCreatedAt(timestamp: number, now = new Date()): string {
  const date = new Date(timestamp);
  const time = `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) {
    return `Today, ${time}`;
  }
  if (isSameDay(date, yesterday)) {
    return `Yesterday, ${time}`;
  }
  const day = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear()
    ? `${day}, ${time}`
    : `${day} ${date.getFullYear()}, ${time}`;
}
