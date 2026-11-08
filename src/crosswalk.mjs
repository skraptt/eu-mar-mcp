// MAR ↔ REMIT crosswalk. Energy firms trade both wholesale energy products under REMIT
// (Regulation (EU) No 1227/2011) and commodity derivatives that are financial instruments
// under MAR; the same conduct can fall under both. Each row pairs the provisions that
// address the same subject and says where they differ.
//
// Hand-written. The REMIT side was checked against the consolidated REMIT text of
// 5 February 2025 (CELEX 02011R1227-20250205) on 8 November 2026. Notes summarise; they
// are not a substitute for the texts. REMIT texts are served by REMIT MCP
// (https://github.com/skraptt/remit-mcp).

export const REMIT_URL = 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02011R1227-20250205';

// mar / remit: article references ("17(4)" → MAR/17). An empty list means the other regime
// has no counterpart.
export const CROSSWALK = [
  {
    topic: 'Scope and relationship between the regimes',
    mar: ['2'],
    remit: ['1(2)', '1(3)'],
    note: 'REMIT applies to trading in wholesale energy products without prejudice to MAR for activities involving financial instruments; a product can be both, and both regimes then apply. Article 1(3) REMIT requires ACER, NRAs, ESMA and financial authorities to cooperate where conduct involves both. ACER explains the overlap in its Guidance on REMIT (6.1st ed.), section 2.5.',
  },
  { topic: 'Definitions', mar: ['3'], remit: ['2'], note: 'Separate definitions; MAR also defines terms by reference to MiFID II (financial instrument, trading venue, commodity derivative).' },
  {
    topic: 'Inside information',
    mar: ['7'],
    remit: ['2(1)'],
    note: 'MAR Article 7(1)(b) has a specific definition for commodity derivatives, interpreted in ESMA\'s guidelines on information relating to commodity derivatives markets. REMIT\'s definition in Article 2(1) covers information on wholesale energy products, including information on the capacity and use of facilities.',
  },
  { topic: 'Insider dealing / insider trading', mar: ['8', '14'], remit: ['3(1)', '3(2)', '3(5)'], note: 'Both cover using inside information, recommending or inducing others, and cancelling or amending orders placed before the information was held.' },
  {
    topic: 'Legitimate behaviour and exemptions from the insider prohibition',
    mar: ['9'],
    remit: ['3(3)', '3(4)'],
    note: 'REMIT has energy-specific exemptions: TSO purchases for system security, and transactions covering the immediate physical loss from unplanned outages (to be reported to ACER and the NRA).',
  },
  { topic: 'Unlawful disclosure of inside information', mar: ['10', '14'], remit: ['3(1)', '4(3)'], note: 'REMIT Article 4(3) requires simultaneous public disclosure where inside information is disclosed in the normal exercise of employment, unless the recipient owes a duty of confidentiality.' },
  { topic: 'Dissemination for journalism', mar: ['21'], remit: ['3(6)'], note: 'Comparable rules for freedom of the press and of expression.' },
  {
    topic: 'Definition of market manipulation',
    mar: ['12'],
    remit: ['2(2)', '2(3)'],
    note: 'MAR lists non-exhaustive indicators in its Annex I, specified further in Delegated Regulation (EU) 2016/522 (Annex II). REMIT has no binding list of indicators; ACER sets out its view in its Guidance and guidance notes (wash trades, layering and spoofing, capacity hoarding).',
  },
  { topic: 'Prohibition of market manipulation', mar: ['15'], remit: ['5'], note: 'Both prohibit engaging in and attempting market manipulation.' },
  {
    topic: 'Accepted market practices',
    mar: ['13'],
    remit: ['2(2)'],
    note: 'MAR Article 13 has a procedure for competent authorities to establish accepted market practices (Delegated Regulation (EU) 2016/908). REMIT only refers to accepted market practices in its definition of market manipulation.',
  },
  {
    topic: 'Detecting and reporting suspicious orders and transactions (STORs)',
    mar: ['16'],
    remit: ['15'],
    note: 'MAR: market operators and persons professionally arranging or executing transactions report to the competent authority without delay (Delegated Regulation (EU) 2016/957). REMIT: persons professionally arranging transactions, and MAR PPAETs that also execute wholesale energy products that are not financial instruments, notify ACER and the NRA without further delay and in any event within four weeks; both require effective arrangements, systems and procedures.',
  },
  {
    topic: 'Public disclosure of inside information',
    mar: ['17'],
    remit: ['4(1)'],
    note: 'MAR obliges issuers (and emission allowance market participants) to disclose; REMIT obliges market participants to disclose inside information on facilities they own or control, through inside information platforms (IIPs).',
  },
  {
    topic: 'Delay of disclosure',
    mar: ['17(4)'],
    remit: ['4(2)'],
    note: 'MAR: delay under conditions, with notification to the competent authority immediately after disclosure (Implementing Regulation (EU) 2016/1055; ESMA guidelines on delay). REMIT: delay exceptionally and under own responsibility; the information and the justification go to ACER and the NRA without delay.',
  },
  { topic: 'Market soundings', mar: ['11'], remit: [], note: 'No REMIT counterpart.' },
  { topic: 'Insider lists', mar: ['18'], remit: [], note: 'No REMIT counterpart.' },
  { topic: 'Managers\' transactions', mar: ['19'], remit: [], note: 'No REMIT counterpart.' },
  { topic: 'Investment recommendations', mar: ['20'], remit: [], note: 'No REMIT counterpart.' },
  { topic: 'Emission allowances', mar: ['7', '17'], remit: [], note: 'MAR covers emission allowances and their auctioned products (including disclosure by emission allowance market participants); REMIT does not.' },
  { topic: 'Algorithmic trading', mar: [], remit: ['5a'], note: 'REMIT Article 5a (added by REMIT II) sets systems, controls and notification duties for algorithmic trading. For financial instruments the equivalent rules are in MiFID II (Article 17 of Directive 2014/65/EU), not in MAR.' },
  { topic: 'Competent authorities, powers and cooperation', mar: ['22', '23', '24', '25'], remit: ['1(3)', '13', '16'], note: 'MAR: national competent authorities and ESMA. REMIT: national regulatory authorities and ACER.' },
  { topic: 'Administrative sanctions and penalties', mar: ['30', '31'], remit: ['18'], note: 'MAR sets minimum maximum fines; criminal sanctions follow Directive 2014/57/EU (CS MAD). REMIT leaves penalties to the Member States within the framework of Article 18.' },
  { topic: 'Reporting of infringements (whistleblowing)', mar: ['32'], remit: [], note: 'MAR Article 32 with Implementing Directive (EU) 2015/2392. No REMIT-specific provision was found.' },
];

