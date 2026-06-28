export const ALIYAH_NAMES_EN = [
  'Rishon',
  'Sheni',
  'Shelishi',
  "Revi'i",
  'Ḥamishi',
  'Shishi',
  "Shevi'i",
];

export const DAY_NAMES_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Shabbat',
];

// Format a schedule day's aliyot list (1-based numbers, or 'Haftarah') into a
// reader-facing label, e.g. "Aliyah 4 — Revi'i" or "Aliyot 2–3 — Sheni–Shelishi".
export function formatAliyotLabel(aliyot: (number | string)[]): string {
  const nums = aliyot.filter((a): a is number => typeof a === 'number');
  if (nums.length === 0) return 'Haftarah';

  const names = nums.map((n) => ALIYAH_NAMES_EN[n - 1]).filter(Boolean);
  if (nums.length === 1) {
    return `Aliyah ${nums[0]} — ${names[0]}`;
  }
  const first = nums[0];
  const last = nums[nums.length - 1];
  return `Aliyot ${first}–${last} — ${names.join('–')}`;
}
