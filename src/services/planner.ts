// The reading planner.
//
// The app is a preparation tool, and every week stands on its own: the days
// Sunday to Friday prepare exactly one reading — whatever is leined on the
// Shabbat that ends that week. The app is dark on Shabbat and yom tov, and yom
// tov readings are not prepared at all.
//
//   - A plain week, all six days free, uses schedule.json as it always has.
//   - A week that loses days to yom tov spreads the same Shabbat's aliyot, then
//     its haftarah, in order over the days it has left, balanced by verses.
//     With Pesach I on a Monday, Monday and Tuesday are dark, and Sunday,
//     Wednesday, Thursday and Friday share Shabbat Chol HaMoed's reading.
//
// Nothing ever spills from one week into another.

import { HDate, HebrewCalendar, flags } from '@hebcal/core';
import { getLeyningOnDate } from '@hebcal/leyning';
import { SCHEDULE } from '../data/schedule';

// ---------------------------------------------------------------------------
// Dark days
// ---------------------------------------------------------------------------

export interface DarkDay {
  nameEn: string;
  nameHe: string;
  isShabbat: boolean;
}

function yomTovOn(hd: HDate) {
  return (HebrewCalendar.getHolidaysOnDate(hd, false) || []).find(
    (ev) => ev.getFlags() & flags.CHAG,
  );
}

// Calendar names carry decorations a reading title shouldn't: Rosh Hashana its
// year ("Rosh Hashana 5787"), any chag on Shabbat a qualifier ("(on Shabbat)").
function readingTitle(name: string): string {
  return name.replace(/\s+\d{4}$/, '').replace(/\s*\([^)]*\)\s*$/, '').trim();
}

// The chag or Shabbat this date is, if the app is dark on it.
export function getDarkDay(date: Date): DarkDay | null {
  const yt = yomTovOn(new HDate(date));
  if (yt) {
    return {
      nameEn: readingTitle(yt.render('en')),
      nameHe: readingTitle(yt.render('he')),
      isShabbat: date.getDay() === 6,
    };
  }
  if (date.getDay() === 6) return { nameEn: 'Shabbat', nameHe: 'שַׁבָּת', isShabbat: true };
  return null;
}

// ---------------------------------------------------------------------------
// Leinings: what is read on each dark day, as ordered units
// ---------------------------------------------------------------------------

// hebcal writes a split reading with commas and the book named once —
// "Joshua 3:5-7, 5:2-6:1, 6:27". Sefaria does not parse that: it answers 200
// with no text at all, which would render as an empty day rather than an
// error. Rewrite into the semicolon form fetchRef splits on, book repeated.
export function normalizeRef(ref: string): string {
  const parts = ref.split(/,\s*/);
  if (parts.length === 1) return ref;
  const book = parts[0].match(/^(.*?)\s+\d/)?.[1];
  if (!book) return ref;
  return parts
    .map((part, i) => (i === 0 || /^[A-Za-z]/.test(part) ? part : `${book} ${part}`))
    .join('; ');
}

interface Unit {
  label: number | string; // 1…7, 'Maftir', 'Haftarah', 'Haftarah I'…
  ref: string;
  verses: number;
  isHaftarah: boolean;
}

interface Leining {
  nameEn: string;
  nameHe: string;
  abs: number; // day it is leined (HDate absolute)
  parashaKey?: string; // set for an ordinary Shabbat parasha
  units: Unit[];
}

type RawAliyah = { k: string; b: string; e: string; v?: number };

