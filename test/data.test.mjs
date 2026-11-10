// Checks on the real data (data/mar.json, built from the fetched sources by `npm test`'s
// pretest step). Skipped when the data has not been built.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createEngine } from '../src/engine.mjs';
import { CROSSWALK } from '../src/crosswalk.mjs';

const file = new URL('../data/mar.json', import.meta.url);
const have = existsSync(file);
const data = have ? JSON.parse(readFileSync(file, 'utf8')) : null;
const e = have ? createEngine(data) : null;
const opts = { skip: have ? false : 'data/mar.json not built (no fetched sources)' };

test('MAR is present with all its articles', opts, () => {
  const mar = data.units.filter((u) => u.d === 'MAR' && u.k === 'article');
  assert.ok(mar.length >= 39, `MAR articles: ${mar.length}`);
  assert.equal(e.getProvision({ provision: 'Article 17 MAR' }).title, 'Public disclosure of inside information');
  assert.equal(e.getProvision({ provision: 'Article 16 MAR' }).title, 'Prevention and detection of market abuse');
});

test('every link points to an existing provision', opts, () => {
  const ids = new Set(data.units.map((u) => `${u.d}/${u.n}`));
  const docs = new Set(data.docs.map((d) => d.id));
  for (const u of data.units) for (const l of u.l || []) if (docs.has(l.split('/')[0])) assert.ok(ids.has(l), `${u.d}/${u.n} → ${l}`);
});

test('crosswalk MAR articles exist', opts, () => {
  for (const r of CROSSWALK) for (const a of r.mar) assert.ok(e.getProvision({ provision: `Article ${a.match(/^\d+[a-z]?/)[0]} MAR`, related: 0 }).id, `${r.topic}: ${a}`);
});

test('the STOR regulation is linked to Article 16 MAR', opts, () => {
  if (!data.docs.some((d) => d.id === 'DR-2016-957')) return;
  const p = e.getProvision({ provision: 'Article 16 MAR' });
  assert.ok(p.implementing.some((x) => x.id.startsWith('DR-2016-957/')));
});

test('MAR recitals come from the 2014 text', opts, () => {
  if (!data.docs.some((d) => d.id === 'MAR-2014')) return;
  const r = e.getProvision({ provision: 'Recital 23 MAR', related: 0 });
  assert.equal(r.id, 'MAR-2014/Recital 23');
  assert.match(r.url, /CELEX:32014R0596#rct_23$/);
  assert.ok(!data.units.some((u) => u.d === 'MAR-2014' && u.k !== 'recital'), 'only recitals are kept');
});

test('delay guidelines hold only the guidelines annex', opts, () => {
  const t = data.units.filter((u) => u.d === 'ESMA-GL-DELAY');
  assert.ok(t.length > 0 && t.length < 20, `units: ${t.length}`);
  assert.ok(!t.some((u) => /Cost-benefit|Summary of questions|Feedback/i.test(u.b || '')));
});

test('consolidated texts carry no amendment markers', opts, () => {
  assert.ok(!data.units.some((u) => /[▼►◄]|[—–-]{4,}/.test(u.t)), 'markers or dash runs left');
});

test('Level 2 acts and their annexes are linked to the MAR article they supplement', opts, () => {
  const p = e.getProvision({ provision: 'Article 16 MAR' });
  assert.ok(p.implementing.some((x) => x.id === 'DR-2016-957/ANNEX'), 'STOR template');
  assert.equal(data.units.find((u) => u.d === 'DR-2016-957' && u.k === 'annex').b, 'STOR template');
  assert.ok(e.getProvision({ provision: 'Article 12 MAR' }).implementing.some((x) => x.id === 'DR-2016-522/ANNEX II'));
});

test('a deleted article says so', opts, () => {
  const r = e.getProvision({ provision: 'Article 28 MAR' });
  assert.match(r.error, /^Article 28 MAR has been deleted/);
});

test('paragraph citations return the paragraph; Level 2 lists respect `related`', opts, () => {
  const p = e.getProvision({ provision: 'Article 17(4a) MAR', related: 3 });
  assert.ok(p.paragraphOnly && p.text.startsWith('4a. ') && p.text.length < 2000);
  assert.ok(p.implementing.length <= 3 && !p.implementing.some((x) => /Entry into force|Repeal/i.test(x.title || '')));
  const s = e.getProvision({ provision: 'Article 16 MAR', related: 2 });
  assert.equal(s.implementing[0].id, 'DR-2016-957/ANNEX', 'templates first');
});
