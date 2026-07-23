# NETCracker question data contract

Schema version: **1.0**

The canonical schema is `data/question-schema.json`. Runtime year archives are published as `data/interactive-pyqs-YYYY.js`; the reviewed staging input is ordinary JSON.

The AI model catalog (`data/ai-model-catalog.js`) is a separate static data file that defines supported providers, their API endpoints, and curated model presets. It is not part of the question data schema.

## Required provenance

Every record must identify:

- `id`: stable internal ID, never reused.
- `year`: examination year used by filters.
- `examCycle`: exact examination cycle or shift description.
- `paper`: normalized current paper (`1` or `2`).
- `legacyPaper`: historical Paper II/III identity when applicable.
- `questionNumber`: official displayed question number.
- `questionId`: official provider/NTA question ID when available.
- `source`: human-readable source description.
- `sourceUrl`: official source or archive URL.
- `sourcePage`: source page when a dependable page reference exists.

## Question content

- `question` is the readable stem.
- `passage` stores shared comprehension, table or case-study context.
- `options` always contains exactly four strings in official A–D order.
- `stemVectorSvg` stores a required stem diagram.
- `optionVectorSvgs` contains exactly four safe SVG strings when options are diagrams.
- `optionAlt` contains exactly four meaningful descriptions for diagram options.
- `sourceVectorSvgs` can preserve exact vector glyphs where text conversion might alter meaning.

The browser renders text and SVG together. It does not render PDF pages, PNG/JPEG screenshots, embedded base64 images, scripts or external SVG resources.

## Answer mapping

- `answer` is a zero-based option index: A=0, B=1, C=2, D=3.
- `answers` is used when an official final key accepts multiple options.
- `dropped: true` marks an officially dropped item.
- `scored: false` prevents an item from entering scored practice or mocks.
- `answerVerification` states exactly how the final answer was mapped.
- `answerKeyMapped` distinguishes answer-key mapping from content transcription.

## Content verification

Answer verification and content verification are independent.

- `transcriptionStatus` describes the representation method.
- `transcriptionConfidence` is a numeric confidence from 0 to 1.
- `contentVerification` records the review level.
- `reviewNotes` records discrepancies, manual reconstruction or reviewer details.

Recommended publication statuses:

- `verified-text`
- `verified-semantic-svg`
- `verified-text-formula-reconstruction`
- `vector-primary`
- `vector-options-primary`
- `machine-transcribed-reviewed-structure`

A mapped answer does not by itself make a transcription verified.

## SVG safety

The validator rejects:

- `<image>` and raster-bearing data URLs
- `<script>`
- `foreignObject`
- inline event handlers
- `javascript:` URLs

## Raster and external dependency safety

The validator rejects raster, SVG, PDF, or external content dependencies in all text and presentation fields (`question`, `passage`, `explanation`, `options`, `sharedContext`, `topic`, `reviewNotes`, `source`, `answerVerification`, `importMethod`, `contentVerification`).

Rejected patterns:

- `<img>`, `<picture>`, `<source>`, `<object>`, `<embed>`, or `<iframe>` tags with `src`, `srcset`, `href`, or `data` attributes referencing `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.bmp`, `.tiff`, `.pdf`, or `.svg` files
- `<iframe>` with any `src` attribute (always an external content dependency)
- `data:image/` embedded base64 raster URLs
- CSS `url()` references to raster, PDF, or SVG assets
- `src` or `href` attributes referencing raster, PDF, or SVG files
- Extraction delimiters such as `-o0o-` in option text

Not rejected (educational text mentions are permitted):

- "PNG uses lossless compression."
- "Which statement about JPEG is correct?"
- "SVG files are scalable vector graphics."
- The `<img>` tag is used in HTML.
- A harmless textual URL (e.g. `https://example.com/`) shown as question content
- Safe mathematical or HTML table content

Prefer semantic SVG with text labels, lines, paths, shapes and accessible `optionAlt` descriptions.
