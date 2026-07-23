# NETCracker AI validation report

Validation date: 22 July 2026

## Passed checks

- `index.html`, manifest, stylesheet, scripts and icons exist.
- Manifest parses as valid JSON and references existing 192 px and 512 px icons.
- Service-worker pre-cache list references existing files.
- `app.js`, `sw.js`, bundled data and lesson scripts pass `node --check`.
- A lightweight JavaScript DOM runtime loads the application, initialises state and renders the dashboard without an exception.
- Syllabus JSON contains two papers and ten units in each paper.
- Syllabus contains 137 trackable topic nodes.
- Question bank contains exactly 150 unique original MCQs.
- Question split is exactly 50 Paper 1 and 100 Paper 2, matching one complete local mock.
- Every question has four options, a valid correct-answer index and a non-empty explanation.
- Historical unreserved JRF cutoff snapshot validates as 192 for December 2025.
- A temporary local HTTP server returned all critical PWA assets successfully.
- Complete `tests/validate.py` result: **PASS**.

## Browser limitation of this build environment

The available container Chromium process did not terminate reliably in headless mode, even for `about:blank`, so an automated visual Chromium screenshot was not treated as valid evidence. JavaScript syntax, application initialisation, dataset integrity, service-worker asset integrity and HTTP delivery were tested independently.

## User acceptance checks recommended after extraction

1. Complete onboarding and change the target score/date.
2. Mark a daily task complete and reload the page.
3. Run a 5-question practice test and inspect the mistake notebook.
4. Start and submit a full mock.
5. Export and re-import a backup.
6. Serve from HTTPS or localhost and confirm the browser offers installation.
7. Validate an API key for the chosen provider and ask one tutor question.
8. Turn off connectivity and confirm dashboard, lessons, practice, mock and analytics remain available.
