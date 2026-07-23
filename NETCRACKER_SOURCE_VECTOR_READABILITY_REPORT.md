# NETCracker AI Source-Vector Readability — Final Reconciled Report

## 1. Authoritative Presentation Inventory

All 1,595 historical records were loaded across 10 year archives and classified by the runtime-equivalent presentation resolver. The counts below are mutually exclusive and sum to 1,595.

| Resolver Mode | Count |
|---|---|
| `native-text` | 1,227 |
| `native-text-with-stem-diagram` | 110 |
| `native-text-with-option-diagrams` | 74 |
| `native-stem-with-source-options` | 156 |
| `native-options-with-source-stem` | 0 |
| `semantic-table` | 0 |
| `source-vector-fallback` | 28 |
| **Total** | **1,595** |

### Additional Counts

| Metric | Count |
|---|---|
| Records with `sourceVectorSvgs` | 471 |
| Records with `transcriptionStatus: "vector-primary"` | 344 |
| Records with `needsTranscriptionReview: true` (data field) | 3 |

---

## 2. Hybrid Definition and Count

**Definition**: A *hybrid* record is one where the resolver mode is `native-stem-with-source-options` — the native stem text is complete but native option text is incomplete, and source-vector SVGs exist as a primary-fallback for option viewing.

**Authoritative hybrid total**: **156**

| Year | Hybrid Count |
|---|---|
| 2016 | 1 |
| 2019 | 70 |
| 2023 | 75 |
| 2024 | 10 |
| **Total** | **156** |

### Previous 152-vs-156 Discrepancy

The previous evidence value of `152` was computed during an earlier audit session before the `mergeQuestions` function was fixed to overwrite stale bundle entries with freshly-loaded year data. The authoritative runtime count, computed by loading all 10 year archives and running the resolver on all 1,595 records, is **156**.

---

## 3. Readability Accounting

| Metric | Count | Definition |
|---|---|---|
| `manual_review_required` | 3 | Records requiring human transcription review |
| `remaining_readability_failures` | 3 | Records still below the required readability threshold of 4 |
| `unassigned_readability_failures` | 0 | Below-threshold records not explicitly flagged or safely handled |
| `flagged_and_safely_fallback_presented` | 3 | Below-threshold native transcriptions that show a warning and a readable source fallback |

---

## 4. Three Flagged Records — Runtime Resolver State

All three records resolve to `native-stem-with-source-options` (not `source-vector-fallback`). The resolver's `sourceVectorRole` is `primary-fallback`, meaning the source viewer is the primary mechanism for reading the option choices. The native stem is shown (though it contains garbled OCR text), and a warning banner is displayed.

| Field | `29201002` | `29201005` | `29201006` |
|---|---|---|---|
| Resolver mode | `native-stem-with-source-options` | `native-stem-with-source-options` | `native-stem-with-source-options` |
| Source vector role | `primary-fallback` | `primary-fallback` | `primary-fallback` |
| `needsTranscriptionReview` (resolver) | `true` | `true` | `true` |
| `needsTranscriptionReview` (data) | `true` | `true` | `true` |
| Native stem shown | Yes | Yes | Yes |
| Warning shown | Yes | Yes | Yes |
| Source viewer shown | Yes | Yes | Yes |
| Options selectable | Yes | Yes | Yes |
| Ask AI behavior | Garbled OCR text sent; visual attachment recommended | Garbled OCR text sent; visual attachment recommended | Garbled OCR text sent; visual attachment recommended |

These three records are **not** `source-vector-fallback`; they are hybrid (`native-stem-with-source-options`) with a primary-fallback source viewer and a transcription-review warning.

---

## 5. Reported Question Correction

- **ID**: `official-2019-64635021744`
- **Options**: `["(a), (d) and (f)", "(d), (e) and (f)", "(a), (b) and (c)", "(b), (c) and (d)"]`
- **Resolver mode**: `native-text`
- **Readability**: 5/5

---

## 6. Test Suite Results

All automated tests passed:
- `python tools/validate_question_bank.py`: PASS (1,595 mapped, 1,572 scoreable)
- `python tests/validate.py`: PASS
- `node tests/runtime_smoke.js`: PASS
- `python tests/http_smoke.py`: PASS
- `python tests/audit_correction_tests.py`: PASS
- `node tests/ai_model_tests.js`: PASS
- `node tests/ai_visual_question_tests.js`: PASS
- `node tests/readability_regression_tests.js`: PASS (14 tests)

---

## Bounded Conclusion

The reported question is corrected and readable. The resolver covers all 1,595 records programmatically; the seven modes are mutually exclusive and sum correctly. Hybrid readability was sampled across 25 records (22 pass, 3 flagged). Three records remain below readability 4 but are explicitly flagged with `needsTranscriptionReview: true`, display a warning banner, and provide a readable source-vector fallback viewer. Zero below-threshold records are unassigned.
