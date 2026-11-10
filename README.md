<img src="assets/icon.png" width="72" alt="" align="right">

# EU MAR MCP

An open-source [Model Context Protocol](https://modelcontextprotocol.io) server for the EU
Market Abuse Regulation. It gives AI assistants such as Claude the text of MAR, its
delegated and implementing acts and ESMA's guidance — **linked article by article**, so
that asking about a provision also brings up the Level 2 rules that supplement it and how
ESMA interprets it. For energy and commodity firms it also maps MAR to REMIT.

> Not legal advice. ESMA guidelines and Q&As are not legislation. Texts are as of the fetch
> date returned with every answer; check the linked source.

Companion to [REMIT MCP](https://github.com/skraptt/remit-mcp), which serves REMIT and
ACER's guidance. The two servers are meant to be connected side by side.

## What it covers

| Layer | Documents |
|---|---|
| Regulation / directive | MAR — Regulation (EU) No 596/2014, latest consolidated version, with the recitals of the original 2014 text (consolidated texts carry none); Regulation (EU) 2024/2809 (Listing Act, amending MAR); Directive 2014/57/EU on criminal sanctions for market abuse (CS MAD) |
| Delegated acts (RTS) | 2016/522 (indicators of manipulation, thresholds, delays, managers' transactions); 2016/908 (accepted market practices); 2016/909 (reference data); 2016/957 (STORs); 2016/958 (investment recommendations); 2016/960 (market soundings); 2016/1052 (buy-backs and stabilisation) |
| Implementing acts (ITS) | 2016/959 (market soundings); 2016/1055 (disclosure and delay of inside information); 2016/523 (managers' transactions); 2022/1210 (insider lists); 2016/378 (reference data); Implementing Directive 2015/2392 (reporting of infringements) |
| ESMA guidance | Q&As on MAR (ESMA70-145-111); MAR guidelines on delay in the disclosure of inside information as revised in October 2026 (Annex I to the final report ESMA74-268544963-1718; the report's consultation feedback is left out), on information relating to commodity derivatives markets, and on persons receiving market soundings |

Every act is fetched in its latest consolidated version where one exists. Sources are
fetched from EUR-Lex (Publications Office CELLAR) and esma.europa.eu every day.

## Tools

| Tool | What it does |
|---|---|
| `search_mar` | Searches all layers; filter by layer or document. Accepts questions or citations. |
| `get_provision` | Full text of an article, recital or guidance section. For MAR articles, also the delegated and implementing provisions that refer to it and the ESMA guidelines sections and Q&As that refer to it, most specific first. For guidance, the provisions it cites. |
| `remit_crosswalk` | Pairs MAR and REMIT provisions on the same subject (inside information, insider dealing, manipulation, STORs, disclosure and delay, sanctions …) with a note on where they differ, including rules with no counterpart. |
| `list_documents` | Documents, fetch dates and links. |

Citations it understands: `Article 17 MAR`, `Article 17(4) MAR`, `Art. 7 of the Market
Abuse Regulation`, `Article 2 2016/957`, `Article 4 CS MAD`,
`ESMA Q&A 5.1`, `delay guidelines 5.1`.

## How it works

The pipeline is the one used by REMIT MCP:

- **Parsing.** EUR-Lex acts are split into recitals, articles and annexes from their XHTML.
  ESMA PDFs are read line by line with font metadata (`scripts/pdf_lines.py`); sections
  are recovered from typography and ESMA's numbering. In the Q&As every question
  ("Q5.1", "Question 5.1") becomes a unit whose title is the question and whose text is
  the answer; withdrawn questions are dropped. Guidelines are split at their numbered
  paragraphs.
- **Linking.** Every unit is scanned for references such as "Article 17(4) of MAR",
  "Article 16(2) of Regulation (EU) No 596/2014" or "Article 2 of Commission Delegated
  Regulation (EU) 2016/957"; these links drive `get_provision`.
- **Search.** BM25 over titles and text, fused with semantic search (Cloudflare Workers AI
  embeddings and Vectorize) when available; BM25 alone otherwise.
- **Domain lexicon** (`src/lexicon.mjs`): STOR ↔ suspicious transaction and order report,
  PDMR ↔ person discharging managerial responsibilities, closed period ↔ blackout period,
  market sounding ↔ wall-crossing, and so on.
- **Crosswalk** (`src/crosswalk.mjs`): written by hand. The REMIT side was checked against
  the consolidated REMIT text (CELEX 02011R1227-20250205).

## Status

Version 0.1.0. The code runs on fixture data (`npm test` without fetched sources runs
`test/fixture.test.mjs`); the first run of the deploy workflow fetches the real sources.
After that run, check the fetch log in the workflow summary: ESMA PDF URLs are discovered
from ESMA's pages and may need adjusting in `scripts/sources.mjs`, and the Q&A parser
should be checked against the real document. There is no search evaluation set yet.

## Use

Local:

```bash
git fetch origin sources && git worktree add .sources origin/sources   # fetched documents
pip install pdfplumber                                                  # PDF text extraction
npm test        # builds data/mar.json and runs the tests
npm run dev     # http://localhost:8787/mcp
```

Deployment: the GitHub Actions workflow (`.github/workflows/deploy.yml`) fetches, builds,
tests and deploys to Cloudflare Workers. It needs the repository secrets
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## Licence

Code: Apache-2.0. EU legislation is reused under the Commission's reuse policy
(Decision 2011/833/EU); EUR-Lex is the authentic source only for the Official Journal.
ESMA documents: check ESMA's reuse conditions before publishing; every answer names and
links its source.
