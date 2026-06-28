import scheduleData from './schedule.json';

export type Rite = 'ashkenazi' | 'sephardi';

export interface ScheduleDay {
  day: string; // 'Sunday' … 'Friday'
  aliyot: (number | string)[]; // aliyah numbers, or ['Haftarah'] on Friday
  ref: string; // combined English ref for the day
  verses: number;
}

export interface ParashaSchedule {
  parasha: string;
  peakWeekday: number;
  aliyahVerseCounts: number[];
  days: ScheduleDay[];
}

export const SCHEDULE = scheduleData as Record<string, ParashaSchedule>;

// Sephardi haftarot that DIFFER from the Ashkenazi reading carried in
// schedule.json. Where a parasha is absent here, both rites read the same
// haftarah (the schedule.json ref). This is well-documented liturgical content
// but worth a review pass before relying on it heavily — see MEMORY note.
export const SEPHARDI_HAFTARAH: Record<string, string> = {
  Bereshit: 'Isaiah 42:5-42:21',
  Noach: 'Isaiah 54:1-54:10',
  Vayera: 'II Kings 4:1-4:23',
  Vayetzei: 'Hosea 11:7-12:12',
  Shemot: 'Jeremiah 1:1-2:3',
  Beshalach: 'Judges 5:1-5:31',
  Yitro: 'Isaiah 6:1-6:13',
  'Ki Tisa': 'I Kings 18:20-18:39',
  Vayakhel: 'I Kings 7:13-7:26',
  Pekudei: 'I Kings 7:40-7:50',
  Shmini: 'II Samuel 6:1-6:19',
  Masei: 'Jeremiah 2:4-2:28; Jeremiah 4:1-4:2',
  // Combined parashiot follow the second portion's Sephardi haftarah.
  'Vayakhel-Pekudei': 'I Kings 7:40-7:50',
  'Matot-Masei': 'Jeremiah 2:4-2:28; Jeremiah 4:1-4:2',
};

export function getParashaSchedule(parashaEn: string): ParashaSchedule | undefined {
  return SCHEDULE[parashaEn];
}

// 0=Sunday … 5=Friday map to schedule entries; 6=Saturday (Shabbat) has none.
export function getTodayScheduleDay(
  parashaEn: string,
  weekday: number = new Date().getDay(),
): ScheduleDay | undefined {
  if (weekday === 6) return undefined;
  return getParashaSchedule(parashaEn)?.days[weekday];
}

export function isHaftarahDay(day: ScheduleDay | undefined): boolean {
  return !!day && day.aliyot.some((a) => typeof a === 'string');
}

// Resolve the haftarah ref for a parasha + rite, falling back to the Ashkenazi
// (schedule.json) ref when there is no distinct Sephardi reading.
export function getHaftarahRef(parashaEn: string, rite: Rite, ashkenaziRef: string): string {
  if (rite === 'sephardi') return SEPHARDI_HAFTARAH[parashaEn] ?? ashkenaziRef;
  return ashkenaziRef;
}
