import AsyncStorage from '@react-native-async-storage/async-storage';

function todayKey(): string {
  const d = new Date();
  return `read_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
}

export async function markTodayRead(): Promise<void> {
  await AsyncStorage.setItem(todayKey(), '1');
}

export async function unmarkTodayRead(): Promise<void> {
  await AsyncStorage.removeItem(todayKey());
}

export async function isTodayRead(): Promise<boolean> {
  const val = await AsyncStorage.getItem(todayKey());
  return val === '1';
}

const STREAK_BANNER_KEY = 'streak_banner_seen';

export async function getLastSeenStreak(): Promise<number> {
  const v = await AsyncStorage.getItem(STREAK_BANNER_KEY);
  return v ? (parseInt(v, 10) || 0) : 0;
}

export async function markStreakBannerSeen(streak: number): Promise<void> {
  await AsyncStorage.setItem(STREAK_BANNER_KEY, String(streak));
}
