# AI Providers and Models

## Grok versus Groq

- **xAI Grok** (`xai`): Models by xAI (e.g. Grok 4.5). API at `https://api.x.ai/v1`. Supports text and multimodal image input.
- **GroqCloud** (`groq`): Cloud inference provider offering open-weight models (Llama, GPT-OSS, Qwen Vision). API at `https://api.groq.com/openai/v1`.

These are separate providers in the selector.

## Built-in model catalog

File: `data/ai-model-catalog.js`

Contains:

- `catalogVersion` — Semver for the catalog (`1.1.0`)
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
| `tier` | Quality/cost/vision tier |
| `recommended` | Boolean, exactly one per provider |
| `stability` | `stable`, `alias`, or `preview` |
| `description` | Student-facing description |
| `taskTags` | Recommended task types |
| `reasoningOptions` | Supported reasoning levels (xAI only) |
| `inputModalities` | Supported input modalities (`["text"]` or `["text", "image"]`) |
| `outputModalities` | Supported output modalities (`["text"]`) |
| `visionSupport` | Vision support status (`verified`, `unsupported`, `unknown`) |
| `visualQuestionSupport` | Boolean indicating capability for diagram analysis |
| `supportedImageTypes` | Array of MIME types (`["image/png", "image/jpeg"]`) |
| `maxImages` | Maximum allowed image inputs (e.g. 5 for Qwen) |
| `maxImageBytes` | Maximum image size in bytes (e.g. 20MB for Qwen) |
| `capabilitySource` | Source of capability proof (`curated-official`, `provider-discovery`, `student-tested`, `custom-declared`, `unknown`) |

## Curated visual capability overview

| Provider | Model | Vision Support | Max Images | Note |
|----------|-------|----------------|------------|------|
| Google Gemini | `gemini-3.6-flash` | Verified | Unlimited | Recommended default |
| Google Gemini | `gemini-3.5-flash` | Verified | Unlimited | High quality |
| Google Gemini | `gemini-3.5-flash-lite` | Verified | Unlimited | Economy vision |
| OpenAI | `gpt-5.6-terra` | Verified | Unlimited | Recommended default |
| OpenAI | `gpt-5.6-sol` | Verified | Unlimited | Maximum quality |
| OpenAI | `gpt-5.6-luna` | Verified | Unlimited | Fast economy |
| xAI Grok | `grok-4.5` | Verified | Unlimited | Recommended default |
| xAI Grok | `grok-4.5-latest` | Verified | Unlimited | Rolling alias |
| GroqCloud | `llama-3.3-70b-versatile` | Unsupported | 0 | Text-only default |
| GroqCloud | `qwen/qwen3.6-27b` | Verified | 5 | Preview Vision Model |
| GroqCloud | `openai/gpt-oss-120b` | Unsupported | 0 | Text-only |
| GroqCloud | `openai/gpt-oss-20b` | Unsupported | 0 | Text-only |
| GroqCloud | `llama-3.1-8b-instant` | Unsupported | 0 | Text-only |
| Custom | User-configured | Unknown / Custom | Configurable | Requires validation / declaration |

## Provider endpoints & multimodal formats

| Provider | Base URL | Auth | Multimodal Format |
|----------|----------|------|-------------------|
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta` | `x-goog-api-key` header | `inlineData` parts in `generateContent` |
| OpenAI | `https://api.openai.com/v1` | `Authorization: Bearer <key>` | `image_url` items in `chat/completions` |
| xAI Grok | `https://api.x.ai/v1` | `Authorization: Bearer <key>` | `image_url` items in `chat/completions` with `store: false` |
| GroqCloud | `https://api.groq.com/openai/v1` | `Authorization: Bearer <key>` | `image_url` items in `chat/completions` for vision models |
| Custom | User-configured | `Authorization: Bearer <key>` | Configured (`openai-chat` or `openai-responses`) |

## Dynamic model discovery

After entering a key, click "Validate key and load available models" or "Discover models from key".

Each provider's discovery endpoint:

- Gemini: `GET /models` (filtered by `supportedGenerationMethods` containing `generateContent`)
- OpenAI: `GET /v1/models` (excludes embedding, TTS, Whisper, DALL-E, moderation, audio models)
- xAI: `GET /v1/models` (excludes embedding, image, video, audio, moderation models)
- GroqCloud: `GET /openai/v1/models` (excludes Whisper, embedding, guard, speech, image, moderation models)
- Custom: `{baseUrl}/models` (no filtering)

Model capabilities for discovered models are checked in this order:
1. Exact curated catalog match
2. Provider response explicit modality metadata (`input_modalities`, `supportedGenerationMethods`)
3. Previously successful local capability test
4. Provider-specific known mapping
5. Unknown (`visionSupport: "unknown"`)

Name strings containing "vision" or "image" are used only as UI hints, never as authoritative capability proof.

## Key storage

- Keys are stored in `sessionStorage` by default (cleared when browser tab closes).
- Check "Remember key on this device" to persist in `localStorage`.
- Click "Forget key" to clear both.
- Keys are never included in backup exports, question sheet images, or error messages.
- Keys are never placed in URLs (Gemini uses the `x-goog-api-key` header, not query parameter).

## Offline limitations

When offline:

- Provider and model selectors work from the cached catalog.
- AI request execution is disabled with clear user notice: "AI analysis requires internet access. The question, diagram and all offline study tools remain available."
- Question sheet rendering and sheet preview remain operational locally.
- All question-bank, syllabus, practice, mock, revision, and analytics features remain functional.
- No repeated failing network requests occur.
