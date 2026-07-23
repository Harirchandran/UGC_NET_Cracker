# AI Providers and Models

## Grok versus Groq

- **xAI Grok** (`xai`): Models by xAI (e.g. Grok 4.5). API at `https://api.x.ai/v1`.
- **GroqCloud** (`groq`): Cloud inference provider offering open-weight models (Llama, GPT-OSS). API at `https://api.groq.com/openai/v1`.

These are separate providers in the selector.

## Built-in model catalog

File: `data/ai-model-catalog.js`

Contains:

- `catalogVersion` — Semver for the catalog
- `officiallyCheckedDate` — Last verification date: `2026-07-23`
- `providers` — Array of provider objects

Each provider object has:

| Field | Description |
|-------|-------------|
| `providerId` | Stable internal ID (`gemini`, `openai`, `xai`, `groq`, `custom`) |
| `label` | Display name |
| `apiFamily` | `gemini` or `openai` |
| `baseUrl` | Default API base URL |
| `modelsEndpoint` | Path for model discovery |
| `defaultModel` | Default model ID |
| `discoveryConfig` | Auth header, prefix stripping, capability filtering |
| `models` | Array of curated model objects |

Each model object has:

| Field | Description |
|-------|-------------|
| `id` | Technical model ID |
| `label` | Human-readable name |
| `tier` | Quality/cost tier |
| `recommended` | Boolean, exactly one per provider |
| `stability` | `stable`, `alias`, or `preview` |
| `description` | Student-facing description |
| `taskTags` | Recommended task types |
| `reasoningOptions` | Supported reasoning levels (xAI only) |

## Provider endpoints

| Provider | Base URL | Auth |
|----------|----------|------|
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta` | `x-goog-api-key` header |
| OpenAI | `https://api.openai.com/v1` | `Authorization: Bearer <key>` |
| xAI Grok | `https://api.x.ai/v1` | `Authorization: Bearer <key>` |
| GroqCloud | `https://api.groq.com/openai/v1` | `Authorization: Bearer <key>` |
| Custom | User-configured | `Authorization: Bearer <key>` |

## Dynamic model discovery

After entering a key, click "Validate key and load available models" or "Discover models from key".

Each provider's discovery endpoint:

- Gemini: `GET /models` (filtered by `supportedGenerationMethods` containing `generateContent`)
- OpenAI: `GET /v1/models` (excludes embedding, TTS, Whisper, DALL-E, moderation, audio models)
- xAI: `GET /v1/models` (excludes embedding, image, video, audio, moderation models)
- GroqCloud: `GET /openai/v1/models` (excludes Whisper, embedding, guard, speech, image, moderation models)
- Custom: `{baseUrl}/models` (no filtering)

The Gemini `models/` prefix is stripped from returned IDs.

## Custom model IDs

Select "Custom model ID…" from the model dropdown to enter any model ID manually. This is always available for the Custom OpenAI-compatible provider. For other providers, it is available when the saved model is not in the curated list.

## Key storage

- Keys are stored in `sessionStorage` by default (cleared when browser tab closes).
- Check "Remember key on this device" to persist in `localStorage`.
- Click "Forget key" to clear both.
- Keys are never included in backup exports or error messages.
- Keys are never placed in URLs (Gemini uses the `x-goog-api-key` header, not query parameter).

## Offline limitations

When offline:

- Provider and model selectors work from the cached catalog.
- AI remains locked (no validation possible).
- All question-bank, syllabus, practice, mock, revision, and analytics features remain functional.
- No repeated failing network requests occur.
- The app displays: "AI requires internet and a valid provider API key."

## CORS limitations

Browser CORS restrictions may prevent model discovery from some custom endpoints or from xAI endpoints when the page is served from `file://`. For best results, serve the app via `localhost` or HTTPS.

## Model availability

Curated models may not be available to every API key. Model discovery checks each provider's models endpoint to determine which curated models are currently accessible. Models not returned by the discovery endpoint are marked as "Not available to this key."

## Updating the curated catalog

To add or update models:

1. Edit `data/ai-model-catalog.js`
2. Update `officiallyCheckedDate` to the current date
3. Bump `catalogVersion` if the structure changes
4. Ensure exactly one `recommended: true` per non-custom provider
5. Run `node tests/ai_model_tests.js` to validate
6. Run `node tests/runtime_smoke.js` and `python tests/validate.py` for regression

## Why prices are not hardcoded

Provider pricing changes frequently. Hardcoding prices would require constant catalog updates and risk showing stale information. The tier field (`Economy`, `Balanced`, `Quality`, `Fast`) provides relative guidance without specific prices.
