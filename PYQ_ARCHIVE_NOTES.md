# PYQ archive implementation

Runtime records are loaded lazily from `data/interactive-pyqs-YYYY.js` and discovered through `data/pyq-index.json`.

Every question contains structured provenance, four ordered options, answer-key status, independent content-verification status and one of:

1. dependable native/structured text;
2. text plus exact inline source-vector verification;
3. semantic stem SVG;
4. four semantic option SVGs with accessible descriptions.

The safety policy rejects scripts, event handlers, embedded images, raster data URLs and `foreignObject`. No question requires a PDF or page screenshot.

The **Question bank** interface allows year/paper/status/visual filtering, search, answer reveal and filtered-test creation. Full metadata remains visible during browsing, testing and review.
