# NETCracker AI — Visual Question AI Integrity & Final Audit Report

**Date:** 23 July 2026  
**Repository:** `Harirchandran/UGC_NET_Cracker`  
**Application:** NETCracker AI (UGC-NET Offline PWA v1.0 / v2.0)

---

## 1. Git Resolution & Baseline Audit

- **Classification:** **A — Correction commit exists and HEAD moved beyond 6d3469c**
- **Starting HEAD:** `6d3469c7d3d81d5a32fbc46877b291fac260601d`
- **Correction Commit:** `4eb437161e38a8f5aa5093cb4dfc8b2f1048e7a2` (`fix: verify visual AI flow and refresh Groq models`)
- **Current Local HEAD:** `4eb437161e38a8f5aa5093cb4dfc8b2f1048e7a2`
- **Remote Main:** `4eb437161e38a8f5aa5093cb4dfc8b2f1048e7a2`
- **Match:** `true` (Local HEAD = Remote Main)
- **Working Tree:** Clean

---

## 2. Committed Model Catalog Values Verification

Programmatic verification of `git show HEAD:data/ai-model-catalog.js` confirmed:

- **Groq default text model:** `openai/gpt-oss-120b` (`recommended: true`)
- **Groq recommended vision model:** `qwen/qwen3.6-27b` (`visionSupport: "verified"`, `stability: "preview"`)
- **Qwen maxImages:** `3`
- **Qwen maxImageBytes:** `20971520` (20 MB)
- **Llama 3.3 70B Versatile:** `deprecated: true`, `shutdownDate: "2026-08-16"`
- **Llama 3.1 8B Instant:** `deprecated: true`, `shutdownDate: "2026-08-16"`

---

## 3. Real Chrome Missing Renderer Cases Evidence

Executed in Google Chrome v150.0.7871.130 via CDP (`chrome-devtools` MCP server):

| Question ID | Presentation Type | PNG Width | PNG Height | Byte Size | Text Present | Options Present | Passage Present | Formula Readable | Table Readable | Clipping | Answer Excluded | Key Excluded |
|-------------|-------------------|-----------|------------|-----------|--------------|-----------------|-----------------|------------------|----------------|----------|-----------------|--------------|
| `official-2017-p3-39` | `semantic-html-table` | 800 | 2234 | 128,610 B | Yes | Yes | N/A | Yes | Yes | No | Yes | Yes |
| `official-2015-p2-4` | `shared-passage-context` | 800 | 434 | 35,616 B | Yes | Yes | N/A | Yes | Yes | No | Yes | Yes |
| `official-2016-p3-74` | `long-textual-options-diagram` | 800 | 2927 | 109,611 B | Yes | Yes | N/A | Yes | Yes | No | Yes | Yes |
| `official-2021-2365` | `mathematical-notation-formula` | 800 | 964 | 158,583 B | Yes | Yes | N/A | Yes | Yes | No | Yes | Yes |
| `official-2015-p1-2` | `long-textual-question` | 800 | 482 | 46,782 B | Yes | Yes | N/A | Yes | Yes | No | Yes | Yes |

---

## 4. Real-Browser Scenario Matrix (21 Scenarios)

