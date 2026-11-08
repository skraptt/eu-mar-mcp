// Domain lexicon. MAR texts switch between abbreviations and full terms ("STOR" /
// "suspicious transaction and order report"), and practitioners ask in everyday words
// ("can our CFO sell shares" for managers' transactions). Each group lists equivalent
// expressions; when any of them appears in a text (at indexing) or in a query, the terms of
// the others are added. Patterns are matched on lower-cased text.

export const LEXICON = [
  ['stor', 'suspicious transaction and order report', 'suspicious orders and transactions', 'suspicious transaction report', 'str'],
  ['pdmr', 'person discharging managerial responsibilities', 'persons discharging managerial responsibilities', 'board member', 'ceo', 'cfo'],
  ['managers\' transactions', 'managers transactions', 'director dealings', 'directors\' dealings'],
  ['closed period', 'blackout period', 'black-out period', 'trading window'],
  ['amp', 'accepted market practice'],
  ['mtf', 'multilateral trading facility'],
  ['otf', 'organised trading facility'],
  ['ppaet', 'persons professionally arranging or executing transactions', 'person professionally arranging or executing transactions'],
  ['dmp', 'disclosing market participant'],
  ['market sounding', 'wall-crossing', 'wall crossing', 'sounding the market'],
  ['insider list', 'list of insiders', 'insider register'],
  ['inside information', 'price-sensitive information', 'price sensitive information', 'non-public information', 'mnpi'],
  ['insider dealing', 'insider trading'],
  ['market manipulation', 'manipulate the market', 'manipulating the market'],
  ['delay the disclosure', 'delay disclosure', 'delayed disclosure', 'delay of disclosure', 'postpone disclosure', 'defer disclosure'],
  ['emission allowance', 'emission allowances', 'eua', 'eu ets'],
  ['commodity derivative', 'commodity derivatives', 'energy derivatives', 'power futures', 'gas futures'],
  ['spot commodity contract', 'spot market', 'physical contract'],
  ['wash trade', 'wash trading', 'self-trade', 'self-trading', 'trade with ourselves'],
  ['layering', 'spoofing'],
  ['buy-back', 'buyback', 'share repurchase'],
  ['stabilisation', 'stabilization', 'greenshoe'],
  ['investment recommendation', 'research report', 'analyst recommendation'],
  ['nca', 'national competent authority', 'competent authority'],
  ['sme growth market', 'sme gm'],
  ['whistleblowing', 'whistleblower', 'reporting of infringements'],
  ['algorithmic trading', 'algo trading', 'high-frequency trading', 'hft'],
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const GROUPS = LEXICON.map((g) => ({ terms: g, re: new RegExp(`(?:^|[^a-z0-9])(?:${g.map(esc).join('|')})(?:s|es)?(?![a-z0-9])`, 'i') }));

// Returns the extra text to index or search with: all equivalents of the groups present.
export function expansions(text) {
  const t = String(text).toLowerCase();
  const out = [];
  for (const g of GROUPS) if (g.re.test(t)) out.push(...g.terms);
  return out.join(' ');
}
