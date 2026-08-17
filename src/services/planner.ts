// The reading planner.
//
// The app is a preparation tool: it is dark on exactly the days the readings
// happen — Shabbat and yom tov — so every reading has to be finished on the
// prep days strictly before the day it is leined. That turns the calendar into
// a scheduling problem, and three rules solve it:
//
//   1. BEFORE — a reading never appears on or after its own leining day.
//   2. IN SHUL ORDER — chunks appear in the order the shul will read them:
//      parasha, then chag I, then chag II, then the next parasha. Each reading
//      progresses in order, its haftarah last (which is why Friday is haftarah
//      day in a plain week — that falls out rather than being a special case).
//   3. LEVELED — when the days before a leining can't comfortably hold it, its
//      earliest chunks spill backward into the previous days, appended after
//      what those days already carry, sized to keep the daily load flat. A
//      chunk never appears more than LOOKBACK days before it is leined.
//
// Plain weeks — a Shabbat parasha with all six prep days intact and no spill
// landing on them — bypass all of this and use schedule.json exactly as ever.
//
// The measured stakes (diaspora, 5787–5789): without leveling the calendar
// produces real single days of 89, 175 and 200 verses — Achrei Mot after
// Pesach 2027, Pesach VII–VIII 2028 (one usable day), Nasso after Shavuot
// 2028. Leveling flattens those to ~50–75, which is what the season genuinely
// costs.

import { HDate, HebrewCalendar, flags } from '@hebcal/core';
import { getLeyningOnDate } from '@hebcal/leyning';
import { SCHEDULE } from '../data/schedule';

const LOOKBACK = 14; // days a chunk may appear before its leining
const RANGE_BACK = 56; // planning horizon behind the queried day…
const RANGE_FWD = 35; // …and ahead of it; both cover any chag season whole

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

// Sukkot I and II lein the identical Torah portion. Preparing it twice in the
// crunch of Tishrei helps no one, so consecutive leinings with the same Torah
// text merge: the portion once, then each day's haftarah.
function dedupe(leinings: Leining[]): Leining[] {
  const out: Leining[] = [];
  for (const cur of leinings) {
    const prev = out[out.length - 1];
    if (prev && cur.abs === prev.abs + 1) {
      const torah = (u: Unit) => !u.isHaftarah;
      // Signature is the merged text range: the same portion may be divided
      // into seven aliyot on Shabbat and five on a weekday.
      const sig = (ln: Leining) => mergeRefs(ln.units.filter(torah));
      if (sig(prev) === sig(cur) && sig(cur) !== '') {
        const prevHaft = prev.units.filter((u) => u.isHaftarah);
        const curHaft = cur.units.filter((u) => u.isHaftarah);
        prev.nameEn = mergeNames(prev.nameEn, cur.nameEn);
        prev.nameHe = mergeNames(prev.nameHe, cur.nameHe);
        prev.units = [
          ...prev.units.filter(torah),
          ...prevHaft.map((u) => ({ ...u, label: 'Haftarah I' })),
          // The second day's haftarah may be prepared a day later; keep its own
          // deadline by tagging the unit with the later day (see stream build).
          ...curHaft.map((u) => ({ ...u, label: 'Haftarah II', laterAbs: cur.abs } as Unit & {
            laterAbs?: number;
          })),
        ];
        continue;
      }
    }
    out.push({ ...cur, units: [...cur.units] });
  }
  return out;
}

// "Sukkot I" + "Sukkot II" -> "Sukkot I & II", the shared name said once.
//
// The ampersand is wrapped in non-breaking spaces deliberately. An en dash is a
// line-break opportunity, so "סֻכּוֹת א׳–ב׳" broke after the dash and left the
// ב׳ stranded alone on a second line; gluing the numerals together means the
// only place the title can break is the space after the name itself.
const NB = '\u00A0';

