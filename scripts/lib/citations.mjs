// Finds references to MAR, its delegated and implementing acts and CS MAD in free text
// ("Article 17(4) of MAR", "Articles 8 and 14 of MAR", "Article 2 of Commission Delegated
// Regulation (EU) 2016/957", "MAR Article 16") and returns the unit ids they point to
// ("MAR/17", "DR-2016-957/2").

const NUM = String.raw`\d{1,2}[a-z]?(?:\(\s*\d{1,2}[a-z]?\s*\))?(?:\s*\(\s*[a-z]{1,4}\s*\))*(?:\s*,?\s*(?:first|second|third|fourth|fifth|last)\s+subparagraph)?`;
const LIST = String.raw`${NUM}(?:\s*(?:,|and|or|to|–|-)\s*(?:Article\s+)?(?:${NUM}|\(\s*\d{1,2}[a-z]?\s*\)))*`;

// Acts by number ("2016/957", "No 596/2014"). Every Level 1 and Level 2 act in
// scripts/sources.mjs that other texts cite by number.
const BY_NUMBER = {
  '596/2014': 'MAR',
  '2014/57': 'CSMAD',
  '2024/2809': 'LISTING-ACT',
  '2016/522': 'DR-2016-522',
  '2016/908': 'DR-2016-908',
  '2016/909': 'DR-2016-909',
  '2016/957': 'DR-2016-957',
  '2016/958': 'DR-2016-958',
  '2016/960': 'DR-2016-960',
  '2016/1052': 'DR-2016-1052',
  '2016/959': 'ITS-2016-959',
  '2016/1055': 'ITS-2016-1055',
  '2016/523': 'ITS-2016-523',
  '2022/1210': 'ITS-2022-1210',
  '2016/378': 'ITS-2016-378',
  '2015/2392': 'DIR-2015-2392',
};
// Group 1: "Regulation (EU) No 596/2014", "Delegated Regulation (EU) 2016/957";
// group 2: "Directive 2014/57/EU".
const ACT = String.raw`(?:(?:Commission\s+)?(?:Delegated\s+|Implementing\s+)?(?:Regulation|Directive)\s*\((?:EU|EC)\)\s*(?:No\.?\s*)?(\d{4}\/\d{1,4}|\d{1,4}\/\d{4})|Directive\s+(\d{4}\/\d{1,4})\/EU)`;
const NAMED = String.raw`(MAR|CS\s*-?\s*MAD|Market\s+Abuse\s+Regulation|Market\s+Abuse\s+Directive)`;
const TARGET = String.raw`(?:of|in|under)\s+(?:the\s+)?(?:${ACT}|${NAMED}(?![\w-]))`;

const AFTER = new RegExp(String.raw`\bArticles?\s+(${LIST})\s*,?\s+${TARGET}`, 'gi');
// "MAR Article 17(4)", "MAR Articles 8 and 14"
const BEFORE = new RegExp(String.raw`\b(MAR)\s+Articles?\s+(${LIST})`, 'g');
// "Article 17 MAR" (no "of")
const BARE = new RegExp(String.raw`\bArticles?\s+(${LIST})\s+(MAR)\b`, 'g');

function docOfNumber(num) {
  // "No 596/2014" and "2016/957" both appear; normalise to the registry form.
  return BY_NUMBER[num] ?? null;
}

function docOfName(name) {
  const n = name.toLowerCase().replace(/\s+/g, ' ');
  if (/cs ?-?mad|directive/.test(n)) return 'CSMAD';
  return 'MAR';
}

function articleNumbers(list) {
  const nums = [];
  let prevEnd = 0;
  // Paragraph-only items ("and (4)") refer to the same article; drop them.
  const l = list.replace(/(^|[\s,])\(\s*\d{1,2}[a-z]?\s*\)/g, '$1');
  for (const a of l.matchAll(/(\d{1,2}[a-z]?)(?:\s*\([^)]*\))*/gi)) {
    const between = l.slice(prevEnd, a.index);
    const last = nums[nums.length - 1];
    // "Articles 13 to 15": expand plain numeric ranges.
    if (last && /\bto\b|[–-]/.test(between) && /^\d+$/.test(last) && /^\d+$/.test(a[1]) && +a[1] - +last < 30) {
      for (let k = +last + 1; k < +a[1]; k++) nums.push(String(k));
    }
    nums.push(a[1]);
    prevEnd = a.index + a[0].length;
  }
  return nums;
}

// Returns [{ id: 'MAR/17', ref: 'Article 17(4) of MAR' }, …], deduplicated by id.
// References to acts this server does not hold (e.g. MiFID II) are ignored.
export function findCitations(text) {
  const out = new Map();
  const add = (doc, list, ref) => {
    if (!doc) return;
    for (const n of articleNumbers(list)) {
      const id = `${doc}/${n}`;
      if (!out.has(id)) out.set(id, ref.replace(/\s+/g, ' '));
    }
  };
  for (const m of text.matchAll(AFTER)) add(m[2] || m[3] ? docOfNumber(m[2] || m[3]) : docOfName(m[4]), m[1], m[0]);
  for (const m of text.matchAll(BEFORE)) add('MAR', m[2], m[0]);
  for (const m of text.matchAll(BARE)) add('MAR', m[1], m[0]);
  return [...out].map(([id, ref]) => ({ id, ref }));
}
