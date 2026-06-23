const BASE = 'https://www.sefaria.org/api';

export interface AliyahData {
  parashaEn: string;
  parashaHe: string;
  heRef: string;
  aliyahIndex: number;
  verses: { he: string; en: string }[];
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
}

function flattenText(raw: string | string[] | string[][]): string[] {
  if (!raw) return [];
  if (typeof raw === 'string') return [raw];
  const arr = raw as (string | string[])[];
  if (arr.length === 0) return [];
  if (typeof arr[0] === 'string') return arr as string[];
  return (arr as string[][]).flat();
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, '')      // remove HTML tags (spans, br, small, etc.)
    .replace(/\{[^}]*\}/g, '')    // remove Torah section markers: {ס} {פ}
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#?\w+;/g, '')      // catch-all for any remaining HTML entities
    .replace(/\s+/g, ' ')         // collapse runs of whitespace left by removals
    .trim();
}

export async function fetchAliyah(aliyahIndex: number): Promise<AliyahData> {
  const calRes = await fetch(`${BASE}/calendars?diaspora=1`);
  if (!calRes.ok) throw new Error('Could not load calendar from Sefaria');
  const cal: CalendarResponse = await calRes.json();

  const parasha = cal.calendar_items.find(
    (item) => item.title.en === 'Parashat Hashavua'
  );
  if (!parasha) throw new Error('Weekly parasha not found in calendar');

  const aliyot = parasha.extraDetails?.aliyot;
  if (!aliyot || aliyot.length < 7) throw new Error('Aliyah data not available');

  const ref = aliyot[aliyahIndex];
  const encodedRef = encodeURIComponent(ref);

  const textRes = await fetch(
    `${BASE}/texts/${encodedRef}?commentary=0&context=0&pad=0&wrapLinks=0&stripItags=1`
  );
  if (!textRes.ok) throw new Error('Could not load aliyah text from Sefaria');
  const textData: TextResponse = await textRes.json();

  const heVerses = flattenText(textData.he);
  const enVerses = flattenText(textData.text);

  const len = Math.max(heVerses.length, enVerses.length);
  const verses = Array.from({ length: len }, (_, i) => ({
    he: stripHtml(heVerses[i] ?? ''),
    en: stripHtml(enVerses[i] ?? ''),
  })).filter((v) => v.he || v.en);

  return {
    parashaEn: parasha.displayValue.en,
    parashaHe: parasha.displayValue.he,
    heRef: textData.heRef,
    aliyahIndex,
    verses,
  };
}
