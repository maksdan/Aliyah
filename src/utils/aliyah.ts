export const ALIYAH_NAMES_EN = [
  'Rishon',
  'Sheni',
  'Shelishi',
  "Revi'i",
  'Ḥamishi',
  'Shishi',
  "Shevi'i",
];

export const DAY_NAMES_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Shabbat',
];

// Format a schedule day's aliyot list (1-based numbers, or 'Haftarah') into a
// reader-facing label, e.g. "Aliyah 4 (Revi'i)" or "Aliyot 2 & 3 (Sheni & Shelishi)".
// Two aliyot read as a pair ("Aliyot 2 & 3"); three or more as a range
// ("Aliyot 1-5"). Named sections — 'Haftarah', 'Haftarah I' — follow after a
// comma: "Aliyot 3-5, Haftarah".
export function formatAliyotLabel(aliyot: (number | string)[]): string {
  const nums = aliyot.filter((a): a is number => typeof a === 'number');
  const named = aliyot.filter((a): a is string => typeof a === 'string');

  const parts: string[] = [];
  if (nums.length === 1) {
    parts.push(`Aliyah ${nums[0]}`);
  } else if (nums.length > 1) {
    // Contiguous runs collapse; the planner slices runs, so gaps are rare.
    const runs: string[] = [];
    let start = nums[0];
    let end = nums[0];
    for (const n of nums.slice(1)) {
      if (n === end + 1) {
        end = n;
        continue;
      }
      runs.push(formatRun(start, end));
      start = end = n;
    }
    runs.push(formatRun(start, end));
    parts.push(`Aliyot ${runs.join(', ')}`);
  }
  parts.push(...named);
  return parts.length > 0 ? parts.join(', ') : 'Haftarah';
}

function formatRun(a: number, b: number): string {
  if (a === b) return `${a}`;
  if (b === a + 1) return `${a} & ${b}`;
  return `${a}-${b}`;
}
