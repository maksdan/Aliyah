export const ALIYAH_NAMES_EN = [
  'First (Rishon)',
  'Second (Sheni)',
  'Third (Shlishi)',
  'Fourth (Revi\'i)',
  'Fifth (Chamishi)',
  'Sixth (Shishi)',
  'Seventh (Shvi\'i)',
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

// JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat → maps directly to aliyah 1–7 (index 0–6)
export function getTodayAliyahIndex(): number {
  return new Date().getDay();
}

export function getAliyahLabel(index: number): string {
  return `Aliyah ${index + 1} — ${ALIYAH_NAMES_EN[index]}`;
}
