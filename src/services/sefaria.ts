import { transliterateNouns } from '../data/transliterations';
import type { PlannedSegment } from './planner';
import { planDay } from './planner';
import { DAY_NAMES_EN, formatAliyotLabel } from '../utils/aliyah';
import type { Rite } from '../data/schedule';
import { getHaftarahRef } from '../data/schedule';

const BASE = 'https://www.sefaria.org/api';

export interface Verse {
  he: string;
  en: string;
  ref: string;
}

// One portion of a day: a run of aliyot or a haftarah, belonging to one
// leining. A plain day has exactly one; a chag-season day may carry several
// ("Nitzavim — Haftarah" then "Rosh Hashana I — Aliyah 1").
export interface ReadingSegment {
  nameEn: string;
  nameHe: string;
  isHoliday: boolean;
  sectionLabel: string; // "Aliyot 2 & 3", "Haftarah", "Maftir"
  leinedOn: string; // ISO date of the leining this prepares
  isHaftarah: boolean;
  ref: string;
  heRef: string;
  book: string;
  verses: Verse[];
}

// One day's preparation: the ordered segments, plus flattened views the screen
// renders from. On a plain week this is exactly the old single reading.
export interface DayReading {
  parashaEn: string;
  parashaHe: string;
  day: string; // 'Sunday' … 'Friday'
  isHaftarah: boolean; // the whole day is haftarah (plain Friday)
  aliyot: (number | string)[];
  rite?: Rite; // set only for Haftarah days
  ref: string; // combined English ref shown to the user
  heRef: string;
  book: string;
  verses: Verse[]; // all segments' verses, flattened in order
  segments: ReadingSegment[];
  segmentOfVerse: number[]; // flat verse index -> segment index
  isHoliday?: boolean; // first segment is a chag's reading
}

interface TextResponse {
  he: string | string[] | string[][];
  text: string | string[] | string[][];
  heRef: string;
  ref: string;
  book: string;
  sections: number[];
  toSections: number[];
}

function buildVerseRefs(
  raw: string | string[] | string[][],
  sections: number[],
): string[] {
  if (!raw) return [];
  if (typeof raw === 'string') return [`${sections[0]}:${sections[1]}`];

  const arr = raw as (string | string[])[];
  if (arr.length === 0) return [];

  if (typeof arr[0] === 'string') {
    const chapter = sections[0];
    const startVerse = sections[1];
    return (arr as string[]).map((_, i) => `${chapter}:${startVerse + i}`);
  }

  const nested = arr as string[][];
  const refs: string[] = [];
  nested.forEach((chapterVerses, chapterIdx) => {
    const chapter = sections[0] + chapterIdx;
    const startVerse = chapterIdx === 0 ? sections[1] : 1;
    chapterVerses.forEach((_, verseIdx) => {
      refs.push(`${chapter}:${startVerse + verseIdx}`);
    });
  });
  return refs;
}

function flattenText(raw: string | string[] | string[][]): string[] {
  if (!raw) return [];
  if (typeof raw === 'string') return [raw];
  const arr = raw as (string | string[])[];
  if (arr.length === 0) return [];
  if (typeof arr[0] === 'string') return arr as string[];
  return (arr as string[][]).flat();
}

// Quotation/apostrophe entities Sefaria's JPS text uses for speech. These must
// be decoded to real characters BEFORE the catch-all entity removal below, or
// quotation marks around dialogue would be silently deleted.
const QUOTE_ENTITIES: Record<string, string> = {
  '&ldquo;': '“', // " opening double — speech
  '&rdquo;': '”', // " closing double — speech
  '&lsquo;': '‘', // ' opening single — quote within a quote
  '&rsquo;': '’', // ' closing single / apostrophe
  '&quot;': '”',
  '&apos;': '’',
  '&#34;': '”',
  '&#39;': '’',
  '&#8216;': '‘',
  '&#8217;': '’',
  '&#8220;': '“',
  '&#8221;': '”',
};

function decodeQuotes(s: string): string {
  return s.replace(
    /&(?:ldquo|rdquo|lsquo|rsquo|quot|apos|#34|#39|#8216|#8217|#8220|#8221);/g,
    (m) => QUOTE_ENTITIES[m] ?? m,
  );
}

function stripHtml(s: string): string {
  return decodeQuotes(s)
    .replace(/<br\s*\/?>/gi, ' ')           // <br> tags: always a word separator
    .replace(/<[^>]*>/g, '')               // inline tags (spans, b, small, etc.): remove without space
    .replace(/\{[^}]*\}/g, ' ')           // remove Torah section markers: {ס} {פ}
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#?\w+;/g, '')      // catch-all for any remaining HTML entities
    .replace(/\s+/g, ' ')         // collapse runs of whitespace left by removals
    .trim();
}

interface RefText {
  verses: Verse[];
  heRef: string;
  book: string;
}