function leiningOn(abs: number): Leining | null {
  const hd = new HDate(abs);
  const l = getLeyningOnDate(hd, false); // false = diaspora, matching Sedra
  if (!l || !('fullkriyah' in l)) return null;

  const isParasha = Array.isArray((l as { parsha?: string[] }).parsha);
  const units: Unit[] = [];
  const keys = Object.keys(l.fullkriyah).sort((a, b) => {
    const na = a === 'M' ? 99 : Number(a);
    const nb = b === 'M' ? 99 : Number(b);
    return na - nb;
  });
  for (const key of keys) {
    const a = l.fullkriyah[key] as RawAliyah;
    if (!a || !a.k) continue;
    // No maftir: a parasha's repeats the end of the seventh aliyah, and a
    // chag's is the day's korbanot list — the reader prepares the aliyot and
    // the haftarah.
    if (key === 'M') continue;
    units.push({
      label: Number(key),
      ref: `${a.k} ${a.b}-${a.e}`,
      verses: a.v ?? 0,
      isHaftarah: false,
    });
  }
  if (units.length === 0) return null;

  if (l.haftara) {
    const hafts = Array.isArray(l.haft) ? l.haft : l.haft ? [l.haft] : [];
    const verses = hafts.reduce((s, h) => s + ((h as { v?: number }).v ?? 0), 0);
    units.push({ label: 'Haftarah', ref: normalizeRef(l.haftara), verses, isHaftarah: true });
  }

  return {
    nameEn: readingTitle(l.name.en),
    nameHe: readingTitle(l.name.he),
    abs,
    parashaKey: isParasha ? (l as { parsha: string[] }).parsha.join('-') : undefined,
    units,
  };
}

// ---------------------------------------------------------------------------
// The plan
// ---------------------------------------------------------------------------

export interface PlannedSegment {
  nameEn: string;
  nameHe: string;
  isParasha: boolean;
  parashaKey?: string;
  // ISO date of the leining this prepares, so the UI can say "read Thursday".
  leinedOn: string;
  aliyot: (number | string)[];
  ref: string;
  isHaftarah: boolean; // segment is purely haftarah
  pinnedHaftarahDay?: boolean; // plain Friday — rite override applies
}

export type DayPlan =
  | { kind: 'dark'; dark: DarkDay }
  | { kind: 'prep'; segments: PlannedSegment[] };

function absOf(date: Date): number {
  return new HDate(date).abs();
}

function dateOfAbs(abs: number): Date {
  return new HDate(abs).greg();
}

// Merge a run of units into as few refs as possible: consecutive units from
// the same book collapse into one range; a maftir from elsewhere stays its own
// part after a semicolon.
function mergeRefs(units: Unit[]): string {
  const parts: string[] = [];
  let book = '';
  let from = '';
  let to = '';
  for (const u of units) {
    const m = u.ref.match(/^(.*?)\s+([\d:]+)-([\d:]+)$/);
    if (!m) {
      if (book) parts.push(`${book} ${from}-${to}`);
      book = '';
      parts.push(u.ref);
      continue;
    }
    if (m[1] === book) {
      to = m[3];
      continue;
    }
    if (book) parts.push(`${book} ${from}-${to}`);
    [, book, from, to] = m;
  }
  if (book) parts.push(`${book} ${from}-${to}`);
  return parts.join('; ');
}

// Split units, in order, into `days` runs of roughly equal verses. Each unit
// lands on the day where its midpoint still fits the running budget; pacing
// against the cumulative total means an indivisible haftarah overshoots its own
// day a little instead of pushing everything after it along. Every day gets at
// least one unit while there are units to go round, and the last day takes
// whatever is left.
function distribute<T extends { verses: number }>(units: T[], days: number): T[][] {
  const runs: T[][] = Array.from({ length: days }, () => []);
  const total = units.reduce((s, u) => s + u.verses, 0);
  const perDay = total / days;
  let cum = 0;
  let ui = 0;
  for (let di = 0; di < days && ui < units.length; di++) {
    const last = di === days - 1;
    const daysAfter = days - di - 1;
    const budget = perDay * (di + 1);
    do {
      runs[di].push(units[ui]);
      cum += units[ui].verses;
      ui++;
    } while (
      ui < units.length &&
      (last ||
        (units.length - ui > daysAfter && cum + units[ui].verses / 2 <= budget))
    );
  }
  return runs;
}

