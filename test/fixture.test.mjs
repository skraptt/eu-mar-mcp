// End-to-end tests on a small fixture corpus (test/fixtures/sources): a stand-in MAR, one
// delegated regulation and the line files of two ESMA PDFs. The fixture texts are short
// stand-ins, not the legal texts. Runs without network access or the fetched sources.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createEngine } from '../src/engine.mjs';
import { handleRequest } from '../src/server.mjs';
import { findCitations } from '../scripts/lib/citations.mjs';
import { CROSSWALK } from '../src/crosswalk.mjs';

const out = join(mkdtempSync(join(tmpdir(), 'mar-')), 'mar.json');
execFileSync('node', [new URL('../scripts/build-data.mjs', import.meta.url).pathname, '--src', new URL('./fixtures/sources', import.meta.url).pathname, '--out', out]);
const data = JSON.parse(readFileSync(out, 'utf8'));
const e = createEngine(data);
const ids = new Set(data.units.map((u) => `${u.d}/${u.n}`));

const rpc = (body, ctx) =>
  handleRequest(e, new Request('https://example.dev/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), ctx).then((r) => r.json());
const call = (name, args) => rpc({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }).then((r) => r.result);

test('build: articles, Q&As and guidelines', () => {
  const a = data.units.find((u) => u.d === 'MAR' && u.n === '17');
  assert.equal(a.b, 'Public disclosure of inside information');
  const q = data.units.find((u) => u.d === 'ESMA-QA' && u.n === '5.1');
  assert.match(q.b, /^Can an issuer delay the disclosure .* \[Last update: 20 December 2017\]$/);
  assert.match(q.t, /^Fixture answer: yes/);
  assert.ok(!data.units.some((u) => u.d === 'ESMA-QA' && u.n === '5.2'), 'deleted Q&As are dropped');
  const g = data.units.find((u) => u.d === 'ESMA-GL-DELAY' && u.n === '5.1');
  assert.equal(g.pr, 'paras. (7)–(8)');
});

test('build: links between layers', () => {
  for (const u of data.units) for (const l of u.l || []) if (l.startsWith('MAR/') || l.startsWith('DR-')) assert.ok(ids.has(l) || !data.units.some((x) => x.d === l.split('/')[0]), `${u.d}/${u.n} → ${l}`);
  assert.deepEqual(data.units.find((u) => u.d === 'ESMA-QA' && u.n === '5.3').l, ['MAR/16', 'DR-2016-957/2']);
  assert.deepEqual(data.units.find((u) => u.d === 'DR-2016-957' && u.n === '2').l, ['MAR/16']);
});

test('citation finder', () => {
  const f = (t) => findCitations(t).map((x) => x.id);
  assert.deepEqual(f('Article 17(4) of MAR'), ['MAR/17']);
  assert.deepEqual(f('Articles 8 and 14 of MAR'), ['MAR/8', 'MAR/14']);
  assert.deepEqual(f('MAR Article 16(2)'), ['MAR/16']);
  assert.deepEqual(f('Article 7(1)(b) of Regulation (EU) No 596/2014'), ['MAR/7']);
  assert.deepEqual(f('Article 2 of Commission Delegated Regulation (EU) 2016/957'), ['DR-2016-957/2']);
  assert.deepEqual(f('Articles 3 to 5 of Directive 2014/57/EU'), ['CSMAD/3', 'CSMAD/4', 'CSMAD/5']);
  assert.deepEqual(f('Article 11 of the Market Abuse Regulation'), ['MAR/11']);
  assert.deepEqual(f('Article 17 of Directive 2014/65/EU'), [], 'MiFID II is not in the corpus');
});

test('provision references resolve', () => {
  const r = (s) => e.getProvision({ provision: s });
  assert.equal(r('Article 17 MAR').id, 'MAR/17');
  assert.equal(r('Article 17(4) MAR').paragraphRequested, '4');
  assert.equal(r('Art. 7 of the Market Abuse Regulation').id, 'MAR/7');
  assert.equal(r('Article 16').id, 'MAR/16');
  assert.equal(r('Article 2 2016/957').id, 'DR-2016-957/2');
  assert.equal(r('Recital 1 MAR').id, 'MAR/Recital 1');
  assert.equal(r('ESMA Q&A 5.1').id, 'ESMA-QA/5.1');
  assert.equal(r('delay guidelines 5.1').id, 'ESMA-GL-DELAY/5.1');
  assert.equal(r('MAR/18').id, 'MAR/18');
  assert.ok(r('Article 99 MAR').error);
  assert.ok(r('nonsense').error);
});

test('an article comes with its Level 2 provisions and ESMA material', () => {
  const p = e.getProvision({ provision: 'Article 16 MAR' });
  assert.deepEqual(p.implementing.map((x) => x.id), ['DR-2016-957/2', 'DR-2016-957/5']);
  assert.deepEqual(p.qas.map((x) => x.id), ['ESMA-QA/5.3']);
  const d = e.getProvision({ provision: 'Article 17 MAR' });
  assert.ok(d.guidance.some((g) => g.id === 'ESMA-GL-DELAY/5.1'));
  assert.ok(d.qas.some((g) => g.citation === 'ESMA Q&A, Q 5.1'));
  assert.ok(d.guidance.every((g) => g.layer === 'ESMA guidance (Level 3)'));
  const q = e.getProvision({ provision: 'ESMA Q&A 5.3' });
  assert.deepEqual(q.citesProvisions.map((c) => c.id), ['MAR/16', 'DR-2016-957/2']);
});

test('search', () => {
  const top = (q, o = {}) => e.search({ query: q, limit: 3, ...o }).results.map((r) => r.id);
  assert.equal(top('Article 17 MAR')[0], 'MAR/17');
  assert.ok(top('can we postpone disclosure of inside information').some((id) => id === 'MAR/17' || id.startsWith('ESMA')));
  assert.ok(top('STOR').some((id) => id.startsWith('DR-2016-957/') || id === 'MAR/16'), 'abbreviation expands');
  assert.ok(top('insider list').includes('MAR/18'));
  assert.ok(top('inside information', { layer: 'guidance' }).every((id) => id.startsWith('ESMA')));
  assert.ok(top('disclosure', { document: 'Q&A' }).every((id) => id.startsWith('ESMA-QA/')));
  assert.ok(!top('questions and answers on public disclosure').includes('ESMA-QA/5'), 'Q&A chapter introductions are not ranked');
});

test('crosswalk: rows are well formed and point to MAR articles', () => {
  const marArticles = new Set([...Array(39).keys()].map((i) => String(i + 1)));
  for (const r of CROSSWALK) {
    assert.ok(r.mar.length + r.remit.length > 0, r.topic);
    for (const a of r.mar) assert.ok(marArticles.has(a.match(/^\d+/)[0]), `${r.topic}: MAR ${a}`);
    for (const a of r.remit) assert.match(a, /^\d{1,2}[a-z]?(\(\d+\))?$/, `${r.topic}: REMIT ${a}`);
  }
});

test('MCP: tools/list, crosswalk and errors', async () => {
  const init = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } });
  assert.equal(init.result.serverInfo.name, 'eu-mar');
  const list = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  assert.deepEqual(list.result.tools.map((t) => t.name), ['search_mar', 'get_provision', 'remit_crosswalk', 'list_documents']);
  for (const t of list.result.tools) assert.equal(t.annotations.readOnlyHint, true);

  const cw = await call('remit_crosswalk', { provision: 'Article 4 REMIT' });
  const topics = cw.structuredContent.rows.map((r) => r.topic);
  assert.ok(topics.includes('Public disclosure of inside information') && topics.includes('Delay of disclosure'));
  const m16 = await call('remit_crosswalk', { provision: 'Article 16 MAR' });
  assert.match(m16.content[0].text, /REMIT: Article 15 REMIT/);
  assert.equal(m16.structuredContent.rows[0].mar[0].available, true);
  const none = await call('remit_crosswalk', { provision: 'Article 18 MAR' });
  assert.match(none.content[0].text, /no counterpart/);
  const algo = await call('remit_crosswalk', { topic: 'algorithmic' });
  assert.deepEqual(algo.structuredContent.rows.map((r) => r.topic), ['Algorithmic trading']);
  assert.equal((await call('remit_crosswalk', {})).structuredContent.rows.length, CROSSWALK.length);
  assert.equal((await call('remit_crosswalk', { provision: 'Article 77 REMIT' })).isError, true);

  const p = await call('get_provision', { provision: 'Article 16 MAR' });
  assert.match(p.content[0].text, /<source_text>/);
  assert.match(p.content[0].text, /Delegated and implementing provisions referring to this article/);
  const s = await call('search_mar', { query: 'insider list', limit: 2 });
  assert.equal(s.structuredContent.results.length, 2);
  assert.equal((await call('get_provision', { provision: 'nonsense' })).isError, true);
});

test('semantic results are fused; client-supplied ones are ignored', async () => {
  const seen = [];
  const r = await rpc(
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'search_mar', arguments: { query: 'can our CFO sell shares before results', limit: 5, semantic: ['MAR/7'] } } },
    { semantic: async (q, d) => (seen.push([q, d]), { ids: ['MAR/18', 'MAR/17'] }) },
  );
  const got = r.result.structuredContent.results.map((x) => x.id);
  assert.ok(got.includes('MAR/18') && got.includes('MAR/17'));
  assert.deepEqual(seen, [['can our CFO sell shares before results', null]]);
});

test('HTTP basics', async () => {
  assert.equal((await handleRequest(e, new Request('https://example.dev/mcp'))).status, 405);
  const info = await handleRequest(e, new Request('https://example.dev/')).then((r) => r.json());
  assert.equal(info.name, 'EU MAR MCP');
  assert.equal(info.documents, 4);
});