// Fetch a single contiguous Sefaria ref (e.g. "Genesis 2:4-3:21").
async function fetchOneRef(ref: string): Promise<RefText> {
  const encodedRef = encodeURIComponent(ref);
  const textRes = await fetch(
    `${BASE}/texts/${encodedRef}?commentary=0&context=0&pad=0&wrapLinks=0&stripItags=1`
  );
  if (!textRes.ok) throw new Error('Could not load text from Sefaria');
  const textData: TextResponse = await textRes.json();

  const verseRefs = buildVerseRefs(textData.text, textData.sections);
  const heVerses = flattenText(textData.he);
  const enVerses = flattenText(textData.text);

  const len = Math.max(heVerses.length, enVerses.length);
  const verses = Array.from({ length: len }, (_, i) => ({
    he: stripHtml(heVerses[i] ?? ''),
    en: transliterateNouns(stripHtml(enVerses[i] ?? '')),
    ref: verseRefs[i] ?? '',
  })).filter((v) => v.he || v.en);

  // Book name for source attribution (e.g. "Deuteronomy"). Prefer the API's
  // `book` field; fall back to stripping the chapter:verse range off `ref`.
  const book = textData.book || (textData.ref ?? '').replace(/\s+\d+[:\d\s,.-]*$/, '').trim();

  return { verses, heRef: textData.heRef, book };
}

// Fetch a ref that may contain several disjoint ranges joined by "; "
// (common for haftarot, e.g. "Isaiah 6:1-7:6; Isaiah 9:5-9:6").
async function fetchRef(ref: string): Promise<RefText> {
  const parts = ref.split(/;\s*/).filter(Boolean);
  if (parts.length === 1) return fetchOneRef(parts[0]);

  const results = await Promise.all(parts.map(fetchOneRef));
  return {
    verses: results.flatMap((r) => r.verses),
    heRef: results.map((r) => r.heRef).join('; '),
    book: results[0].book,
  };
}

const PARASHA_HEBREW_NAMES: Record<string, string> = {
  'Bereshit': 'בְּרֵאשִׁית',
  'Noach': 'נֹחַ',
  'Lech-Lecha': 'לֶךְ-לְךָ',
  'Vayera': 'וַיֵּרָא',
  'Chayei Sara': 'חַיֵּי שָׂרָה',
  'Toldot': 'תּוֹלְדוֹת',
  'Vayetzei': 'וַיֵּצֵא',
  'Vayishlach': 'וַיִּשְׁלַח',
  'Vayeshev': 'וַיֵּשֶׁב',
  'Miketz': 'מִקֵּץ',
  'Vayigash': 'וַיִּגַּשׁ',
  'Vayechi': 'וַיְחִי',
  'Shemot': 'שְׁמוֹת',
  'Vaera': 'וָאֵרָא',
  'Bo': 'בֹּא',
  'Beshalach': 'בְּשַׁלַּח',
  'Yitro': 'יִתְרוֹ',
  'Mishpatim': 'מִשְׁפָּטִים',
  'Terumah': 'תְּרוּמָה',
  'Tetzaveh': 'תְּצַוֶּה',
  'Ki Tisa': 'כִּי תִשָּׂא',
  'Vayakhel': 'וַיַּקְהֵל',
  'Pekudei': 'פְקוּדֵי',
  'Vayikra': 'וַיִּקְרָא',
  'Tzav': 'צַו',
  'Shmini': 'שְּׁמִינִי',
  'Tazria': 'תַזְרִיעַ',
  'Metzora': 'מְצֹרָע',
  'Achrei Mot': 'אַחֲרֵי מוֹת',
  'Kedoshim': 'קְדֹשִׁים',
  'Emor': 'אֱמוֹר',
  'Behar': 'בְּהַר',
  'Bechukotai': 'בְּחֻקֹּתַי',
  'Bamidbar': 'בְּמִדְבַּר',
  'Nasso': 'נָשֹׂא',
  "Beha'alotcha": 'בְּהַעֲלֹתְךָ',
  "Sh'lach": 'שְׁלַח-לְךָ',
  'Korach': 'קֹרַח',
  'Chukat': 'חֻקַּת',
  'Balak': 'בָּלָק',
  'Pinchas': 'פִּינְחָס',
  'Matot': 'מַטּוֹת',
  'Masei': 'מַסְּעֵי',
  'Devarim': 'דְּבָרִים',
  'Vaetchanan': 'וָאֶתְחַנַּן',
  'Eikev': 'עֵקֶב',
  "Re'eh": 'רְאֵה',
  'Shoftim': 'שֹׁפְטִים',
  'Ki Teitzei': 'כִּי תֵצֵא',
  'Ki Tavo': 'כִּי תָבֹוא',
  'Nitzavim': 'נִצָּבִים',
  'Vayeilech': 'וַיֵּלֶךְ',
  "Ha'azinu": 'הַאֲזִינוּ',
  'Vzot Haberakhah': 'וְזֹאת הַבְּרָכָה',
};

