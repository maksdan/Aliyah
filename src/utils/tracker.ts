import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelWeeklyCongrats, scheduleWeeklyCongrats } from '../services/notifications';

const STREAK_KEY = 'weekly_streak';

// A reading week runs Sunday (0) through Friday (5); Shabbat has no reading.
const READING_DAY_OFFSETS = [0, 1, 2, 3, 4, 5];
const CONGRATS_HOUR = 9;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Sunday 00:00 that begins the week containing `d` (Sun=0 … Sat=6).
export function weekStartSunday(d: Date = new Date()): Date {
  const s = startOfDay(d);
  s.setDate(s.getDate() - s.getDay());
  return s;
}

// Must match the key written by storage.markTodayRead().
function readKeyForDate(d: Date): string {
  return `read_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
}

// A week is complete when every Sunday–Friday reading day is marked read.
async function isWeekComplete(sunday: Date): Promise<boolean> {
  const keys = READING_DAY_OFFSETS.map((offset) => {
    const d = new Date(sunday);
    d.setDate(d.getDate() + offset);
    return readKeyForDate(d);
  });
  const entries = await AsyncStorage.multiGet(keys);
  return entries.every(([, v]) => v === '1');
}

export async function getWeeklyStreak(): Promise<number> {
  const v = await AsyncStorage.getItem(STREAK_KEY);
  const n = v ? parseInt(v, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Recompute the consecutive-completed-week streak and (re)arm the Sunday-morning
// congratulations notification. Safe to call on every app open and whenever a
// reading is marked or unmarked.
//
// The current (in-progress) week is only counted once it's fully complete, so a
// normal mid-week state never breaks the streak. A miss is only registered once
// a week has fully elapsed without all readings done — at which point the streak
// resets to 0 and no further congrats fire until a new full week is earned.
export async function refreshWeeklyStreak(): Promise<number> {
  const thisSunday = weekStartSunday();
  const currentComplete = await isWeekComplete(thisSunday);

  let count = currentComplete ? 1 : 0;
  const cursor = new Date(thisSunday);
  cursor.setDate(cursor.getDate() - 7);
  // Walk backward over prior weeks; each consecutive complete week extends the streak.
  // eslint-disable-next-line no-await-in-loop
  while (await isWeekComplete(cursor)) {
    count += 1;
    cursor.setDate(cursor.getDate() - 7);
  }

  await AsyncStorage.setItem(STREAK_KEY, String(count));

  // Only the just-finished current week earns a fresh Sunday-morning congrats
  // for the upcoming Sunday. If the current week isn't complete, there's nothing
  // new to celebrate this cycle, so clear any pending congrats.
  if (currentComplete && count > 0) {
    const nextSunday = new Date(thisSunday);
    nextSunday.setDate(nextSunday.getDate() + 7);
    nextSunday.setHours(CONGRATS_HOUR, 0, 0, 0);
    await scheduleWeeklyCongrats(count, nextSunday);
  } else {
    await cancelWeeklyCongrats();
  }

  return count;
}
