/**
 * Fetches all verse text for the full schedule and reports words that look like
 * un-transliterated Hebrew proper nouns — i.e., words matching our rules but
 * not yet in the TRANSLITERATIONS map.
 * Run with: node scripts/scan-missing-nouns.mjs
 */

import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const schedule = require('../src/data/schedule.json');

// Parse existing map keys from transliterations.ts
const src = readFileSync(new URL('../src/data/transliterations.ts', import.meta.url), 'utf8');
const knownKeys = new Set();
for (const m of src.matchAll(/^\s+'([^']+)':/gm)) {
  knownKeys.add(m[1]);
  knownKeys.add(m[1].toLowerCase());
}

// Common English words and JPS-specific vocabulary that are NOT Hebrew proper nouns.
const COMMON = new Set([
  'god','lord','the','and','but','for','you','your','they','their','them','he','she','his','her',
  'it','its','we','our','my','me','him','us','who','what','this','that','these','those','there',
  'then','when','if','so','now','as','at','in','on','no','do','be','let','go','all','one',
  'take','come','give','see','speak','have','yet','from','to','with','after','such','why','how',
  'thus','therefore','because','like','before','until','since','any','every','more','said',
  // JPS theological vocabulary
  'eternal','sovereign','tabernacle','tent','ark','meeting','levites','israelites','israelite',
  'israelitish','egyptians','amorites','pact','teaching','priestly','holy','most','great',
  'shall','will','were','been','has','had','was','are','not','also','upon','again','even',
  'came','went','made','gave','said','told','took','put','set','sent','brought','called',
  'heard','saw','found','knew','left','kept','bore','rose','fell','stood','turned','moved',
  'built','made','laid','cast','struck','burned','offered','sacrifice','offerings','offering',
  'blood','fire','water','land','people','children','sons','daughters','house','day','days',
  'year','years','time','hand','hands','head','face','eyes','heart','voice','name','word',
  'words','way','place','side','midst','border','borders','south','north','east','west',
  'here','there','where','now','then','while','only','both','each','very','too','still',
  'own','first','second','third','forth','many','few','much','whole','according','between',
  'among','before','behind','within','without','throughout','together','himself','themselves',
  'half','thousand','hundreds','twenty','thirty','forty','fifty','sixty','seventy','eighty',
  'gate','gates','wall','altar','cloud','glory','spirit','angel','covenant','statute',
  'commandment','ordinance','congregation','assembly','generation','inheritance','possession',
  'portion','tribe','tribes','cities','city','town','towns','valley','mountain','hills','plain',
  'sea','river','brook','wilderness','desert','camp','encamped','territory','boundary',
]);

const BASE = 'https://www.sefaria.org/api';

function flattenText(raw) {
  if (!raw) return [];
  if (typeof raw === 'string') return [raw];
  if (typeof raw[0] === 'string') return raw;
  return raw.flat();
}

function stripHtml(s) {
  return s
    .replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z]+;/g, '')
    .replace(/\s+/g, ' ').trim();
}

async function fetchRef(ref) {
  const parts = ref.split(/;\s*/);
  const verses = [];
  for (const part of parts) {
    try {
      const url = `${BASE}/texts/${encodeURIComponent(part)}?commentary=0&context=0&pad=0&wrapLinks=0&stripItags=1`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      for (const v of flattenText(data.text)) verses.push(stripHtml(v));
    } catch { /* skip */ }
  }
  return verses;
}

// Returns true if a single (non-hyphenated) word-part looks like a Hebrew proper noun.
function looksLikeHebrewNamePart(word) {
  if (word.length < 3) return false;
  if (COMMON.has(word.toLowerCase())) return false;
  if (/^J[aeiouAEIOU]/.test(word)) return true;          // J→Y
  if (/ch/i.test(word)) return true;                      // ch→ḥ or ch→kh
  if (/ph/i.test(word)) return true;                      // ph→f
  if (/th$/i.test(word)) return true;                     // final th→thav
  if (/ites?$/i.test(word)) return true;                  // tribal -ites
  if (/iah$|iyah$/i.test(word)) return true;              // theophoric -iah
  if (/el$/i.test(word)) return true;                     // divine -el
  if (/on$/i.test(word) && word.length > 4) return true;  // place names -on
  if (/ah$/i.test(word) && word.length > 4) return true;  // Hebrew -ah
  if (/im$/i.test(word) && word.length > 4) return true;  // Hebrew plural -im
  if (/[kK](?!e|ing|now|new|ept|ey|in|s\b)/.test(word)) return true;
  if (/[bB](?=[aeiou][a-z])/.test(word)) return true;
  return false;
}

// Returns true if a word looks like a Hebrew proper noun that might need transliteration.
function looksLikeHebrewName(word) {
  // Already in map
  if (knownKeys.has(word) || knownKeys.has(word.toLowerCase())) return false;
  // Too short or common
  if (word.length < 3 || COMMON.has(word.toLowerCase())) return false;
  // Must be capitalized
  if (!/^[A-Z]/.test(word)) return false;

  // For compound hyphenated names, test each part separately.
  // This catches cases like "Havvoth-jair" (jair has J→Y signal) and
  // "Hazar-enan" (H- prefix that likely represents het ח or a compound starting with חֲצַר).
  if (word.includes('-')) {
    const parts = word.split('-');
    // Flag any compound starting with H (likely ח het or חֲצַר) or En (עֵין spring)
    if (/^H[a-z]/i.test(parts[0]) || parts[0] === 'En') return true;
    // Flag if any component matches a Hebrew name signal
    for (const part of parts) {
      if (part.length >= 2 && looksLikeHebrewNamePart(part.charAt(0).toUpperCase() + part.slice(1))) return true;
    }
    return false;
  }

  return looksLikeHebrewNamePart(word);
}

const allRefs = [];
for (const [parasha, entry] of Object.entries(schedule)) {
  for (const day of entry.days) allRefs.push({ parasha, day: day.day, ref: day.ref });
}

console.log(`Scanning ${allRefs.length} day-refs across ${Object.keys(schedule).length} parashiot...\n`);

const missing = new Map(); // word → Set of parasha locations

let done = 0;
for (const { parasha, day, ref } of allRefs) {
  const verses = await fetchRef(ref);
  for (const verse of verses) {
    for (const [, word] of verse.matchAll(/\b([A-Z][a-zA-Z]+(?:-[A-Za-z]+)*)\b/g)) {
      if (looksLikeHebrewName(word)) {
        if (!missing.has(word)) missing.set(word, new Set());
        missing.get(word).add(parasha);
      }
    }
  }
  done++;
  if (done % 30 === 0) process.stderr.write(`  ${done}/${allRefs.length} done...\n`);
  await new Promise(r => setTimeout(r, 120));
}

const sorted = [...missing.entries()].sort((a, b) => b[1].size - a[1].size);

console.log(`\n=== ${sorted.length} candidate missing transliterations ===\n`);
for (const [word, locs] of sorted) {
  const locStr = [...locs].slice(0, 4).join(', ');
  const more = locs.size > 4 ? ` +${locs.size - 4}` : '';
  console.log(`  ${word.padEnd(32)} ${locStr}${more}`);
}