function mergeNames(a: string, b: string): string {
  const baseA = a.replace(/\s+(I|א׳)$/u, '');
  const baseB = b.replace(/\s+(II|ב׳)$/u, '');
  if (baseA === baseB) {
    const tailB = b.slice(baseB.length).trim();
    const tailA = a.slice(baseA.length).trim();
    return `${baseA} ${tailA}${NB}&${NB}${tailB}`;
  }
  return `${a}${NB}&${NB}${b}`;
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

interface PrepDay {
  abs: number;
  base: number; // verses already carried by a pinned plain week
  pinned?: { key: string; dayIndex: number; leinedAbs: number };
  extras: { leining: Leining; unit: Unit }[];
}

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

// How many verses a day should carry before its window starts borrowing
// earlier days. A typical plain day runs 15–25; plain weeks themselves spike
// to the mid-40s (Bereshit's Monday is 43), so this is a target, not a promise.
const DAILY_CAP = 30;

interface Cluster {
  firstAbs: number; // first dark day — every unit must be placed before this
  units: { leining: Leining; unit: Unit }[];
}

function computePlan(anchorAbs: number): Map<number, PrepDay> {
  const startAbs = anchorAbs - RANGE_BACK;
  const endAbs = anchorAbs + RANGE_FWD;

  // Walk the range: prep days, and leinings grouped into clusters of
  // consecutive dark days (Shabbat + adjacent yom tov read as one block).
  const prepDays: PrepDay[] = [];
  const rawLeinings: Leining[] = [];
  for (let abs = startAbs; abs <= endAbs; abs++) {
    const date = dateOfAbs(abs);
    if (getDarkDay(date)) {
      const ln = leiningOn(abs);
      if (ln) rawLeinings.push(ln);
    } else {
      prepDays.push({ abs, base: 0, extras: [] });
    }
  }
  const leinings = dedupe(rawLeinings);
  const prepByAbs = new Map(prepDays.map((d) => [d.abs, d]));

  // Pin plain weeks; everything else joins its cluster.
  const clusters: Cluster[] = [];
  for (const ln of leinings) {
    const schedule = ln.parashaKey ? SCHEDULE[ln.parashaKey] : undefined;
    const weekIntact =
      schedule && [6, 5, 4, 3, 2, 1].every((back) => prepByAbs.has(ln.abs - back));
    if (schedule && weekIntact) {
      for (let back = 6; back >= 1; back--) {
        const day = prepByAbs.get(ln.abs - back)!;
        const dayIndex = 6 - back; // Sunday=0 … Friday=5
        const schedDay = schedule.days[dayIndex];
        if (!schedDay) continue;
        day.pinned = { key: ln.parashaKey!, dayIndex, leinedAbs: ln.abs };
        day.base = schedDay.verses;
      }
      continue;
    }
    const prev = clusters[clusters.length - 1];
    const cluster =
      prev && isSameBlock(prev, ln, prepByAbs) ? prev : { firstAbs: ln.abs, units: [] };
    if (cluster !== prev) clusters.push(cluster);
    for (const unit of ln.units) cluster.units.push({ leining: ln, unit });
  }

  // Level each cluster into the days before it: its home window first, then —
  // only when a day would run past DAILY_CAP — earlier days, never more than
  // LOOKBACK days before the leining, borrowed chunks appended after whatever
  // those days already carry.
  const dayLoad = (d: PrepDay) => d.base + d.extras.reduce((s, e) => s + e.unit.verses, 0);
  for (const cluster of clusters) {
    const total = cluster.units.reduce((s, u) => s + u.unit.verses, 0);
    if (total === 0) continue;

    // The home window: prep days between the previous dark day and the cluster.
    let poolStart = cluster.firstAbs - 1;
    while (prepByAbs.has(poolStart - 1)) poolStart--;
    const earliestAllowed = Math.max(cluster.firstAbs - LOOKBACK, startAbs);

    const buildPool = (fromAbs: number) => {
      const pool: PrepDay[] = [];
      for (let abs = fromAbs; abs < cluster.firstAbs; abs++) {
        const day = prepByAbs.get(abs);
        if (day) pool.push(day);
      }
      return pool;
    };

    let pool = buildPool(poolStart);
    // Expand backward day by day while the leveled load would breach the cap.
    while (poolStart > earliestAllowed) {
      const existing = pool.reduce((s, d) => s + dayLoad(d), 0);
      if (pool.length > 0 && (existing + total) / pool.length <= DAILY_CAP) break;
      poolStart--;
      pool = buildPool(poolStart);
    }
    if (pool.length === 0) continue; // nothing usable — should not happen in practice

    // Cumulative fill: each unit lands on the day where its midpoint still
    // fits the running budget. Pacing against the cumulative total rather than
    // a per-day quota means an indivisible haftarah overshoots its own day a
    // little instead of dragging the whole tail forward and leaving the last
    // days of the window empty.
    const existing = pool.map((d) => dayLoad(d));
    const totalAll = existing.reduce((s, v) => s + v, 0) + total;
    const perDay = totalAll / pool.length;
    let cum = 0;
    let ui = 0;
    for (let di = 0; di < pool.length && ui < cluster.units.length; di++) {
      cum += existing[di];
      const budget = perDay * (di + 1);
      while (
        ui < cluster.units.length &&
        (di === pool.length - 1 || cum + cluster.units[ui].unit.verses / 2 <= budget)
      ) {
        pool[di].extras.push(cluster.units[ui]);
        cum += cluster.units[ui].unit.verses;
        ui++;
      }
    }
  }

  return prepByAbs;
}

// Two leinings share a block when their dark days are consecutive — no prep
// day between them.
function isSameBlock(
  cluster: Cluster,
  ln: Leining,
  prepByAbs: Map<number, PrepDay>,
): boolean {
  for (let abs = cluster.firstAbs; abs < ln.abs; abs++) {
    if (prepByAbs.has(abs)) return false;
  }
  return true;
}

// A small cache: plans are deterministic per anchor, and navigation revisits
// neighbouring days constantly.
const planCache = new Map<number, Map<number, PrepDay>>();

function planFor(abs: number): Map<number, PrepDay> {
  // Anchor plans to a fixed grid so neighbouring days share one plan and the
  // cache stays small. Grid step is well under RANGE_BACK/RANGE_FWD margins.
  const anchor = abs - (abs % 7);
  let plan = planCache.get(anchor);
  if (!plan) {
    plan = computePlan(anchor);
    planCache.set(anchor, plan);
    if (planCache.size > 12) {
      const first = planCache.keys().next().value;
      if (first !== undefined) planCache.delete(first);
    }
  }
  return plan;
}

export function planDay(date: Date): DayPlan {
  const dark = getDarkDay(date);
  if (dark) return { kind: 'dark', dark };

  const abs = absOf(date);
  const day = planFor(abs).get(abs);
  if (!day) return { kind: 'prep', segments: [] };

  const segments: PlannedSegment[] = [];

  if (day.pinned) {
    const schedule = SCHEDULE[day.pinned.key];
    const schedDay = schedule?.days[day.pinned.dayIndex];
    if (schedDay) {
      const isHaftarah = schedDay.aliyot.some((a) => typeof a === 'string');
      segments.push({
        nameEn: day.pinned.key,
        nameHe: '', // filled from PARASHA_HEBREW_NAMES by the fetch layer
        isParasha: true,
        parashaKey: day.pinned.key,
        leinedOn: dateOfAbs(day.pinned.leinedAbs).toISOString(),
        aliyot: schedDay.aliyot,
        ref: schedDay.ref,
        isHaftarah,
        pinnedHaftarahDay: isHaftarah,
      });
    }
  }

  // Group consecutive extras of the same leining, haftarah units always their
  // own segment so Torah and haftarah never share a ref (or a Targum request).
  let group: { leining: Leining; units: Unit[] } | null = null;
  const flush = () => {
    if (!group) return;
    segments.push({
      nameEn: group.leining.nameEn,
      nameHe: group.leining.nameHe,
      isParasha: !!group.leining.parashaKey,
      parashaKey: group.leining.parashaKey,
      leinedOn: dateOfAbs(group.leining.abs).toISOString(),
      aliyot: group.units.map((u) => u.label),
      ref: mergeRefs(group.units),
      isHaftarah: group.units.every((u) => u.isHaftarah),
    });
    group = null;
  };
  for (const extra of day.extras) {
    const splitsFromGroup =
      !group ||
      group.leining !== extra.leining ||
      group.units[0].isHaftarah !== extra.unit.isHaftarah;
    if (splitsFromGroup) {
      flush();
      group = { leining: extra.leining, units: [extra.unit] };
    } else {
      group!.units.push(extra.unit);
    }
  }
  flush();

  return { kind: 'prep', segments };
}
