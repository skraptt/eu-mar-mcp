// Source registry. Every document the server serves is listed here.
//
// layer:
//   regulation   – Level 1: MAR, the acts amending it, CS MAD
//   implementing – Level 2: Commission delegated and implementing acts under MAR
//   guidance     – Level 3: ESMA guidelines and Q&As
//
// EUR-Lex documents are fetched by CELEX number. For every act the latest consolidated
// version is used when one exists (fetch.mjs looks it up), otherwise the original text.
// `verifyTitle` guards against a wrong CELEX number: the fetched text must contain it.
//
// ESMA documents are PDFs; their URLs are discovered from the ESMA pages in
// ESMA_INDEX_PAGES and matched by the `match` pattern on the file name. `url` is the
// fallback. Check the fetch log of the first run: ESMA moves files between library paths.

export const EURLEX = [
  // ---- Level 1 ----
  { id: 'MAR', title: 'Regulation (EU) No 596/2014 on market abuse (Market Abuse Regulation, MAR), consolidated', short: 'MAR', layer: 'regulation', celex: '32014R0596', verifyTitle: /market abuse/i },
  // Consolidated texts carry no recitals; MAR's recitals come from the original text.
  { id: 'MAR-2014', title: 'Regulation (EU) No 596/2014 (MAR), original text of 16 April 2014 – recitals', short: 'MAR (2014 text)', layer: 'regulation', celex: '32014R0596', original: true, kinds: ['recital'], verifyTitle: /market abuse/i },
  { id: 'LISTING-ACT', title: 'Regulation (EU) 2024/2809 (Listing Act) amending Regulations (EU) 2017/1129, (EU) No 596/2014 and (EU) No 600/2014', short: 'Reg. 2024/2809 (Listing Act)', layer: 'regulation', celex: '32024R2809', verifyTitle: /596\/2014/ },
  { id: 'CSMAD', title: 'Directive 2014/57/EU on criminal sanctions for market abuse (CS MAD)', short: 'CS MAD', layer: 'regulation', celex: '32014L0057', verifyTitle: /criminal sanctions/i },

  // ---- Level 2: delegated regulations (RTS and delegated acts) ----
  { id: 'DR-2016-522', title: 'Commission Delegated Regulation (EU) 2016/522: third-country public bodies, indicators of market manipulation, disclosure thresholds, notification of delays, managers\' transactions', short: 'Del. Reg. 2016/522', layer: 'implementing', celex: '32016R0522', verifyTitle: /2016\/522/ },
  { id: 'DR-2016-908', title: 'Commission Delegated Regulation (EU) 2016/908: RTS on accepted market practices', short: 'Del. Reg. 2016/908', layer: 'implementing', celex: '32016R0908', verifyTitle: /accepted market practice/i },
  { id: 'DR-2016-909', title: 'Commission Delegated Regulation (EU) 2016/909: RTS on financial instrument reference data notifications', short: 'Del. Reg. 2016/909', layer: 'implementing', celex: '32016R0909', verifyTitle: /2016\/909/ },
  { id: 'DR-2016-957', title: 'Commission Delegated Regulation (EU) 2016/957: RTS on arrangements, systems and procedures to detect and report suspicious orders and transactions (STORs)', short: 'Del. Reg. 2016/957', layer: 'implementing', celex: '32016R0957', verifyTitle: /suspicious/i },
  { id: 'DR-2016-958', title: 'Commission Delegated Regulation (EU) 2016/958: RTS on investment recommendations', short: 'Del. Reg. 2016/958', layer: 'implementing', celex: '32016R0958', verifyTitle: /investment recommendations/i },
  { id: 'DR-2016-960', title: 'Commission Delegated Regulation (EU) 2016/960: RTS on market soundings', short: 'Del. Reg. 2016/960', layer: 'implementing', celex: '32016R0960', verifyTitle: /market sounding/i },
  { id: 'DR-2016-1052', title: 'Commission Delegated Regulation (EU) 2016/1052: RTS on buy-back programmes and stabilisation measures', short: 'Del. Reg. 2016/1052', layer: 'implementing', celex: '32016R1052', verifyTitle: /buy-back/i },

  // ---- Level 2: implementing regulations and directive (ITS) ----
  { id: 'ITS-2016-959', title: 'Commission Implementing Regulation (EU) 2016/959: ITS on market soundings (systems, templates, records)', short: 'Impl. Reg. 2016/959', layer: 'implementing', celex: '32016R0959', verifyTitle: /market sounding/i },
  { id: 'ITS-2016-1055', title: 'Commission Implementing Regulation (EU) 2016/1055: ITS on public disclosure of inside information and delay of disclosure', short: 'Impl. Reg. 2016/1055', layer: 'implementing', celex: '32016R1055', verifyTitle: /inside information/i },
  { id: 'ITS-2016-523', title: 'Commission Implementing Regulation (EU) 2016/523: ITS on notification and public disclosure of managers\' transactions', short: 'Impl. Reg. 2016/523', layer: 'implementing', celex: '32016R0523', verifyTitle: /managers/i },
  { id: 'ITS-2022-1210', title: 'Commission Implementing Regulation (EU) 2022/1210: ITS on the format of insider lists', short: 'Impl. Reg. 2022/1210', layer: 'implementing', celex: '32022R1210', verifyTitle: /insider list/i },
  { id: 'ITS-2016-378', title: 'Commission Implementing Regulation (EU) 2016/378: ITS on the timing, format and template of reference data notifications', short: 'Impl. Reg. 2016/378', layer: 'implementing', celex: '32016R0378', verifyTitle: /2016\/378/ },
  { id: 'DIR-2015-2392', title: 'Commission Implementing Directive (EU) 2015/2392 on reporting of actual or potential infringements of MAR (whistleblowing)', short: 'Impl. Dir. 2015/2392', layer: 'implementing', celex: '32015L2392', verifyTitle: /infringements/i },
];

