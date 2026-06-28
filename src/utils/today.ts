// Centralized "what day is it" so the daily reading can be overridden for
// testing. 0=Sunday … 5=Friday, 6=Saturday (Shabbat).
//
// DEV TESTING: set DEV_WEEKDAY_OVERRIDE to a number (e.g. 5 for Friday) to make
// the app behave as that day, then set it back to null to return to real time.
export const DEV_WEEKDAY_OVERRIDE: number | null = null; // null = real time

export function getWeekday(): number {
  return DEV_WEEKDAY_OVERRIDE ?? new Date().getDay();
}
