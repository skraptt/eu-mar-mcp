// Everything the search engine needs to know about this corpus: document ids, how people
// refer to them, and how citations are labelled. The engine (src/engine.mjs) itself is
// corpus-neutral and shared in structure with REMIT MCP.

export const CORPUS = {
  name: 'MAR',
  // Article and recital citations without a document name ("Article 17") refer to MAR.
  defaultArticleDoc: 'MAR',
  // Consolidated MAR has no recitals; "Recital 23 MAR" is read from the 2014 text.
  defaultRecitalDoc: 'MAR-2014',
  recitalDocOf: { MAR: 'MAR-2014' },
  // Ranking: in natural-language questions, recitals tended to outrank the articles that
  // answer them. A query that names a recital ranks without these weights.
  kindWeight: { recital: 0.55 },
  fullWeightWhen: /\brecitals?\b/i,
  // The Q&A document: its chapter introductions are kept out of ranked results, and its
  // units are labelled "Q 5.1".
  qaDoc: 'ESMA-QA',
  layerLabels: {
    regulation: 'Regulation / directive (Level 1)',
    implementing: 'Delegated / implementing act (Level 2)',
    guidance: 'ESMA guidance (Level 3)',
  },
  guidanceAuthority: 'ESMA',
  // Ways people refer to the documents. Order matters: more specific first.
  docAliases: [
    ['DR-2016-957', /\b(?:2016\s*\/\s*957|stor\s+(?:rts|regulation|delegated)|rts\s+on\s+stors?)\b/i],
    ['DR-2016-522', /\b2016\s*\/\s*522\b/i],
    ['DR-2016-908', /\b(?:2016\s*\/\s*908|rts\s+on\s+(?:accepted\s+market\s+practices?|amps?))\b/i],
    ['DR-2016-909', /\b2016\s*\/\s*909\b/i],
    ['DR-2016-958', /\b(?:2016\s*\/\s*958|rts\s+on\s+investment\s+recommendations?)\b/i],
    ['DR-2016-960', /\b(?:2016\s*\/\s*960|rts\s+on\s+market\s+soundings?)\b/i],
    ['DR-2016-1052', /\b(?:2016\s*\/\s*1052|buy-?back\s+(?:and\s+stabilisation\s+)?rts)\b/i],
    ['ITS-2016-959', /\b(?:2016\s*\/\s*959|its\s+on\s+market\s+soundings?)\b/i],
    ['ITS-2016-1055', /\b2016\s*\/\s*1055\b/i],
    ['ITS-2016-523', /\b(?:2016\s*\/\s*523|its\s+on\s+managers'?\s+transactions)\b/i],
    ['ITS-2022-1210', /\b(?:2022\s*\/\s*1210|its\s+on\s+insider\s+lists?)\b/i],
    ['ITS-2016-378', /\b2016\s*\/\s*378\b/i],
    ['DIR-2015-2392', /\b(?:2015\s*\/\s*2392|whistleblowing\s+directive)\b/i],
    ['LISTING-ACT', /\b(?:2024\s*\/\s*2809|listing\s+act)\b/i],
    ['CSMAD', /\b(?:2014\s*\/\s*57|cs\s*-?\s*mad|criminal\s+sanctions\s+directive)\b/i],
    ['ESMA-QA', /\bq\s*(?:&|and)?\s*as?\b|questions?\s+(?:and|&)\s+answers?/i],
    ['ESMA-GL-DELAY', /\bdelay(?:ed|ing)?\b.*\b(?:guidelines?|disclosure)\b|\blegitimate\s+interests?\s+guidelines?/i],
    ['ESMA-GL-COMMODITY', /commodit(?:y|ies)\s+(?:derivatives?\s+)?guidelines?|guidelines?\s+on\s+commodit/i],
    ['ESMA-GL-SOUNDINGS', /soundings?\s+guidelines?|guidelines?\s+(?:on|for)\s+(?:persons\s+receiving\s+)?market\s+soundings?/i],
    ['MAR-2014', /\b(?:mar\s*\(?2014(?:\s+text)?\)?|original\s+(?:text\s+of\s+)?mar)\b/i],
    ['MAR', /\b(?:mar|596\s*\/\s*2014|market\s+abuse\s+regulation)\b/i],
  ],
  // Example citations for error messages.
  examples: '"Article 17 MAR", "Article 17(4) MAR", "Recital 23 MAR", "Article 2 2016/957", "ESMA Q&A 5.1", "delay guidelines 5.1"',
};
