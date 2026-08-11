import AsyncStorage from '@react-native-async-storage/async-storage';

function dateKey(d: Date): string {
  return `read_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
}

export async function isDateRead(date: Date): Promise<boolean> {
  return (await AsyncStorage.getItem(dateKey(date))) === '1';
}

export async function markDateRead(date: Date): Promise<void> {
  await AsyncStorage.setItem(dateKey(date), '1');
}

export async function unmarkDateRead(date: Date): Promise<void> {
  await AsyncStorage.removeItem(dateKey(date));
}

// Convenience wrappers for today — kept for any callers that don't navigate.
export async function isTodayRead(): Promise<boolean> {
  return isDateRead(new Date());
}
export async function markTodayRead(): Promise<void> {
  return markDateRead(new Date());
}
export async function unmarkTodayRead(): Promise<void> {
  return unmarkDateRead(new Date());
}

// --- Reading position ---------------------------------------------------
// Scroll offset is remembered per calendar date, so leaving a day part-read and
// coming back to it later resumes at the same verse instead of jumping to the
// top (or, worse, inheriting the previous day's offset).

function positionKey(d: Date): string {
  return `pos_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
}

export async function getReadingPosition(date: Date): Promise<number> {
  const v = await AsyncStorage.getItem(positionKey(date));
  const y = v ? parseFloat(v) : 0;
  return Number.isFinite(y) && y > 0 ? y : 0;
}

export async function saveReadingPosition(date: Date, y: number): Promise<void> {
  await AsyncStorage.setItem(positionKey(date), String(Math.max(0, Math.round(y))));
}

// --- Sticky display preferences ------------------------------------------
// The language tab and the Ashkenazi/Sephardi choice are how the reader left
// the app; both should survive a day change and a relaunch.

const MODE_KEY = 'display_mode';
const RITE_KEY = 'rite';

export async function getSavedMode(): Promise<string | null> {
  return AsyncStorage.getItem(MODE_KEY);
}

export async function saveMode(mode: string): Promise<void> {
  await AsyncStorage.setItem(MODE_KEY, mode);
}

export async function getSavedRite(): Promise<string | null> {
  return AsyncStorage.getItem(RITE_KEY);
}

export async function saveRite(rite: string): Promise<void> {
  await AsyncStorage.setItem(RITE_KEY, rite);
}

const STREAK_BANNER_KEY = 'streak_banner_seen';

export async function getLastSeenStreak(): Promise<number> {
  const v = await AsyncStorage.getItem(STREAK_BANNER_KEY);
  return v ? (parseInt(v, 10) || 0) : 0;
}

export async function markStreakBannerSeen(streak: number): Promise<void> {
  await AsyncStorage.setItem(STREAK_BANNER_KEY, String(streak));
}
