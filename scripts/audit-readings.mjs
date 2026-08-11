/**
 * Full-year audit of every reading the app can show.
 *
 * For each parasha in schedule.json — its five Torah days plus the Friday
 * haftarah in both rites — this fetches exactly what the app fetches and checks:
 *
 *   1. Rendering: every verse has Hebrew and English, the two arrays line up,
 *      the verse count matches the schedule, and no HTML/entity debris survived
 *      stripHtml. For Torah days it also fetches Targum Onkelos and checks it
 *      lines up index-for-index with the Hebrew, since HomeScreen pairs them by
 *      array position (targumVerses[i]).
 *   2. Glossary: which words in the year's English actually highlight, which
 *      look like unlisted offshoots of a glossary concept, and whether any two
 *      related forms carry different definitions.
 *
 * Responses are cached under the scratchpad so re-runs are free.
 * Run with: node scripts/audit-readings.mjs [--no-net]
 */

import { createRequire } from 'module';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { DEFINITIONS, FORMS, GLOSSARY } from '../src/data/glossary.ts';

const require = createRequire(import.meta.url);
const schedule = require('../src/data/schedule.json');

const CACHE_DIR =
  process.env.AUDIT_CACHE ||
  '/private/tmp/claude-501/-Users-danielmaksumov/b9ce58f2-1404-49a7-b45a-772f682670c5/scratchpad/sefaria-cache';
mkdirSync(CACHE_DIR, { recursive: true });

const BASE = 'https://www.sefaria.org/api';
const OFFLINE = process.argv.includes('--no-net');

// --- Sephardi haftarot, mirrored from src/data/schedule.ts -----------------
const SEPHARDI_HAFTARAH = {
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
  'Vayakhel-Pekudei': 'I Kings 7:40-7:50',
  'Matot-Masei': 'Jeremiah 2:4-2:28; Jeremiah 4:1-4:2',
};

// --- Text pipeline, mirrored from src/services/sefaria.ts ------------------
const QUOTE_ENTITIES = {
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&quot;': '”',
  '&apos;': '’',
  '&#34;': '”',
  '&#39;': '’',
  '&#8216;': '‘',
  '&#8217;': '’',
  '&#8220;': '“',
  '&#8221;': '”',
};

