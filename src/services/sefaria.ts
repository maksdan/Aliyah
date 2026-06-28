import { transliterateNouns } from '../data/transliterations';
import {
  Rite,
  getHaftarahRef,
  getParashaSchedule,
  isHaftarahDay,
} from '../data/schedule';
import { getWeekday } from '../utils/today';

const BASE = 'https://www.sefaria.org/api';

export interface Verse {
  he: string;
  en: string;
  ref: string;
}

// One day's reading: either a group of aliyot (Sun–Thu) or the Friday Haftarah.
export interface DayReading {
  parashaEn: string;
  parashaHe: string;
  day: string; // 'Sunday' … 'Friday'
  isHaftarah: boolean;
  aliyot: (number | string)[];
  rite?: Rite; // set only for Haftarah days
  ref: string; // combined English ref shown to the user
  heRef: string;
  book: string;
  verses: Verse[];
}

interface CalendarItem {
  title: { en: string; he: string };
  displayValue: { en: string; he: string };
  extraDetails?: { aliyot?: string[] };
}

interface CalendarResponse {
  calendar_items: CalendarItem[];
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

async function fetchCurrentParasha(): Promise<{ en: string; he: string }> {
  const calRes = await fetch(`${BASE}/calendars?diaspora=1`);
  if (!calRes.ok) throw new Error('Could not load calendar from Sefaria');
  const cal: CalendarResponse = await calRes.json();

  const parasha = cal.calendar_items.find(
    (item) => item.title.en === 'Parashat Hashavua'
  );
  if (!parasha) throw new Error('Weekly parasha not found in calendar');

  return { en: parasha.displayValue.en, he: parasha.displayValue.he };
}

// Fetch today's reading per the static schedule. Returns null on Shabbat (no
// reading) or when the current parasha isn't in the schedule. `rite` only
// affects the Friday Haftarah.
export async function fetchTodayReading(rite: Rite): Promise<DayReading | null> {
  const weekday = getWeekday();
  if (weekday === 6) return null; // Shabbat — no reading

  const parasha = await fetchCurrentParasha();
  const schedule = getParashaSchedule(parasha.en);
  if (!schedule) throw new Error(`No schedule found for "${parasha.en}"`);

  const day = schedule.days[weekday];
  if (!day) return null;

  const haftarah = isHaftarahDay(day);
  const ref = haftarah ? getHaftarahRef(parasha.en, rite, day.ref) : day.ref;
  const { verses, heRef, book } = await fetchRef(ref);

  return {
    parashaEn: parasha.en,
    parashaHe: parasha.he,
    day: day.day,
    isHaftarah: haftarah,
    aliyot: day.aliyot,
    rite: haftarah ? rite : undefined,
    ref,
    heRef,
    book,
    verses,
  };
}
