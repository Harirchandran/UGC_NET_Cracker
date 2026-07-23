# NETCracker AI Model Selection Report

## 1. Starting Git state

- Branch: `main`
- Starting HEAD: `68cb01ee2d00ab8b73b537646bf27acfc0d3a4fd`
- Working tree after baseline: clean
- Upstream: `origin/main`

## 2. Current AI architecture

Before this change, the settings screen had:
- A provider selector with 4 options: Google Gemini, OpenAI, Groq, Custom
- A plain text model input (no dropdown, no model catalog)
- A custom base URL field (shown for all providers)
- Key validation via a test generation request only

The "Groq" provider was GroqCloud (API at `api.groq.com/openai/v1`), not xAI Grok.

No model catalog existed. Model IDs were scattered across event handlers and default state.

## 3. Files changed

| File | Change |
|------|--------|
| `data/ai-model-catalog.js` | **New** — authoritative model catalog |
| `index.html` | Added script include for catalog |
| `sw.js` | Added catalog to application-shell cache |
| `app.js` | Provider-aware model UI, discovery, validation, per-provider memory |
| `docs/AI_PROVIDERS_AND_MODELS.md` | **New** — provider/model documentation |
| `README.md` | Updated AI features description |
| `docs/QUESTION_DATA_CONTRACT.md` | Added note about model catalog |
| `tests/ai_model_tests.js` | **New** — focused model catalog tests |

## 4. Final provider catalog

5 providers with stable internal IDs: `gemini`, `openai`, `xai`, `groq`, `custom`.

Migration: Old saved provider values remain intact. The old default model `gemini-2.0-flash` is migrated to `gemini-3.6-flash`. Per-provider model memory is initialized from existing state.

## 5. Curated model IDs

- **Gemini**: `gemini-3.6-flash` (recommended), `gemini-3.5-flash`, `gemini-3.5-flash-lite`
- **OpenAI**: `gpt-5.6-terra` (recommended), `gpt-5.6-sol`, `gpt-5.6-luna`
- **xAI Grok**: `grok-4.5` (recommended), `grok-4.5-latest`
- **GroqCloud**: `llama-3.3-70b-versatile` (recommended), `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `llama-3.1-8b-instant`
- **Custom**: No curated models; supports manual model ID.

## 6. Provider-specific endpoints

| Provider | Discovery endpoint | Auth method |
|----------|-------------------|-------------|
| Gemini | `GET /v1beta/models` | `x-goog-api-key` header |
| OpenAI | `GET /v1/models` | `Authorization: Bearer` |
| xAI | `GET /v1/models` | `Authorization: Bearer` |
| GroqCloud | `GET /openai/v1/models` | `Authorization: Bearer` |
| Custom | `{baseUrl}/models` | `Authorization: Bearer` |

## 7. Model discovery implementation

- `discoverModelsForProvider(providerId, key)` in `app.js`
- Uses `AbortSignal.timeout(8000)` for 8-second timeout
- Provider-specific exclusion lists for irrelevant model types
- Gemini uses `supportedGenerationMethods` capability filtering
- Gemini `models/` prefix is stripped from returned model names

## 8. Filtering and merge behavior

- Curated models appear under "Recommended" and "Built-in alternatives" groups
- Discovered models not in the curated list appear under "Available to your API key"
- Duplicates between curated and discovered lists are resolved (curated wins)
- Models are excluded based on provider-specific prefix lists (embedding, TTS, Whisper, etc.)

## 9. Key-validation behavior

- Validation sequence: enter key → attempt model discovery → send minimal test prompt → confirm
- Failure modes handled: invalid key, model unavailable, rate limit, offline, CORS, timeout
- Key is never placed in URL query strings (Gemini uses `x-goog-api-key` header)
- Key is never logged to console or included in backup export

## 10. Offline behavior

- Model catalog is included in service-worker shell cache
- Provider and model selectors work offline from cached catalog
- AI remains locked without a validated key
- All non-AI features (syllabus, practice, mocks, revision, analytics, backup) remain functional
- No repeated failing network request loop

## 11. Security verification

- Keys stored in `sessionStorage` by default; `localStorage` only when "Remember key" checked
- "Forget key" clears both storage locations and discovered model cache
- Keys sent only to selected official provider endpoints or explicit custom base URL
- Gemini key sent via `x-goog-api-key` header (not query parameter)
- Error messages do not expose keys
- Backup export does not include keys

## 12. Focused test results

`tests/ai_model_tests.js`: All 25+ assertions pass covering catalog structure, provider IDs, model IDs, defaults, endpoints, and xAI reasoning options.

## 13. Full regression results

- `node tests/runtime_smoke.js`: PASS
- `python tests/validate.py`: PASS
- `python tests/http_smoke.py`: PASS
- `python tests/audit_correction_tests.py`: PASS

## 14. Browser results

Not tested with real Chrome during development (no browser automation framework available in this environment). The code has been manually verified through console-based testing.

## 15. Remaining limitations

- Live provider key validation requires real API keys not available for automated testing
- xAI and GroqCloud endpoints may have CORS restrictions when served from `file://`
- Model discovery relies on provider model endpoints returning complete data
- Custom provider discovery may fail if the endpoint does not support `/models`
- No browser-automation test suite set up for this project
- Some provider responses may include models that are text-generation-capable but not identifiable as such from metadata

## 16. Final recommendation

The provider-aware model selection system is complete and integrated. The application now supports five separate providers with curated presets, per-provider model memory, dynamic discovery, custom model IDs, safe fallback behavior, and offline-capable model browsing. All existing regression tests pass.
