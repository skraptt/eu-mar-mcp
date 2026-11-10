// Turns PDF text lines (scripts/pdf_lines.py output) into sections.
//
// ESMA documents are Word exports without bookmarks, so structure is recovered from
// typography: headings are bold lines larger than the body text, or bold body-size lines
// that start with a section number ("2.1.3. Who has to report?"). Running headers and
// footers (lines repeated on many pages) are dropped; footnotes are moved out of the
// running text into `notes`.

const norm = (t) => t.replace(/\d+/g, '#').replace(/\s+/g, ' ').trim().toLowerCase();
const NUMBERED = /^(\d{1,2}(?:\.\d{1,3}){0,4})(?:\.\s*|\s+)(?!(?:January|February|March|April|May|June|July|August|September|October|November|December)\b)(?=[A-Z(‘“\[])/;
const TOC_LEADER = /\.{5,}\s*\d*\s*$|\s\d{1,3}\s*$/;

function mode(values) {
  const c = new Map();
  for (const v of values) c.set(v, (c.get(v) || 0) + 1);
  return [...c].sort((a, b) => b[1] - a[1])[0]?.[0];
}

// Options for the reporting manuals (MoP, TRUM), off by default so the other documents
// parse exactly as before:
//   annexes         "ANNEX VII …" starts an annex; numbered headings inside it are numbered
//                   within the annex ("Annex VII", "Annex III.I", "Annex I, 2") and
//                   unnumbered headings stay in the text
//   numberedPlain   numbered headings set in regular body text ("3.1.2 Transportation
//                   contracts") also start sections (at least two levels, short, no full stop)
//   fieldHeadings   "Data Field (1) …" / "Data Field No (4/b) …" starts a sub-section per
//                   field, numbered "<section>, field (1)"
// Table rows from pdf_lines.py --tables ("tb") are never headings and are kept one per line.
const ANNEX = /^ANNEX\s+([IVXL]+)(?:\b|(?=[A-Z][a-z]))[\s:.\-–]*(.*)$/; // "ANNEX VIIData fields" (no space in the PDF)
const ANNEX_SUB = /^([IVXL]+\.[IVXL]+)\.?\s+(\S.*)$/;
const PLAIN_NUMBERED = /^(\d{1,2}(?:\.\d{1,3}){1,4})\.?\s+([A-Z][^.]{2,110})$/;
// ESMA Q&A questions: "Q5.1", "Question 5.1", "Question 5.1 [Last update: …]".
const QUESTION = /^Q(?:uestion)?\s*(\d{1,2}\.\d{1,3})\b\s*[:.\-–]?\s*(.*)$/i;
// Answers start "Answer 5.1:", "Answer:" or, in the current ESMA Q&A, "A5.1" (sometimes
// with no space before the answer: "A7.10No.").
const ANSWER_AT = /(?:^|\n|\s)(?:Answer\s*(?:\d{1,2}\.\d{1,3})?\s*:|A\d{1,2}\.\d{1,3}(?![\d.]))/i;
const ANSWER = /^(?:Answer\s*(?:\d{1,2}\.\d{1,3})?\s*:?|A\d{1,2}\.\d{1,3}(?![\d.]))\s*/i;
// The ESMA Q&A heads each question with a topic and its update date ("Blanket
// cancellation of orders policy" / "Updated: 30 May 2017"), sometimes with a note that
// the Commission provided the answer. They come before the "Q" line and so end up as the
// last paragraph of the previous section.
const TOPIC_TAIL = /(?:^|\n)([^\n]{3,600}?)\s*Updated:\s*(\d{1,2}\s+\w+\s+\d{4})\s*$/;
const FIELD = /^Data\s+Field\s+(?:No\.?\s*)?\((\d{1,3}[a-z]?(?:\/[a-z])?)\)\s*(.*)$/i;

//   qa              each "Q5.1" / "Question 5.1" line starts a section numbered "5.1"; its
//                   title is the question, its text the answer (ESMA Q&As)
//   numberedParas   paragraphs are numbered "12." rather than "(12)" (ESMA guidelines)
export function parsePdfLines(lines, { doc, skipPages = 0, annexes = false, numberedPlain = false, fieldHeadings = false, qa = false, numberedParas = false } = {}) {
  const pages = new Set(lines.map((l) => l.p)).size;
  // Running headers/footers: same normalised text on many pages.
  const repeat = new Map();
  for (const l of lines) repeat.set(norm(l.t), (repeat.get(norm(l.t)) || 0) + 1);
  const isChrome = (l) => (repeat.get(norm(l.t)) || 0) >= Math.max(3, pages * 0.3) || /^page\s+\d+\s+of\s+\d+$/i.test(l.t.trim());

  const body = mode(lines.filter((l) => !l.b && !isChrome(l)).map((l) => l.s));
  const headingSizes = [...new Set(lines.filter((l) => l.b && l.s > body + 0.5 && l.s < 30).map((l) => l.s))].sort((a, b) => b - a);

  // Footnotes: from the first small line starting with a number in the lower part of a
  // page, every smaller-than-body line on that page.
  const pageBottom = new Map();
  for (const l of lines) pageBottom.set(l.p, Math.max(pageBottom.get(l.p) || 0, l.y));
  const footStart = new Map();
  for (const l of lines) {
    if (l.s < body - 0.9 && /^\d{1,3}\s+\S/.test(l.t) && l.y > (pageBottom.get(l.p) || 800) * 0.45 && !footStart.has(l.p)) footStart.set(l.p, l.y);
  }

  const sections = [];
  let cur = null;
  const counters = [];
  // Table-of-contents pages: many lines ending in dot leaders and a page number.
  const tocPage = new Set();
  const leaders = new Map();
  const perPage = new Map();
  for (const l of lines) {
    perPage.set(l.p, (perPage.get(l.p) || 0) + 1);
    if (/\.{5,}\s*\d+\s*$/.test(l.t) || /^(table of )?contents$/i.test(l.t.trim())) leaders.set(l.p, (leaders.get(l.p) || 0) + 1);
  }
  for (const [p, n] of leaders) if (n >= 3 && n / perPage.get(p) > 0.2) tocPage.add(p);
  // Front matter ends at the first numbered heading ("1 Introduction", "1. Introduction").
  const firstNumbered = lines.find((l) => l.b && !tocPage.has(l.p) && /^1\.?\s+[A-Z]/.test(l.t.trim()) && l.s >= body - 0.5 && !/\.{5,}/.test(l.t));
  const topSize = firstNumbered?.s ?? headingSizes[0];
  const startAt = firstNumbered ? lines.indexOf(firstNumbered) : 0;
  const bodyHeadingSizes = [...new Set(lines.slice(startAt).filter((l) => l.b && !l.i && l.s > body + 0.5 && l.s < 30 && !tocPage.has(l.p)).map((l) => l.s))].sort((a, b) => b - a);
  const levelOfSize = (s) => Math.max(1, bodyHeadingSizes.indexOf(s) - Math.max(0, bodyHeadingSizes.indexOf(topSize)) + 1);
  const _unused = (s) => Math.max(1, headingSizes.indexOf(s) - Math.max(0, headingSizes.indexOf(topSize)) + 1);

  const startSection = (title, level, number) => {
    if (number) {
      const parts = number.split('.').map(Number);
      counters.length = parts.length;
      parts.forEach((v, i) => (counters[i] = v));
    } else {
      counters.length = level;
      counters[level - 1] = (counters[level - 1] || 0) + 1;
      for (let i = 0; i < level - 1; i++) counters[i] ||= 0;
    }
    cur = { doc, num: number === '0' ? '0' : counters.filter((x) => x != null).join('.'), title, level, page: null, lines: [], notes: [] };
    sections.push(cur);
  };
  // A section with an explicit number (annexes, data fields).
  const startNamed = (num, title, level, page) => {
    cur = { doc, num, title, level, page, lines: [], notes: [] };
    sections.push(cur);
  };
  let annex = null; // current annex ("VII") when `annexes` is on
  const skipLine = new Set(); // continuation lines already joined into a field heading
  const sectionBase = () => (cur?.num || '').replace(/, field \([^)]*\)$/, '');

  let pending = null; // multi-line heading being assembled
  const flush = () => {
    if (!pending) return;
    if (annexes) {
      const a = pending.text.match(ANNEX);
      if (a) {
        annex = a[1];
        startNamed(`Annex ${annex}`, a[2].trim() || `Annex ${annex}`, 1, pending.p);
        pending = null;
        return;
      }
      if (annex) {
        const sub = pending.text.match(ANNEX_SUB);
        const num = pending.text.match(NUMBERED);
        if (sub) startNamed(`Annex ${sub[1]}`, sub[2].trim(), 2, pending.p);
        else if (num) startNamed(`Annex ${annex}, ${num[1]}`, pending.text.slice(num[0].length).trim(), 2, pending.p);
        else cur.lines.push({ p: pending.p, y: pending.y, s: pending.s, t: pending.text });
        pending = null;
        return;
      }
    }
    const m = pending.text.match(NUMBERED);
    const number = m ? m[1] : null;
    const title = (m ? pending.text.slice(m[0].length) : pending.text).trim();
    const level = number ? number.split('.').length : pending.level;
    startSection(title, level, number);
    cur.page = pending.p;
    pending = null;
  };

  for (const [idx, l] of lines.entries()) {
    if (l.p <= skipPages || tocPage.has(l.p) || isChrome(l) || /\.{5,}\s*\d+\s*$/.test(l.t)) continue;
    if (idx < startAt) {
      // Front matter: kept as one section, without heading detection.
      if (!cur) startSection('Front matter', 1, '0'), (cur.page = l.p);
      cur.lines.push({ ...l, t: l.t.trim() });
      continue;
    }
    const t = l.t.trim();
    if (!t) continue;
    if (l.tb) {
      flush();
      if (!cur) startSection('Front matter', 1, null), (cur.page = l.p);
      cur.lines.push({ ...l, t });
      continue;
    }
    // Annex headings and their "III.I"-style sub-headings are bold at body size.
    if (annexes && l.b && !l.i && t.length < 200 && !TOC_LEADER.test(t) && (ANNEX.test(t) || (annex && ANNEX_SUB.test(t)))) {
      flush();
      pending = { text: t, s: l.s, p: l.p, y: l.y, level: 1 };
      flush();
      continue;
    }
    if (qa && !l.i && QUESTION.test(t) && t.length < 400) {
      flush();
      const q = t.match(QUESTION);
      startNamed(q[1], q[2].trim(), 2, l.p);
      cur.qa = true;
      continue;
    }
    // A field heading is followed by the field's definition table; a sentence that merely
    // starts with "Data Field (3) is …" is not.
    // A heading may wrap onto a second bold line before the table.
    if (fieldHeadings && skipLine.has(idx)) continue;
    const following = () => lines.slice(idx + 1, idx + 6).filter((n) => n.t.trim() && !isChrome(n));
    const fieldNext = fieldHeadings && FIELD.test(t) ? following() : [];
    const wraps = !fieldNext[0]?.tb && fieldNext[0]?.b && fieldNext[1]?.tb;
    if (fieldHeadings && cur && !l.i && FIELD.test(t) && t.length < 200 && (fieldNext[0]?.tb || wraps)) {
      flush();
      const f = `${t}${wraps ? ` ${fieldNext[0].t.trim()}` : ''}`.match(FIELD);
      if (wraps) skipLine.add(lines.indexOf(fieldNext[0]));
      const base = sectionBase();
      const parent = sections.findLast((x) => x.num === base);
      startNamed(`${base}, field (${f[1]})`, `Data Field (${f[1]}) ${f[2].trim()}`.trim(), (parent?.level || 1) + 1, l.p);
      continue;
    }
    if (numberedPlain && !l.b && !l.i && Math.abs(l.s - body) <= 0.5 && PLAIN_NUMBERED.test(t) && !TOC_LEADER.test(t) && !(annex && annexes)) {
      flush();
      const m = t.match(PLAIN_NUMBERED);
      startSection(m[2].trim(), m[1].split('.').length, m[1]);
      cur.page = l.p;
      continue;
    }
    if (footStart.has(l.p) && l.y >= footStart.get(l.p) && l.s < body) {
      if (cur) {
        if (/^\d{1,3}\s+\S/.test(t) || !cur.notes.length) cur.notes.push(t);
        else cur.notes[cur.notes.length - 1] += ` ${t}`;
      }
      continue;
    }
    const big = l.b && !l.i && l.s > body + 0.5 && l.s < 30;
    const numberedBold = l.b && !l.i && Math.abs(l.s - body) <= 0.5 && NUMBERED.test(t) && t.length < 220 && !TOC_LEADER.test(t);
    if (big || numberedBold || (pending && l.b && l.s === pending.s && l.p === pending.p && l.y - pending.y < l.s * 2.2)) {
      if (pending && l.s === pending.s && l.p === pending.p && l.y - pending.y < l.s * 2.2 && !NUMBERED.test(t)) {
        pending.text += ` ${t}`;
        pending.y = l.y;
        continue;
      }
      flush();
      const level = big ? levelOfSize(l.s) : 1;
      pending = { text: t, s: l.s, p: l.p, y: l.y, level };
      continue;
    }
    flush();
    if (!cur) startSection('Front matter', 1, null), (cur.page = l.p);
    cur.lines.push({ ...l, t });
  }
  flush();

  // Join lines into paragraphs: a new paragraph starts at "(n)" numbering, list markers,
  // or a vertical gap.
  for (const s of sections) {
    const paras = [];
    let prev = null;
    for (const l of s.lines) {
      const gap = prev && (l.p !== prev.p ? 0 : l.y - prev.y);
      const starts = l.tb || prev?.tb || /^\(\d{1,4}\)\s/.test(l.t) || (numberedParas && /^\d{1,3}\.\s+[A-Z(‘“]/.test(l.t)) || /^[•▪–-]\s/.test(l.t) || /^\(?[a-z]{1,3}\)\s/.test(l.t) || (prev && gap > l.s * 1.9);
      if (!prev || starts) paras.push(l.t);
      else paras[paras.length - 1] += (paras[paras.length - 1].endsWith('-') ? '' : ' ') + l.t;
      prev = l;
    }
    s.text = paras.join('\n').replace(/\s+\n/g, '\n').trim();
    delete s.lines;
    if (s.qa) {
      // The question runs until the answer marker; it becomes the title and the answer
      // the text. The first line of the question is in s.title already.
      const i = s.text.search(ANSWER_AT);
      if (i >= 0) {
        const rest = s.text.slice(0, i).replace(/\s+/g, ' ').trim();
        const head = s.title.replace(/^\[[^\]]*\]\s*/, '');
        const note = s.title.match(/^\[[^\]]*\]/)?.[0];
        // "[Last update: …]" goes after the question: "Can an issuer … ? [Last update: …]".
        s.title = [head, rest, note].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
        s.text = s.text.slice(i).trim().replace(ANSWER, '');
      }
      delete s.qa;
    }
  }
  if (qa) {
    for (let i = 0; i + 1 < sections.length; i++) {
      const next = sections[i + 1];
      const m = /^\d{1,2}\.\d{1,3}$/.test(next.num ?? '') && sections[i].text?.match(TOPIC_TAIL);
      if (!m) continue;
      // The topic line is often joined to the last paragraph of the previous answer
      // ("… of the delay. Disclosure of inside information by …"): the topic is what follows
      // the last full stop, and what precedes it stays with the answer.
      let tail = m[1];
      let keep = sections[i].text.slice(0, m.index);
      const stop = [...tail.matchAll(/[.?!”"]\s+(?=[A-Z‘“(])/g)].pop();
      if (stop) {
        keep += (keep ? '\n' : '') + tail.slice(0, stop.index + 1);
        tail = tail.slice(stop.index + stop[0].length);
      }
      m[1] = tail;
      sections[i].text = keep.trim();
      const by = m[1].match(/^(.*?)\s*\(?Answer provided by (?:the )?European Commission.*$/i);
      const topic = (by ? by[1] : m[1]).trim();
      next.topic = topic;
      next.updated = m[2];
      next.title = `${topic ? `${topic}: ` : ''}${next.title} [Updated: ${m[2]}${by ? '; answer provided by the European Commission' : ''}]`;
    }
  }
  return sections.filter((s) => s.text || s.title);
}
