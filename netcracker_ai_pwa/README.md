# NETCracker AI

A self-contained, offline-first Progressive Web App for one student preparing for:

- UGC-NET Paper 1 — General Paper on Teaching and Research Aptitude (Code 00)
- UGC-NET Paper 2 — Computer Science and Applications (Code 87)
- JRF, Assistant Professor, PhD-only, or a manually selected score target

No account, database server, subscription, build process, package manager, or IDE is required.

## Included

- Current official syllabus mapped into 20 units and 137 trackable topic nodes
- Editable target date, qualification goal, category and Paper 1/Paper 2 score split
- Daily adaptive plan using knowledge gap, importance, revision risk and urgency
- Offline unit teaching kits, formula/rule notes and common traps
- 150 original, locally bundled MCQs: 50 Paper 1 + 100 Computer Science
- A ten-year (2015-2024) Computer Science previous-year paper library: 17 bundled PDF files that open offline
- 180-minute full 150-question mock examination
- Custom practice tests, timer, palette, mark-for-review and post-test review
- Mastery tracking, spaced revision, mistake notebook and remediation
- Readiness, coverage, score-range estimate and unit analytics
- Local notes and complete JSON backup/import
- Installable PWA with service-worker caching
- Optional voice input where the browser supports Web Speech
- Optional AI tutor unlocked only after a user-supplied API key validates
- Gemini, OpenAI, Groq and custom OpenAI-compatible provider support

## Start on Windows

1. Extract the ZIP.
2. Double-click `start_windows.bat`.
3. If Windows asks, allow Python to run. The app opens at `http://localhost:8080`.

Python 3 is the only runtime needed for this local method. The app itself has no Python dependency after it is served.

Alternative command:

```powershell
py -3 run_local.py
```

## Install on Android as a PWA

A PWA must be served from `https://` or from `localhost`; opening `index.html` directly as a file cannot install the service worker.

### Method A — static HTTPS hosting

Upload the extracted folder exactly as-is to any static HTTPS host, open its URL in Chrome on Android, then use:

`Chrome menu → Add to Home screen / Install app`

No backend is required. Once opened successfully, all local app assets are cached for offline use.

### Method B — phone-local installation using Termux

1. Install Termux from its trusted distribution source.
2. Copy the extracted app folder to the phone.
3. In Termux:

```sh
pkg install python
cd /path/to/netcracker_ai_pwa
python -m http.server 8080
```

4. Open `http://localhost:8080` in Chrome.
5. Use `Chrome menu → Add to Home screen / Install app`.
6. Open the installed app once while the server is running so all assets are cached.

## AI key behaviour

AI is disabled until the key passes a real provider request.

- By default the key is held only in `sessionStorage` and disappears when the browser session is cleared.
- “Remember key” stores it in this browser’s local storage. This is convenient but less secure.
- The app sends the key directly to the provider chosen by the student.
- The app has no developer server that receives or stores the key.
- AI requires an internet connection. Planning, syllabus, lessons, practice, mocks, revision, mistakes, analytics and backups do not.
- Provider model IDs change over time. The model field is editable.

## Local data

Student data is stored in the browser’s local storage. Clearing browser/site data erases it. Use **Settings → Export backup** regularly.

The exported JSON contains the student profile, targets, progress, notes, attempts, mistakes and tutor chat history. It does not intentionally include a session-only API key.

## Examination-data warning

- The app does **not** invent an official future examination date. The date is a personal editable target.
- The examination pattern is configured from the official NTA June 2026 bulletin.
- The syllabus is structured from the official UGC Code 00 and Code 87 syllabus documents.
- The cutoff table is a historical December 2025 reference, not a prediction.
- The practice questions are labelled with their stated provenance. The previous-year paper library keeps source labels on every local PDF; they are separate from generated practice questions.
- Readiness and predicted-score ranges are planning estimates, never guarantees.

See `OFFICIAL_DATA_NOTES.md` for provenance.

## Project structure

```text
index.html                 Application shell
styles.css                 Responsive offline UI
app.js                     Planner, mastery, tests, tutor and storage
manifest.webmanifest       PWA installation metadata
sw.js                      Offline cache service worker
data/bundle.js             Hardcoded syllabus, questions and cutoffs
data/lessons.js            Offline unit teaching kits
data/*.json                Human-readable source datasets
data/pyq-papers.js         Cached ten-year previous-year paper directory
PYQ_ARCHIVE_NOTES.md       Paper-source provenance and format notes
icons/                     PWA icons
run_local.py               Zero-dependency local server
start_windows.bat          Windows launcher
OFFICIAL_DATA_NOTES.md     Provenance and limitations
TEST_REPORT.md             Validation performed before packaging
```

## Privacy model

This build is intentionally single-user and local-first. It contains no analytics SDK, advertisements, user account, cloud database or telemetry endpoint.