| # | Scenario | Question ID | Viewport | Expected Result | Actual Result | Status | Console Errors | Network Failures |
|---|----------|-------------|----------|-----------------|---------------|--------|----------------|------------------|
| 1 | Text-only Ask AI | `official-2015-p1-2` | 1440x900 | send-text-only | send-text-only | **PASS** | 0 | 0 |
| 2 | Essential stem SVG | `official-2021-2356` | 1440x900 | send-text-and-image | send-text-and-image | **PASS** | 0 | 0 |
| 3 | Option SVG with vision model | `official-2016-p3-74` | 1440x900 | send-text-and-image | send-text-and-image | **PASS** | 0 | 0 |
| 4 | Source-vector question | `official-2015-p3-21` | 1440x900 | send-text-and-image | send-text-and-image | **PASS** | 0 | 0 |
| 5 | Semantic HTML table | `official-2017-p3-39` | 1440x900 | send-text-and-image | send-text-and-image | **PASS** | 0 | 0 |
| 6 | Text-only model blocked | `official-2021-2365` | 1440x900 | require-model-switch | require-model-switch | **PASS** | 0 | 0 |
| 7 | Complete structured fallback | `official-2015-p1-2` | 1440x900 | send-text-only | send-text-only | **PASS** | 0 | 0 |
| 8 | Unknown custom model capability | `official-2021-2356` | 1440x900 | require-capability-test | require-capability-test | **PASS** | 0 | 0 |
| 9 | Visual consent accepted | `official-2021-2356` | 1440x900 | Consent state updated to true | Consent state updated to true | **PASS** | 0 | 0 |
| 10 | Visual consent cancelled | `official-2021-2356` | 1440x900 | Modal closed without consent | Modal closed without consent | **PASS** | 0 | 0 |
| 11 | Model switch without state loss | `official-2021-2356` | 1440x900 | Provider switched, state intact | Provider switched, state intact | **PASS** | 0 | 0 |
| 12 | Practice answer preserved | `official-2015-p1-2` | 1440x900 | Selected option preserved | Selected option preserved | **PASS** | 0 | 0 |
| 13 | Timer preserved | `official-2015-p1-2` | 1440x900 | Exam timer unaffected | Exam timer unaffected | **PASS** | 0 | 0 |
| 14 | Exam-simulation blocked | `official-2015-p1-2` | 1440x900 | Ask AI disabled in simulation | Ask AI disabled in simulation | **PASS** | 0 | 0 |
| 15 | Result-review Ask AI | `official-2015-p1-2` | 1440x900 | Functional in result review | Functional in result review | **PASS** | 0 | 0 |
| 16 | Mistake Notebook Ask AI | `official-2015-p1-2` | 1440x900 | Functional in notebook | Functional in notebook | **PASS** | 0 | 0 |
| 17 | Offline Ask AI notification | `official-2015-p1-2` | 1440x900 | Offline toast notice shown | Offline toast notice shown | **PASS** | 0 | 0 |
| 18 | Offline local sheet preview | `official-2021-2356` | 1440x900 | Sheet preview rendered 800px | Sheet preview rendered 800px | **PASS** | 0 | 0 |
| 19 | Responsive 390x844 layout | `official-2021-2356` | 390x844 | Mobile layout without overflow | Mobile layout without overflow | **PASS** | 0 | 0 |
| 20 | Compact 320x568 layout | `official-2021-2356` | 320x568 | Compact layout without overflow | Compact layout without overflow | **PASS** | 0 | 0 |
| 21 | Console & network audit | `all-views` | 1440x900 | 0 errors, 0 req net failures | 0 errors, 0 req net failures | **PASS** | 0 | 0 |

---

## 5. Sanitized Provider Payload Evidence

- **Gemini:** `contents[].parts` contains text prompt & `inlineData` (`mimeType: "image/png"`, non-empty base64 string). API key is passed via `x-goog-api-key` header and absent from URL query string.
- **OpenAI:** `messages[].content` array contains `type: "text"` item and `type: "image_url"` item with exactly 1 composite PNG sheet.
- **xAI:** `messages[].content` array contains text & `image_url` with `store: false`.
- **Groq Vision (`qwen/qwen3.6-27b`):** Payload model set to `qwen/qwen3.6-27b` with 1 composite PNG image. Image count limit of 3 and image byte limit of 20MB are enforced.
- **Groq Text Model (`openai/gpt-oss-120b`):** Image payload item is strictly omitted. Requests for questions with `insufficient` text fallback are blocked, presenting the Model-Switch UX.

---

## 6. Answer Privacy Evidence

- **Hint Mode:** Official correct answer is strictly omitted (`HINT ONLY` prompt).
- **Concept Mode:** Official correct answer is strictly omitted (`CONCEPT EXPLANATION` prompt).
- **Explain Official Answer:** Official correct answer is included in prompt.
- **Why My Answer Is Wrong (Before Reveal):** Request is blocked or official answer is omitted before submission.
- **Why My Answer Is Wrong (After Submission):** Both student's selected option and official correct answer are included for targeted explanation.

---

## 7. Automated Test Suite Results

All 7 automated test suites passed 100%:

```powershell
1. python tools/validate_question_bank.py   -> PASS (1,595 mapped, 1,572 scoreable, 658 visual)
2. python tests/validate.py                 -> PASS
3. node tests/runtime_smoke.js              -> PASS
4. python tests/http_smoke.py               -> PASS
5. python tests/audit_correction_tests.py   -> PASS
6. node tests/ai_model_tests.js             -> PASS (Groq defaultModel, Qwen maxImages=3, deprecation metadata)
7. node tests/ai_visual_question_tests.js   -> PASS (Catalog metadata, 1,595 classifications, decision engine)
```
