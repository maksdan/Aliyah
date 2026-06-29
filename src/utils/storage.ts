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

const STREAK_BANNER_KEY = 'streak_banner_seen';

export async function getLastSeenStreak(): Promise<number> {
  const v = await AsyncStorage.getItem(STREAK_BANNER_KEY);
  return v ? (parseInt(v, 10) || 0) : 0;
}

export async function markStreakBannerSeen(streak: number): Promise<void> {
  await AsyncStorage.setItem(STREAK_BANNER_KEY, String(streak));
}