export const ESMA_INDEX_PAGES = [
  'https://www.esma.europa.eu/policy-activities/market-abuse',
];

export const ESMA = [
  {
    id: 'ESMA-QA',
    title: 'ESMA Questions and Answers on the Market Abuse Regulation (ESMA70-145-111)',
    short: 'ESMA Q&A',
    layer: 'guidance',
    qa: true, // sections are questions ("Q5.1", "Question 5.1")
    latest: true,
    match: /esma70-145-111|qa_on_mar|Q.?A[^/]*MAR/i,
    url: 'https://www.esma.europa.eu/sites/default/files/library/esma70-145-111_qa_on_mar.pdf',
  },
  {
    // The guidelines revised after the Listing Act amended Article 17(4) MAR. ESMA
    // published them in October 2026 in its final report (the guidelines are in an annex);
    // the 2016 guidelines (ESMA/2016/1478) are being replaced. Check for the separate
    // guidelines document once ESMA publishes it in all languages.
    id: 'ESMA-GL-DELAY',
    title: 'ESMA MAR Guidelines on delay in the disclosure of inside information, as revised in October 2026 (Annex I to Final Report ESMA74-268544963-1718)',
    short: 'ESMA delay guidelines (2026)',
    layer: 'guidance',
    numberedParas: true,
    // Only the guidelines (Annex I), not the consultation feedback around them.
    from: /^\d+(?:\.\d+)?\s+Annex I\s*[–-]/,
    to: /^\d+(?:\.\d+)?\s+Annex II\s*[–-]/,
    match: /MAR_Guidelines_on_delay_in_the_disclosure/i,
    url: 'https://www.esma.europa.eu/sites/default/files/2026-10/ESMA74-268544963-1718_Final_report_-_MAR_Guidelines_on_delay_in_the_disclosure_of_inside_information.pdf',
  },
  {
    id: 'ESMA-GL-COMMODITY',
    title: 'ESMA MAR Guidelines – Information relating to commodity derivatives markets or related spot markets',
    short: 'ESMA commodity guidelines',
    layer: 'guidance',
    numberedParas: true,
    match: /1480_mar_guidelines_on_commodit/i,
    url: 'https://www.esma.europa.eu/sites/default/files/library/esma-2016-1480_mar_guidelines_on_commodity_derivatives.pdf',
  },
  {
    id: 'ESMA-GL-SOUNDINGS',
    title: 'ESMA MAR Guidelines – Persons receiving market soundings',
    short: 'ESMA market soundings guidelines',
    layer: 'guidance',
    numberedParas: true,
    match: /mar_guidelines_-_market_soundings/i,
    url: 'https://www.esma.europa.eu/sites/default/files/library/2016-1477_mar_guidelines_-_market_soundings.pdf',
  },
];
