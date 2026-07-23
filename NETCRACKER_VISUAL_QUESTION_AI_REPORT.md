# NETCracker AI — Capability-Aware Ask AI for Visual Questions Final Verification & Audit Report

**Date:** 23 July 2026  
**Repository:** `Harirchandran/UGC_NET_Cracker`  
**Application:** NETCracker AI (UGC-NET Offline PWA v1.0 / v2.0)

---

## 1. Starting & Final Git Baseline

- **Branch:** `main`
- **Starting HEAD:** `6d3469c7d3d81d5a32fbc46877b291fac260601d`
- **Working tree:** Clean
- **Staged files:** None

---

## 2. Groq Catalog Corrections

- **Groq Default Text Model:** `openai/gpt-oss-120b` (Recommended default)
- **Groq Recommended Vision Model:** `qwen/qwen3.6-27b` (Qwen 3.6 27B Vision, Preview, `maxImages: 3`, `maxImageBytes: 20971520`)
- **Groq Economy Text Model:** `openai/gpt-oss-20b`
- **Deprecated Groq Models:**
  - `llama-3.3-70b-versatile`: Marked `deprecated: true`, `shutdownDate: "2026-08-16"`, `recommended: false`.
  - `llama-3.1-8b-instant`: Marked `deprecated: true`, `shutdownDate: "2026-08-16"`, `recommended: false`.
- **UI & Migration Handling:** If a student previously selected a deprecated model, it remains preserved while active, displays a deprecation warning badge in Settings, and provides a one-click migration button (`Migrate to GPT-OSS 120B`).
- **Catalog Verification Date:** Updated to `2026-07-23`.

---

## 3. Programmatically Derived Visual Classifications

Visual question classifications across all 1,595 mapped historical records were generated via **programmatically derived visual classifications** (`data/ai-visual-question-overrides.js`):

- **Total mapped questions:** 1,595 / 1,595 (100%)
- **Visual requirement `none`:** 937
- **Visual requirement `supplementary`:** 131
- **Visual requirement `essential`:** 527
- **Text fallback quality `complete`:** 1,068
- **Text fallback quality `partial`:** 523
- **Text fallback quality `insufficient`:** 4

### Insufficient Fallback Question Audit:
1. `official-2016-p2-5` (Graph cliques): Essential source vector graph. Question text: *"How many cliques are there in the graph shown below?"* Options: 2, 4, 5, 6. Text fallback quality: `insufficient` (graph diagram mandatory).
2. `official-2021-2356` (Wheel graph $W_n$ regularity): Essential stem SVG diagram. Options: 2, 3, 4, 5. Text fallback quality: `insufficient`.
3. `official-2021-2365` (Finite automaton state minimization): Essential transition diagram stem SVG. Options: 3, 4, 5, 6. Text fallback quality: `insufficient`.
4. `official-2021-2383` (Alpha-beta pruning tree calculation): Essential game tree stem SVG. Options: 3, 5, 6, 9. Text fallback quality: `insufficient`.

---

## 4. Real Chrome Browser Execution & Renderer Evidence

Real Chrome automation was executed using **Google Chrome v150.0.7871.130** (`C:\Program Files\Google\Chrome\Application\chrome.exe`) attached via Chrome DevTools Protocol (CDP):

### Viewports Verified:
1. **Desktop:** `1440 × 900`
2. **Mobile:** `390 × 844`
3. **Small Mobile:** `320 × 568`

### Empirical PNG Renderer Results in Real Chrome:

| Question ID | Year | Visual Types | Visual Req | Width | Height | PNG Byte Size | Answer Excluded | Key Excluded |
|-------------|------|--------------|------------|-------|--------|---------------|-----------------|--------------|
| `official-2015-p1-2` | 2015 | `source-vector` | `supplementary` | 800 | 481 | 46,761 B | Yes | Yes |
| `official-2021-2356` | 2021 | `stem-svg` | `essential` | 800 | 581 | 52,494 B | Yes | Yes |
| `official-2016-p3-74` | 2016 | `stem-svg`, `option-svg` | `essential` | 800 | 2,925 | 109,575 B | Yes | Yes |
| `official-2015-p3-21` | 2015 | `option-svg` | `essential` | 800 | 2,208 | 188,763 B | Yes | Yes |
| `official-2016-p2-5` | 2016 | `source-vector` | `essential` | 800 | 433 | 32,568 B | Yes | Yes |
| `official-2021-2365` | 2021 | `stem-svg` | `essential` | 800 | 962 | 158,541 B | Yes | Yes |
| `official-2021-2383` | 2021 | `stem-svg` | `essential` | 800 | 826 | 70,053 B | Yes | Yes |

*Note: Height automatically expands up to 2,925px for long option SVG questions without cropping.*

---

## 5. Automated & Real-Browser Test Suite Results

All 8 automated test suites and real Chrome CDP tests passed cleanly:

```powershell
1. python tools/validate_question_bank.py   -> PASS (1,595 mapped, 1,572 scoreable, 658 visual)
2. python tests/validate.py                 -> PASS
3. node tests/runtime_smoke.js              -> PASS
4. python tests/http_smoke.py               -> PASS
5. python tests/audit_correction_tests.py   -> PASS
6. node tests/ai_model_tests.js             -> PASS (Groq defaults, Qwen maxImages=3, deprecation dates)
7. node tests/ai_visual_question_tests.js   -> PASS (Catalog metadata, 1,595 classifications, decision engine)
8. node tests/visual_ai_browser_tests.js   -> PASS (45/45 scenarios passed across 3 viewports)
```

---

## 6. Offline & Image Lifecycle Results

- **Offline Behavior:** Offline Ask AI requests present a clear notification: *"AI analysis requires internet access. The question, diagram and all offline study tools remain available."* Question presentation, syllabus map, practice tests, mocks, revision, mistakes, and local question-sheet previews work 100% offline.
- **Image Lifecycle:** Temporary generated image data URLs exist only in volatile RAM during request payload creation; zero images are stored in `localStorage`, `IndexedDB`, or `Cache Storage`.

---

## 7. Live Provider Validation Notice

Live API key calls against external provider endpoints were **NOT TESTED** because no live production API keys were provided in the execution environment. Provider request payload formats were verified via deterministic structure testing in real Chrome.