interface WeekDay {
  // A plain week's day, served straight from schedule.json.
  pinned?: { key: string; dayIndex: number };
  // Otherwise the run of the Shabbat's units this day prepares.
  units: Unit[];
}

interface WeekPlan {
  leining: Leining | null;
  days: Map<number, WeekDay>; // prep days only, keyed by abs
}

function computeWeek(shabbatAbs: number): WeekPlan {
  const prepAbs: number[] = [];
  for (let back = 6; back >= 1; back--) {
    const abs = shabbatAbs - back;
    if (!getDarkDay(dateOfAbs(abs))) prepAbs.push(abs);
  }

  const leining = leiningOn(shabbatAbs);
  const days = new Map<number, WeekDay>();
  if (!leining) {
    for (const abs of prepAbs) days.set(abs, { units: [] });
    return { leining, days };
  }

  const schedule = leining.parashaKey ? SCHEDULE[leining.parashaKey] : undefined;
  if (schedule && prepAbs.length === 6) {
    prepAbs.forEach((abs, dayIndex) =>
      days.set(abs, { pinned: { key: leining.parashaKey!, dayIndex }, units: [] }),
    );
    return { leining, days };
  }

  const runs = distribute(leining.units, Math.max(prepAbs.length, 1));
  prepAbs.forEach((abs, i) => days.set(abs, { units: runs[i] ?? [] }));
  return { leining, days };
}

// Plans are deterministic per week, and navigation revisits neighbouring days
// constantly, so keep the last few.
const weekCache = new Map<number, WeekPlan>();

function weekFor(abs: number, date: Date): { shabbatAbs: number; week: WeekPlan } {
  const shabbatAbs = abs + (6 - date.getDay());
  let week = weekCache.get(shabbatAbs);
  if (!week) {
    week = computeWeek(shabbatAbs);
    weekCache.set(shabbatAbs, week);
    if (weekCache.size > 12) {
      const first = weekCache.keys().next().value;
      if (first !== undefined) weekCache.delete(first);
    }
  }
  return { shabbatAbs, week };
}

export function planDay(date: Date): DayPlan {
  const dark = getDarkDay(date);
  if (dark) return { kind: 'dark', dark };

  const abs = absOf(date);
  const { shabbatAbs, week } = weekFor(abs, date);
  const day = week.days.get(abs);
  if (!day || !week.leining) return { kind: 'prep', segments: [] };
  const leinedOn = dateOfAbs(shabbatAbs).toISOString();

  if (day.pinned) {
    const schedDay = SCHEDULE[day.pinned.key]?.days[day.pinned.dayIndex];
    if (!schedDay) return { kind: 'prep', segments: [] };
    const isHaftarah = schedDay.aliyot.some((a) => typeof a === 'string');
    return {
      kind: 'prep',
      segments: [
        {
          nameEn: day.pinned.key,
          nameHe: '', // filled from PARASHA_HEBREW_NAMES by the fetch layer
          isParasha: true,
          parashaKey: day.pinned.key,
          leinedOn,
          aliyot: schedDay.aliyot,
          ref: schedDay.ref,
          isHaftarah,
          pinnedHaftarahDay: isHaftarah,
        },
      ],
    };
  }

  // Torah and haftarah are separate segments, so they never share a ref (or a
  // Targum request).
  const leining = week.leining;
  const segments: PlannedSegment[] = [];
  for (const isHaftarah of [false, true]) {
    const units = day.units.filter((u) => u.isHaftarah === isHaftarah);
    if (units.length === 0) continue;
    segments.push({
      nameEn: leining.nameEn,
      nameHe: leining.nameHe,
      isParasha: !!leining.parashaKey,
      parashaKey: leining.parashaKey,
      leinedOn,
      aliyot: units.map((u) => u.label),
      ref: mergeRefs(units),
      isHaftarah,
    });
  }
  return { kind: 'prep', segments };
}
