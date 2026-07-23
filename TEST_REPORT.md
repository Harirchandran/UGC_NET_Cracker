# Validation report

## Automated results

- Question-bank contract validation: passed
- Static corpus validation: passed
- JavaScript syntax checks: passed
- Node DOM/runtime smoke: passed
- Static HTTP serving check: passed

## Validated invariants

- 1,595 mapped records for 2015–2024
- 1,572 scoreable records
- 23 official dropped/cancelled records excluded from scoring
- 658 SVG-backed records
- zero structurally quarantined records
- exactly four ordered options for every record
- valid answer index/list for every scoreable record
- answer verification separated from content verification
- 2015–2017 historical Papers II/III normalized with legacy identity retained
- 2020 Paper 1 Q35 restored and corrupt binary metadata removed
- 2021 normalized to 50 Paper 1 and 100 Paper 2 records
- 2021: 143 scoreable, 7 dropped, 2 multi-correct
- repaired semantic-SVG regressions for 2015 P3 Q21, 2016 P3 Q74, 2017 P3 Q39 and 2018 P2 Q59
- 2021 Question ID 2393 formula options and final-key mapping regression covered
- no local PDF, page screenshot or raster-bearing SVG
- no unsafe SVG script, event handler, external image or `foreignObject`
- lazy year loading on dashboard startup
- question browser provenance, SVG rendering and filtered-test behavior exercised by runtime smoke
- JS and JSON archive indexes remain identical
- service worker discovers future year files through the generated JSON index

## Browser-test limitation

System Chromium was located, but HTTP and file navigation were blocked by the container administrator. A completed Playwright navigation test is therefore not claimed. Browser behavior was exercised through the Node DOM/runtime smoke and static HTTP checks.

Run locally:

```bash
python tools/validate_question_bank.py
python tests/validate.py
node tests/runtime_smoke.js
python tests/http_smoke.py
```