const art = (ref) => ref.match(/^\d{1,2}[a-z]?/)[0];
const fold = (s) => String(s).toLowerCase();

// Looks up rows by "Article 17 MAR", "Article 4 REMIT", "17", or topic words.
export function crosswalk(engine, { provision, topic } = {}) {
  let rows = CROSSWALK;
  let regime = null;
  if (provision) {
    const p = String(provision);
    regime = /\bremit\b|1227\/2011/i.test(p) ? 'remit' : 'mar';
    const n = p.match(/\b(\d{1,2}[a-z]?)\b/)?.[1];
    if (!n) return { error: 'provision must name an article, e.g. "Article 17 MAR" or "Article 4 REMIT".' };
    rows = rows.filter((r) => r[regime].some((x) => art(x) === n.toLowerCase()));
    if (!rows.length) return { error: `No crosswalk entry for Article ${n} ${regime.toUpperCase()}. Call remit_crosswalk without arguments for the full table.` };
  }
  if (topic) {
    const words = fold(topic).split(/[^a-z0-9]+/).filter((w) => w.length > 2);
    const hits = rows.filter((r) => words.some((w) => fold(`${r.topic} ${r.note}`).includes(w)));
    if (hits.length) rows = hits;
  }
  const marRef = (ref) => {
    const id = `MAR/${art(ref)}`;
    const u = engine.units.find((x) => `${x.d}/${x.n}` === id);
    return { citation: `Article ${ref} MAR`, id, title: u?.b ?? null, available: !!u };
  };
  const remitRef = (ref) => ({ citation: `Article ${ref} REMIT`, url: `${REMIT_URL}#art_${art(ref)}` });
  return {
    query: { provision: provision ?? null, topic: topic ?? null },
    rows: rows.map((r) => ({ topic: r.topic, mar: r.mar.map(marRef), remit: r.remit.map(remitRef), note: r.note })),
    remitSource: REMIT_URL,
  };
}
