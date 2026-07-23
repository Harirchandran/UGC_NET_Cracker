# NETCracker AI — Offline Question Bank v2.0

A single-student, installable UGC-NET Paper 1 and Computer Science & Applications preparation PWA.

## Offline behavior

After the first successful load, the service worker caches the application and the full 2015–2024 archive in the background. Planning, study, question browsing, practice, mocks, revision, mistakes, analytics, notes, backup and restore work without a server or internet connection.

The optional AI tutor is the only online feature. It remains locked until the student supplies and validates an API key for one of the five supported providers: Google Gemini, OpenAI, xAI Grok, GroqCloud or a custom OpenAI-compatible endpoint.

The built-in model catalog (`data/ai-model-catalog.js`, last verified 23 July 2026) provides curated model presets per provider. The settings screen dynamically populates provider-specific model dropdowns and supports live model discovery after key validation. Custom model IDs are also supported.

### Visual Question AI
The application features a capability-aware Ask AI subsystem (`docs/VISUAL_QUESTION_AI.md`) for text-only, stem-SVG, option-SVG, source-vector, and table questions. Visual questions are rendered locally into high-contrast PNG question sheets in memory for vision-capable models (e.g. Gemini 3.6 Flash, GPT-5.6 Terra, Grok 4.5, Qwen 3.6 27B Vision). Text-only models receive reviewed structured fallbacks with student consent or trigger model-switch guidance, preventing silent omission of essential visual content.

## Question bank

- 1,595 mapped historical records
- 1,572 scoreable records
- 23 official dropped/cancelled records retained but never scored
- 658 safe inline-SVG visual records
- no question-paper PDFs
- no PNG/JPEG question screenshots
- no embedded raster images inside SVG
- exact year, cycle, paper, question number, question ID, page/provenance and review metadata
- filters for year, paper, scoreability and visual content
- search by question, option, number or ID
- answer reveal and tests generated from filtered questions

Answer-key verification and transcription/content verification are displayed separately.

## Run on Windows

1. Extract the ZIP.
2. Open the application folder.
3. Double-click `start_windows.bat`.
4. Keep the terminal window open.

Alternatively:

```powershell
python run_local.py
```

## Install on Android

A service worker requires `localhost` or HTTPS.

### HTTPS host

1. Upload the application folder contents to a static HTTPS host.
2. Open the address in Chrome.
3. Choose **Chrome menu → Add to Home screen / Install app**.
4. Keep the app open until the archive-caching indicator completes once.

### Termux

1. Install Termux and Python.
2. Extract the folder on the phone.
3. Run `python -m http.server 8080` inside the folder.
4. Open `http://localhost:8080` in Chrome and install it.

## Add future papers

Read:

- `docs/QUESTION_DATA_CONTRACT.md`
- `docs/ADDING_QUESTIONS.md`

Use:

```bash
python tools/import_year.py staging/2025-reviewed.json
```

The importer validates and publishes the year, rebuilds the indexes and makes the service worker discover it automatically.

## Local data and API keys

Progress is stored in browser local storage. Export backups from Settings. API keys are session-only by default; “Remember key” stores the key locally on the student’s device.

## Validation

```bash
python tools/validate_question_bank.py
python tests/validate.py
node tests/runtime_smoke.js
python tests/http_smoke.py
```

See `AUDIT_AND_REPAIR_REPORT.md` and `TEST_REPORT.md`.
