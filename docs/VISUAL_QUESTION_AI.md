# Visual Question AI Subsystem Specification

## Overview

NETCracker AI provides a capability-aware Ask AI experience for text and visual questions. The application never silently omits essential visual information when sending a question to an AI model, nor does it allow a text-only model to guess from incomplete text without warning the student.

## 1. Visual Question Classification

Every question (1,595 mapped PYQs + practice items) resolves to standard visual metadata defined via derived classification and overrides (`data/ai-visual-question-overrides.js`):

```json
{
  "visualRequirement": "none | supplementary | essential",
  "visualTypes": ["stem-svg", "option-svg", "source-vector", "html-table"],
  "textFallbackQuality": "complete | partial | insufficient",
  "aiVisualCaptureRequired": false,
  "semanticVisualDescription": null
}
```

### Classification Rules

1. **Text-only questions (`visualRequirement: "none"`)**: No diagram, option SVG, source vector, or table. Sent as structured text.
2. **Supplementary visual questions (`visualRequirement: "supplementary"`)**: Question text and option text are full and self-contained. The diagram or source vector provides optional confirmation.
3. **Essential visual questions (`visualRequirement: "essential"`)**: Stem depends on diagram/graph/automaton/circuit, option SVGs are present, or source vector is authoritative (`vector-primary`).

## 2. Model Capabilities & Compatibility

Models are cataloged in `data/ai-model-catalog.js` with capability fields:

- `inputModalities`: `["text"]` or `["text", "image"]`
- `visionSupport`: `"verified"` | `"unsupported"` | `"unknown"`
- `visualQuestionSupport`: `true` | `false`
- `supportedImageTypes`: `["image/png", "image/jpeg"]`

### Verified Curated Models

- **Google Gemini**: `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.5-flash-lite` (Inline PNG)
- **OpenAI**: `gpt-5.6-terra`, `gpt-5.6-sol`, `gpt-5.6-luna` (OpenAI `image_url`)
- **xAI Grok**: `grok-4.5`, `grok-4.5-latest` (OpenAI `image_url`, `store: false`)
- **GroqCloud**: `qwen/qwen3.6-27b` (Qwen 3.6 27B Vision, Preview, max 5 images, max 20MB)

### Text-Only Groq Models

`llama-3.3-70b-versatile`, `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `llama-3.1-8b-instant` are marked `visionSupport: "unsupported"`. Image payloads are blocked from reaching text-only Groq models, preventing provider API errors.

### Discovered & Custom Models

Discovered models use priority order:
1. Curated catalog match
2. Provider modality metadata (`supportedGenerationMethods`, `input_modalities`)
3. Local capability test result
4. Provider alias mapping
5. `visionSupport: "unknown"`

Unknown models display `Vision unverified` and offer an in-app visual capability test.

## 3. Question-Sheet PNG Renderer

The browser-local renderer (`renderQuestionSheetToPNG`) converts the displayed question into a clean PNG image URL in memory:

- Renders: Exam year, Paper, Question Number, Question ID, Passage, Question Text, Stem SVG, Option labels A/B/C/D, Option SVGs, Tables, Source Vectors.
- Excludes: Official correct answer, student score, explanation, API keys, navigation UI.
- Resolution: 800px width, high-contrast white background (`#ffffff`), dark text (`#0f172a`).
- Memory hygiene: In-memory Canvas/Blob generation; Object URLs are revoked immediately after request creation; images are never stored in localStorage, IndexedDB, or SW cache.

## 4. Ask AI Decision Engine

`decideVisualAIRequest(question, providerId, modelId, userIntent)` returns typed instructions:

- `send-text-only`: Text questions or supplementary text intent.
- `send-text-and-image`: Essential or supplementary visual with verified vision model.
- `offer-text-fallback`: Essential visual + unsupported model + complete text fallback.
- `require-model-switch`: Essential visual + unsupported model + partial/insufficient fallback.
- `require-capability-test`: Unknown vision capability.

## 5. Answer-Key Privacy & Assistance Modes

- **Hint mode**: Omits official answer key from prompt.
- **Concept mode**: Omits official answer key from prompt.
- **Why my answer was wrong mode**: Includes student choice & official answer only when submitted/revealed.
- **Explain official answer mode**: Includes official answer explicitly.
- **Independent solution mode**: Model solves question independently. Response is compared with official answer key on client side (`AI answer agrees with official key` vs `AI answer differs from official key`).

## 6. Privacy & Security Controls

- **Consent**: First visual request to a provider displays privacy consent modal. Consent is stored per provider/custom base URL.
- **No storage leakage**: API keys never enter generated images or error tracebacks. Temporary blobs are destroyed after memory transmission.

## 7. Offline & Failure Behavior

- Offline: AI request execution is disabled with clear user notice. Question presentation and question-sheet preview remain operational offline.
- Failures: Provider timeouts, quota errors, or CORS issues present actionable error toasts without corrupting test timer, student answers, or progress.

## 8. Updating Capability Mappings

- To add visual metadata to future questions: Edit `data/ai-visual-question-overrides.js` or attach properties in year archive files.
- To update model capabilities: Edit `data/ai-model-catalog.js` and bump `catalogVersion`. Run `node tests/ai_visual_question_tests.js` to validate.
