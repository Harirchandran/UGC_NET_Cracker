# NETCracker AI question-bank audit and repair report

Release: **Offline Question Bank v2.0**

## Original defects

The supplied archive relied heavily on bundled PDFs and raster page images. It contained records with missing stem text, page-image instructions, OCR corruption, missing shared tables/passages, mixed-language leakage, lost diagrams, incorrect paper normalization and defective answer-key mappings.

High-impact findings included:

- 1,311 records dependent on page images;
- 450 records with no usable stem text;
- 704 PNG page images and 25 PDFs in the package;
- incorrect 2021 Paper 1/Paper 2 assignment;
- all 150 imported 2021 answers collapsed to Option A;
- a corrupt 2020 binary-valued metadata record and missing Paper 1 Question 35;
- formula, SQL, circuit, graph, tree, state-machine and shared-data extraction loss;
- legacy items marked verified merely because an answer index existed.

## Current archive

- **1,595** mapped records across 2015–2024.
- **1,572** scoreable records.
- **23** non-scoreable records retained for provenance because the official key drops/cancels them.
- **658** records with safe inline SVG support.
- **0** runtime PDFs.
- **0** question-page raster images.
- **0** raster-bearing SVGs.
- **0** structurally quarantined records remaining.

Historical Papers II and III are normalized to current Paper 2 while retaining `legacyPaper`.

## Repaired visual records

The following previously unscoreable questions now use semantic SVGs with accessible option descriptions:

- 2015 Paper III Question 21 — optimal binary-search-tree choices.
- 2016 Paper III Question 74 — 3-puzzle state choices.
- 2017 Paper III Question 39 — HTML table-layout choices.
- 2018 Paper II Question 59 — scheduling Gantt-chart choices.

Additional visual/shared-context repairs include trees, weighted graphs, combinational circuits, finite-state machines, counters, transformations, E-R symbols, data-interpretation tables and shared passages.

## Answer-key repairs

- 2020 mappings were rebuilt around NTA question/option IDs, including cancelled and multi-correct records.
- 2021 mappings were rebuilt from the final answer-key IDs: 143 scoreable, 7 dropped and 2 multi-correct.
- 2021 Question ID 2393 now displays all four formulas as text and scores using the later final-key option mapping, with the source discrepancy recorded in `reviewNotes`.
- 2018 Paper II Question 59 is mapped to Option B after reconstructing the SRTF schedule and correcting the previous import.

## User experience added

A dedicated **Question bank** screen now supports:

- year selection;
- Paper 1/Paper 2 filtering;
- scoreable, dropped and review/advisory filtering;
- text-only or visual-question filtering;
- search by stem, option, official question number, question ID or archive ID;
- previous/next navigation;
- answer reveal;
- starting a test from the filtered set.

Every browsed or tested question displays:

- examination cycle;
- year;
- normalized and historical paper identity;
- official question number;
- source page when retained;
- archive/question ID;
- answer-verification status;
- content-verification status;
- presentation type;
- review notes when a discrepancy or reconstruction exists.

Question metadata is also shown during tests, answer analysis and mistake review.

## Extensibility

The release includes:

- `data/question-schema.json`;
- `tools/reviewed-year-template.json`;
- `tools/import_year.py`;
- `tools/question_bank_lib.py`;
- `tools/build_archive_index.py`;
- `tools/validate_question_bank.py`;
- `docs/QUESTION_DATA_CONTRACT.md`;
- `docs/ADDING_QUESTIONS.md`.

The service worker discovers year archives from generated `pyq-index.json`; adding a valid future year does not require editing app or service-worker source.

## Validation evidence

Passed commands:

```text
python tools/build_archive_index.py
python tools/validate_question_bank.py
python tests/validate.py
node tests/runtime_smoke.js
python tests/http_smoke.py
node --check app.js
node --check sw.js
```

Validated invariants include record counts, paper counts, unique IDs, exactly four options, valid answer indexes, multi-answer handling, dropped-item exclusion, safe SVG policy, no PDF/raster references, repaired-record regressions, lazy year loading, provenance rendering and question-browser runtime behavior.

## Honest limitation

The corpus passes automated structural, answer-contract and runtime validation. It is not credible to claim that every character of all 1,595 historical questions has been independently human-proofread in this repair session. Exact source-vector preservation is retained where text conversion could change meaning, and the UI exposes content-verification status separately from answer-key status so future human review can proceed without misleading the student.

A real Chromium/Playwright navigation run could not be completed in this environment because browser navigation was blocked by the container administrator. Browser behavior was therefore validated through the Node DOM/runtime smoke and static-serving checks, without falsely claiming an end-to-end browser pass.
