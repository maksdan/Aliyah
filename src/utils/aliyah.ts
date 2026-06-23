export const ALIYAH_NAMES_EN = [
  'First (Rishon)',
  'Second (Sheni)',
  'Third (Shelishi)',
  'Fourth (Revi\'i)',
  'Fifth (Ḥamishi)',
  'Sixth (Shishi)',
  'Seventh (Shevi\'i)',
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

// Sun: 1st+2nd, Mon: 3rd, Tue: 4th, Wed: 5th, Thu: 6th, Fri: 7th, Shabbat: rest
const DAY_TO_ALIYOT: number[][] = [
  [0, 1], // Sunday
  [2],    // Monday
  [3],    // Tuesday
  [4],    // Wednesday
  [5],    // Thursday
  [6],    // Friday
  [],     // Shabbat
];

export function getTodayAliyahIndices(): number[] {
  return DAY_TO_ALIYOT[new Date().getDay()];
}

export function getAliyahLabel(index: number): string {
  return `Aliyah ${index + 1} — ${ALIYAH_NAMES_EN[index]}`;
}
