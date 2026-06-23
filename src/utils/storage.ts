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