function decodeQuotes(s) {
  return s.replace(
    /&(?:ldquo|rdquo|lsquo|rsquo|quot|apos|#34|#39|#8216|#8217|#8220|#8221);/g,
    (m) => QUOTE_ENTITIES[m] ?? m,
  );
}

function stripHtml(s) {
  return decodeQuotes(s)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#?\w+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function flattenText(raw) {
  if (!raw) return [];
  if (typeof raw === 'string') return [raw];
  if (raw.length === 0) return [];
  if (typeof raw[0] === 'string') return raw;
  return raw.flat();
}

function buildVerseRefs(raw, sections) {
  if (!raw) return [];
  if (typeof raw === 'string') return [`${sections[0]}:${sections[1]}`];
  if (raw.length === 0) return [];
  if (typeof raw[0] === 'string') {
    return raw.map((_, i) => `${sections[0]}:${sections[1] + i}`);
  }
  const refs = [];
  raw.forEach((chapterVerses, chapterIdx) => {
    const chapter = sections[0] + chapterIdx;
    const startVerse = chapterIdx === 0 ? sections[1] : 1;
    chapterVerses.forEach((_, verseIdx) => refs.push(`${chapter}:${startVerse + verseIdx}`));
  });
  return refs;
}

// --- Fetch with on-disk cache ---------------------------------------------
async function apiGet(ref) {
  const file = `${CACHE_DIR}/${createHash('sha1').update(ref).digest('hex')}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  if (OFFLINE) return { __error: 'not cached' };
  const url = `${BASE}/texts/${encodeURIComponent(ref)}?commentary=0&context=0&pad=0&wrapLinks=0&stripItags=1`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      if (!res.ok) {
        const out = { __error: `HTTP ${res.status}` };
        writeFileSync(file, JSON.stringify(out));
        return out;
      }
      const data = await res.json();
      const slim = {
        he: data.he,
        text: data.text,
        heRef: data.heRef,
        ref: data.ref,
        book: data.book,
        sections: data.sections,
      };
      writeFileSync(file, JSON.stringify(slim));
      return slim;
    } catch (e) {
      if (attempt === 2) return { __error: String(e && e.message ? e.message : e) };
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  return { __error: 'unreachable' };
}

// One contiguous ref, processed exactly as fetchOneRef does, but keeping the
// raw arrays so the audit can see what the app's filter dropped.
async function fetchOneRef(ref) {
  const data = await apiGet(ref);
  if (data.__error) return { error: data.__error, verses: [], rawHe: [], rawEn: [] };
  const rawHe = flattenText(data.he);
  const rawEn = flattenText(data.text);
  const verseRefs = buildVerseRefs(data.text, data.sections || []);
  const len = Math.max(rawHe.length, rawEn.length);
  const all = Array.from({ length: len }, (_, i) => ({
    he: stripHtml(rawHe[i] ?? ''),
    en: stripHtml(rawEn[i] ?? ''),
    rawHe: rawHe[i] ?? '',
    rawEn: rawEn[i] ?? '',
    ref: verseRefs[i] ?? '',
  }));
  return { verses: all.filter((v) => v.he || v.en), all, rawHe, rawEn, error: null };
}

async function fetchRef(ref) {
  const parts = ref.split(/;\s*/).filter(Boolean);
  const results = [];
  for (const p of parts) results.push(await fetchOneRef(p));
  return {
    verses: results.flatMap((r) => r.verses),
    all: results.flatMap((r) => r.all ?? []),
    rawHe: results.flatMap((r) => r.rawHe ?? []),
    rawEn: results.flatMap((r) => r.rawEn ?? []),
    error: results.map((r) => r.error).filter(Boolean).join('; ') || null,
  };
}

// --- Tokenizer, mirrored from src/components/SelectableText.tsx ------------
const WORD_BOUNDARY = /(\s+|[—–])/;

function glossaryKey(part) {
  return part
    .replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '')
    .replace(/[’']s$/, '')
    .toLowerCase();
}

// --- Morphology: is `b` plausibly an offshoot of `a`? ----------------------
function variantsOf(w) {
  const v = new Set([w + 's', w + 'es', w + 'ed', w + 'ing', w + 'er', w + 'ers']);
  if (w.endsWith('e')) {
    const stem = w.slice(0, -1);
    v.add(stem + 'ed').add(stem + 'ing').add(stem + 'es').add(stem + 'er').add(stem + 'ers');
  }
  if (w.endsWith('y')) {
    const stem = w.slice(0, -1);
    v.add(stem + 'ies').add(stem + 'ied').add(stem + 'ier');
  }
  if (/[^aeiou][aeiou][bdgklmnprt]$/.test(w)) {
    const dbl = w + w.slice(-1);
    v.add(dbl + 'ed').add(dbl + 'ing').add(dbl + 'er');
  }
  if (w.endsWith('s')) v.add(w.slice(0, -1));
  if (w.endsWith('es')) v.add(w.slice(0, -2));
  return v;
}

function related(a, b) {
  if (a === b) return false;
  if (variantsOf(a).has(b) || variantsOf(b).has(a)) return true;
  // Shared derivational stem: abomination/abominable, expiation/expiate.
  const short = a.length <= b.length ? a : b;
  const long = a.length <= b.length ? b : a;
  let i = 0;
  while (i < short.length && short[i] === long[i]) i++;
  return i >= 5 && i >= short.length - 3 && long.length - i <= 5;
}

// ===========================================================================
const readings = [];
for (const [parasha, entry] of Object.entries(schedule)) {
  for (const day of entry.days) {
    const isHaftarah = day.aliyot.some((a) => typeof a === 'string');
    if (!isHaftarah) {
      readings.push({ parasha, day: day.day, ref: day.ref, kind: 'torah', expect: day.verses });
      continue;
    }
    readings.push({ parasha, day: day.day, ref: day.ref, kind: 'haftarah', rite: 'ashkenazi', expect: day.verses });
    const sephardi = SEPHARDI_HAFTARAH[parasha];
    if (sephardi && sephardi !== day.ref) {
      readings.push({ parasha, day: day.day, ref: sephardi, kind: 'haftarah', rite: 'sephardi', expect: null });
    }
  }
}

// Verse counts that differ from schedule.json because Sefaria versifies the
// passage differently, not because any text is missing. Verified by reading the
// Hebrew: nothing is dropped, the clause simply sits under another number.
const KNOWN_VERSIFICATION = {
  'Numbers 25:10-26:4':
    'schedule counts the Masoretic Num 25:19 ("and it was after the plague"); ' +
    'Sefaria folds that clause into 26:1, so 14 traditional verses arrive as 13',
};

// --- Schedule coverage: Sun–Thu must tile the parasha with no gap ----------
// A gap here is text no reader ever sees, and the app would never notice: it
// only ever asks for one day's ref at a time.
const coverageGaps = [];
function parseRange(ref) {
  const m = ref.match(/^(.*?)\s+(\d+):(\d+)-(?:(\d+):)?(\d+)$/);
  if (!m) return null;
  const [, book, c1, v1, c2, v2] = m;
  return { book, start: [+c1, +v1], end: [c2 ? +c2 : +c1, +v2] };
}
for (const [parasha, entry] of Object.entries(schedule)) {
  const torah = entry.days.filter((d) => !d.aliyot.some((a) => typeof a === 'string'));
  for (let i = 1; i < torah.length; i++) {
    const prev = parseRange(torah[i - 1].ref);
    const cur = parseRange(torah[i].ref);
    if (!prev || !cur) {
      coverageGaps.push(`${parasha}: unparseable ref "${torah[i - 1].ref}" / "${torah[i].ref}"`);
      continue;
    }
    const sameChapterNext = cur.start[0] === prev.end[0] && cur.start[1] === prev.end[1] + 1;
    const nextChapterStart = cur.start[0] === prev.end[0] + 1 && cur.start[1] === 1;
    if (prev.book !== cur.book || (!sameChapterNext && !nextChapterStart)) {
      coverageGaps.push(
        `${parasha}: ${torah[i - 1].day} ends ${prev.book} ${prev.end.join(':')} but ` +
          `${torah[i].day} starts ${cur.book} ${cur.start.join(':')}`,
      );
    }
  }
}

process.stderr.write(`Auditing ${readings.length} readings across ${Object.keys(schedule).length} parashiot\n`);

const problems = []; // rendering issues
const wordHits = new Map(); // glossary key -> occurrences
const wordSeen = new Map(); // every English token -> {count, where}
let totalVerses = 0;
let torahDays = 0;
let targumDays = 0;

function note(kind, r, detail) {
  problems.push({ kind, parasha: r.parasha, day: r.day, ref: r.ref, rite: r.rite, detail });
}

let done = 0;
for (const r of readings) {
  const { verses, all, rawHe, rawEn, error } = await fetchRef(r.ref);
  if (error) {
    note('fetch-failed', r, error);
  } else {
    if (verses.length === 0) note('empty-reading', r, 'no verses returned');
    if (r.expect != null && verses.length !== r.expect && !KNOWN_VERSIFICATION[r.ref]) {
      note('verse-count', r, `schedule says ${r.expect}, Sefaria returns ${verses.length}`);
    }
    if (rawHe.length !== rawEn.length) {
      note('he-en-length', r, `he ${rawHe.length} vs en ${rawEn.length} — index pairing shifts`);
    }
    all.forEach((v, i) => {
      if (!v.he) note('missing-hebrew', r, `verse ${v.ref || i + 1}`);
      if (!v.en) note('missing-english', r, `verse ${v.ref || i + 1}`);
      if (/<[a-z/][^>]*>/i.test(v.he) || /<[a-z/][^>]*>/i.test(v.en)) {
        note('html-debris', r, `verse ${v.ref || i + 1}`);
      }
      if (/&[a-z#0-9]+;/i.test(v.rawHe + v.rawEn) && /&[a-z#0-9]+;/i.test(v.he + v.en)) {
        note('entity-debris', r, `verse ${v.ref || i + 1}`);
      }
    });
    totalVerses += verses.length;

    // Glossary tally over the English
    for (const v of verses) {
      for (const part of v.en.split(WORD_BOUNDARY)) {
        const key = glossaryKey(part);
        if (!key) continue;
        const rec = wordSeen.get(key) || { count: 0, where: new Set() };
        rec.count++;
        if (rec.where.size < 4) rec.where.add(`${r.parasha} ${v.ref}`);
        wordSeen.set(key, rec);
        if (GLOSSARY[key]) {
          const hit = wordHits.get(key) || { count: 0, where: new Set() };
          hit.count++;
          if (hit.where.size < 3) hit.where.add(`${r.parasha} ${v.ref}`);
          wordHits.set(key, hit);
        }
      }
    }
  }

  // Targum Onkelos — Torah days only, paired by index in HomeScreen.
  if (r.kind === 'torah') {
    torahDays++;
    const t = await fetchRef(`Onkelos ${r.ref}`);
    if (t.error || t.verses.length === 0) {
      note('targum-missing', r, t.error || 'Onkelos returned no verses');
    } else {
      targumDays++;
      if (t.verses.length !== verses.length) {
        note('targum-count', r, `Hebrew ${verses.length} verses, Onkelos ${t.verses.length} — pairing shifts`);
      }
      t.all.forEach((v, i) => {
        if (!v.he) note('targum-empty-verse', r, `verse ${v.ref || i + 1}`);
      });
      // Verse refs must line up one-for-one, or verse i shows another verse's Aramaic.
      const n = Math.min(t.verses.length, verses.length);
      for (let i = 0; i < n; i++) {
        if (t.verses[i].ref !== verses[i].ref) {
          note('targum-misaligned', r, `slot ${i}: Hebrew ${verses[i].ref} vs Onkelos ${t.verses[i].ref}`);
          break;
        }
      }
    }
  }

  done++;
  if (done % 25 === 0) process.stderr.write(`  ${done}/${readings.length}\n`);
}

// ===========================================================================
// Glossary analysis
// ===========================================================================
const glossaryKeys = Object.keys(GLOSSARY);
const unused = glossaryKeys.filter((k) => !wordHits.has(k));
const missingOffshoots = [];
const inconsistent = [];

for (const [word, rec] of wordSeen) {
  if (GLOSSARY[word]) continue;
  if (word.length < 4) continue;
  const lemmas = glossaryKeys.filter((k) => related(k, word));
  if (lemmas.length) missingOffshoots.push({ word, lemmas, ...rec });
}

for (let i = 0; i < glossaryKeys.length; i++) {
  for (let j = i + 1; j < glossaryKeys.length; j++) {
    const a = glossaryKeys[i];
    const b = glossaryKeys[j];
    if (GLOSSARY[a] === GLOSSARY[b]) continue;
    if (related(a, b)) inconsistent.push([a, b]);
  }
}

// A form pointing at a lemma that isn't defined is dropped by glossary.ts, so
// it would silently stop highlighting rather than fail loudly. Catch it here.
const danglingForms = Object.entries(FORMS)
  .filter(([, lemma]) => typeof DEFINITIONS[lemma] !== 'string')
  .map(([form, lemma]) => `${form} -> ${lemma}`);
const undefinedValues = glossaryKeys.filter((k) => typeof GLOSSARY[k] !== 'string');

// ===========================================================================
const out = [];
const p = (s = '') => out.push(s);

p(`# Full-year audit`);
p();
p(`Readings checked : ${readings.length} (${torahDays} Torah days, ${readings.length - torahDays} haftarot incl. both rites)`);
p(`Verses checked   : ${totalVerses}`);
p(`Targum fetched   : ${targumDays}/${torahDays} Torah days`);
p();

p(`## Known versification differences (${Object.keys(KNOWN_VERSIFICATION).length})`);
p();
for (const [ref, why] of Object.entries(KNOWN_VERSIFICATION)) p(`  ${ref} — ${why}`);
p();

p(`## Schedule coverage gaps (${coverageGaps.length})`);
p();
if (coverageGaps.length === 0) {
  p("Sunday–Thursday tile every parasha's Torah text end to end, no verse skipped.");
} else {
  for (const g of coverageGaps) p(`  ${g}`);
}
p();

p(`## Rendering problems (${problems.length})`);
p();
if (problems.length === 0) {
  p('None. Every verse came back with both Hebrew and English, the arrays line up,');
  p('and every Torah day has Onkelos aligned verse-for-verse.');
} else {
  const byKind = new Map();
  for (const pr of problems) {
    if (!byKind.has(pr.kind)) byKind.set(pr.kind, []);
    byKind.get(pr.kind).push(pr);
  }
  for (const [kind, list] of [...byKind].sort((a, b) => b[1].length - a[1].length)) {
    p(`### ${kind} — ${list.length}`);
    for (const pr of list.slice(0, 40)) {
      p(`  ${pr.parasha} ${pr.day}${pr.rite ? ` (${pr.rite})` : ''} [${pr.ref}] — ${pr.detail}`);
    }
    if (list.length > 40) p(`  … and ${list.length - 40} more`);
    p();
  }
}
p();

p(`## Glossary`);
p();
p(`Entries          : ${glossaryKeys.length}`);
p(`Entries that hit : ${wordHits.size}`);
p(`Never appear     : ${unused.length}`);
p(`Distinct words in the year's English: ${wordSeen.size}`);
p();

if (undefinedValues.length || danglingForms.length) {
  p(`### BROKEN — entries with no definition (${undefinedValues.length + danglingForms.length})`);
  for (const k of undefinedValues) p(`  ${k}`);
  for (const k of danglingForms) p(`  ${k} (lemma not in DEFINITIONS — form dropped)`);
  p();
}

p(`### Possible unlisted offshoots (${missingOffshoots.length})`);
p(`Words in the text that look like inflections of a glossary concept but do not highlight.`);
p();
for (const m of missingOffshoots.sort((a, b) => b.count - a.count)) {
  p(`  ${m.word.padEnd(20)} x${String(m.count).padEnd(4)} ~ ${m.lemmas.join(', ').padEnd(24)} ${[...m.where].slice(0, 3).join('; ')}`);
}
p();

p(`### Related forms with differing definitions (${inconsistent.length})`);
for (const [a, b] of inconsistent) p(`  ${a} / ${b}`);
p();

p(`### Glossary entries that never occur (${unused.length})`);
p(`  ${unused.join(', ')}`);
p();

const report = out.join('\n');
writeFileSync(`${CACHE_DIR}/../audit-report.txt`, report);
console.log(report);