// The Hebrew of a parasha name, combined weeks included: the map holds the
// single names, so "Nitzavim-Vayeilech" resolves part by part — trying the
// whole key first, because "Lech-Lecha" is a single parasha with a hyphen of
// its own.
function parashaHebrewName(key: string): string | undefined {
  if (PARASHA_HEBREW_NAMES[key]) return PARASHA_HEBREW_NAMES[key];
  const parts = key.split('-');
  if (parts.length > 1 && parts.every((p) => PARASHA_HEBREW_NAMES[p])) {
    return parts.map((p) => PARASHA_HEBREW_NAMES[p]).join('-');
  }
  return undefined;
}

// Fetch Targum Onkelos for a Torah ref. Returns null for haftarah (multi-part
// refs with ";") or when Onkelos isn't available for the passage.
export async function fetchTargumVerses(ref: string): Promise<Verse[] | null> {
  // Multi-part refs used to be rejected outright as haftarot, which they were
  // until the holiday readings arrived: a chag's Torah portion is routinely
  // "Genesis 22:1-24; Numbers 29:1-6", and Onkelos covers both halves. Each
  // part is asked for separately, and a part Onkelos does not cover — anything
  // outside the Torah, a haftarah above all — fails the whole request, which is
  // the same answer as before for those.
  try {
    const parts = ref.split(/;\s*/).filter(Boolean);
    const results = await Promise.all(parts.map((p) => fetchOneRef(`Onkelos ${p}`)));
    const verses = results.flatMap((r) => r.verses);
    return verses.length > 0 ? verses : null;
  } catch {
    return null;
  }
}

// Assemble the day from the planner: each planned segment fetched and labelled.
// Returns null on dark days (Shabbat and yom tov — the screen asks the planner
// directly what to call them). `rite` only affects a plain Friday's haftarah.
export async function fetchTodayReading(rite: Rite, date: Date = new Date()): Promise<DayReading | null> {
  const plan = planDay(date);
  if (plan.kind !== 'prep' || plan.segments.length === 0) return null;

  const segments = await Promise.all(plan.segments.map((ps) => fetchSegment(ps, rite)));
  const nonEmpty = segments.filter((s): s is ReadingSegment => s !== null);
  if (nonEmpty.length === 0) return null;

  const first = nonEmpty[0];
  const verses = nonEmpty.flatMap((s) => s.verses);
  const segmentOfVerse = nonEmpty.flatMap((s, i) => s.verses.map(() => i));
  const wholeDayHaftarah = nonEmpty.every((s) => s.isHaftarah);

  return {
    parashaEn: first.nameEn,
    parashaHe: first.nameHe,
    day: DAY_NAMES_EN[date.getDay()],
    isHaftarah: wholeDayHaftarah,
    aliyot: plan.segments[0].aliyot,
    rite: wholeDayHaftarah ? rite : undefined,
    ref: nonEmpty.map((s) => s.ref).join(' · '),
    heRef: first.heRef,
    book: first.book,
    verses,
    segments: nonEmpty,
    segmentOfVerse,
    isHoliday: first.isHoliday,
  };
}

async function fetchSegment(ps: PlannedSegment, rite: Rite): Promise<ReadingSegment | null> {
  // A plain Friday keeps the Ashkenazi/Sephardi haftarah choice.
  const ref = ps.pinnedHaftarahDay && ps.parashaKey
    ? getHaftarahRef(ps.parashaKey, rite, ps.ref)
    : ps.ref;
  const { verses, heRef, book } = await fetchRef(ref);
  if (verses.length === 0) return null;
  return {
    nameEn: ps.nameEn,
    nameHe: ps.isParasha ? parashaHebrewName(ps.nameEn) || ps.nameHe || ps.nameEn : ps.nameHe,
    isHoliday: !ps.isParasha,
    sectionLabel: formatAliyotLabel(ps.aliyot),
    leinedOn: ps.leinedOn,
    isHaftarah: ps.isHaftarah,
    ref,
    heRef,
    book,
    verses,
  };
}

// Targum Onkelos for the whole day, aligned to the flat verse index: Torah
// segments get their verses, haftarah segments get nulls. Null overall when no
// segment has Onkelos at all.
export async function fetchTargumForReading(reading: DayReading): Promise<(Verse | null)[] | null> {
  const per = await Promise.all(
    reading.segments.map((s) => (s.isHaftarah ? Promise.resolve(null) : fetchTargumVerses(s.ref))),
  );
  if (per.every((p) => p === null)) return null;
  return reading.segments.flatMap((s, i) => {
    const t = per[i];
    // Misaligned Onkelos would pair verse i with another verse's Aramaic —
    // drop the segment instead.
    if (!t || t.length !== s.verses.length) return s.verses.map(() => null);
    return t;
  });
}
