# Adding future UGC-NET questions

This workflow is deliberately review-gated. Raw OCR output is never published directly.

## 1. Preserve official source material outside the runtime app

Keep the official paper and final answer key in a private working folder. Do not copy PDFs or page screenshots into the PWA `data` folder.

Record the exact cycle, shift, subject, official question IDs, option IDs and final-key status.

## 2. Create a reviewed JSON file

Copy:

```text
tools/reviewed-year-template.json
```

Create, for example:

```text
staging/2025-reviewed.json
```

Each question must satisfy `data/question-schema.json` and `docs/QUESTION_DATA_CONTRACT.md`.

## 3. Represent visuals semantically

Use:

- text or Unicode for dependable formulas;
- `stemVectorSvg` for graphs, circuits, trees, automata, tables and diagrams in the stem;
- four `optionVectorSvgs` plus four `optionAlt` descriptions when the choices are visual;
- `passage` for a shared table, passage or case description used by multiple questions.

Do not use page screenshots. Do not embed an image inside an SVG.

## 4. Verify option ordering and answers separately

First verify that options A, B, C and D match the official paper. Then map the final answer key independently.

Use zero-based indexes:

```text
A = 0
B = 1
C = 2
D = 3
```

For multiple accepted answers:

```json
"answers": [1, 3]
```

For an officially dropped question:

```json
"dropped": true,
"scored": false
```

## 5. Publish through the importer

From the application root:

```bash
python tools/import_year.py staging/2025-reviewed.json
```

The importer:

1. validates required metadata;
2. enforces four options;
3. validates answer indexes;
4. validates safe SVG content;
5. rejects PDF/image references and old image-placeholder wording;
6. checks duplicate IDs inside the import;
7. publishes `data/interactive-pyqs-2025.js`;
8. rebuilds `pyq-index.js`, `pyq-index.json` and `pyq-import-status.json`;
9. runs the complete question-bank validator.

The service worker reads `pyq-index.json`, so a new year is discovered automatically.

## 6. Run release validation

```bash
python tools/validate_question_bank.py
python tests/validate.py
node tests/runtime_smoke.js
python tests/http_smoke.py
```

Do not distribute an archive unless all three commands pass.

## 7. Review in the app

Open **Question bank** and verify:

- year and paper metadata;
- official question number and question ID;
- shared passage/table context;
- option A–D ordering;
- mobile diagram scaling;
- answer reveal;
- filtered-test rendering;
- dropped/non-scoreable status.

A second human review is recommended for formula-heavy, diagram-heavy and shared-context questions.
