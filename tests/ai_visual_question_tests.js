'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

function buildTestContext() {
  const localStore = new Map(), sessionStore = new Map();
  const storage = m => ({
    getItem: k => m.has(k) ? m.get(k) : null,
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k)
  });

  const elements = new Map();
  function el(overrides) {
    return Object.assign({
      classList: { add(){}, remove(){}, toggle(){}, contains(){return false;} },
      style: {}, dataset: {}, hidden: false, value: '', checked: false,
      textContent: '', innerHTML: '', onclick: null, onchange: null, oninput: null,
      disabled: false, focus(){}, setAttribute(){}, getAttribute(){return null;}
    }, overrides || {});
  }

  const document = {
    documentElement: el(),
    head: el(),
    body: el(),
    querySelector(sel) { if (!elements.has(sel)) elements.set(sel, el()); return elements.get(sel); },
    querySelectorAll() { return []; },
    createElement(t) { return el(); },
    addEventListener() {}
  };

  const w = {
    document,
    location: { hash: '#settings', protocol: 'http:' },
    addEventListener() {},
    matchMedia() { return { matches: false }; },
    crypto: { randomUUID: () => 'test-uuid-123' },
    URLSearchParams,
    Blob: class Blob { constructor(parts, opts) { this.parts = parts; this.opts = opts; } },
    URL: { createObjectURL: () => 'blob:http://localhost/test', revokeObjectURL: () => {} },
    Image: class Image { constructor() { setTimeout(() => { if (this.onload) this.onload(); }, 5); } }
  };

  const env = {
    window: w,
    document,
    location: w.location,
    navigator: { onLine: true },
    localStorage: storage(localStore),
    sessionStorage: storage(sessionStore),
    matchMedia: w.matchMedia,
    URLSearchParams,
    Date, Math, JSON, Array, String, Number, Boolean, RegExp, Set, Map, Error, Promise,
    console,
    setTimeout, clearTimeout, setInterval, clearInterval,
    confirm: () => true,
    crypto: w.crypto,
    fetch: async () => { throw new Error('Fetch not mocked'); },
    Blob: w.Blob,
    URL: w.URL,
    Image: w.Image
  };

  env.globalThis = env;
  vm.createContext(env);

  // Load scripts in order
  vm.runInContext(fs.readFileSync(ROOT + '/data/ai-model-catalog.js', 'utf8'), env);
  vm.runInContext(fs.readFileSync(ROOT + '/data/ai-visual-question-overrides.js', 'utf8'), env);
  vm.runInContext(fs.readFileSync(ROOT + '/data/bundle.js', 'utf8'), env);
  vm.runInContext(fs.readFileSync(ROOT + '/data/pyq-index.js', 'utf8'), env);

  const yearFiles = fs.readdirSync(ROOT + '/data').filter(f => f.startsWith('interactive-pyqs-'));
  for (const f of yearFiles) {
    vm.runInContext(fs.readFileSync(ROOT + '/data/' + f, 'utf8'), env);
  }

  vm.runInContext(fs.readFileSync(ROOT + '/app.js', 'utf8'), env);

  return env;
}

const ctx = buildTestContext();
const ERRORS = [];

function assert(cond, msg) {
  if (!cond) ERRORS.push(msg);
}

console.log('=== VISUAL QUESTION AI TEST SUITE ===');

// 1. Catalog capability metadata verification
const CAT = ctx.window.NETCRACKER_AI_MODEL_CATALOG;
assert(CAT.catalogVersion === '1.1.0', 'Catalog version should be 1.1.0');

const gemini = CAT.providers.find(p => p.providerId === 'gemini');
for (const m of gemini.models) {
  assert(m.visionSupport === 'verified', `Gemini model ${m.id} visionSupport should be verified`);
  assert(m.visualQuestionSupport === true, `Gemini model ${m.id} visualQuestionSupport should be true`);
}

const openai = CAT.providers.find(p => p.providerId === 'openai');
for (const m of openai.models) {
  assert(m.visionSupport === 'verified', `OpenAI model ${m.id} visionSupport should be verified`);
  assert(m.visualQuestionSupport === true, `OpenAI model ${m.id} visualQuestionSupport should be true`);
}

const xai = CAT.providers.find(p => p.providerId === 'xai');
for (const m of xai.models) {
  assert(m.visionSupport === 'verified', `xAI model ${m.id} visionSupport should be verified`);
  assert(m.visualQuestionSupport === true, `xAI model ${m.id} visualQuestionSupport should be true`);
}

const groq = CAT.providers.find(p => p.providerId === 'groq');
const qwen = groq.models.find(m => m.id === 'qwen/qwen3.6-27b');
assert(Boolean(qwen), 'Groq must contain qwen/qwen3.6-27b');
assert(qwen.visionSupport === 'verified', 'Qwen 3.6 27B Vision must be visionSupport: verified');
assert(qwen.stability === 'preview', 'Qwen 3.6 27B Vision stability must be preview');
assert(qwen.maxImages === 3, 'Qwen 3.6 27B Vision maxImages must be 3');

const groqTextModels = groq.models.filter(m => m.id !== 'qwen/qwen3.6-27b');
for (const m of groqTextModels) {
  assert(m.visionSupport === 'unsupported', `Groq text model ${m.id} visionSupport must be unsupported`);
  assert(m.visualQuestionSupport === false, `Groq text model ${m.id} visualQuestionSupport must be false`);
}

console.log('✓ Model catalog capability metadata verified');

// 2. All 1,595 question classification audit
const pyqIndex = JSON.parse(fs.readFileSync(ROOT + '/data/pyq-index.json', 'utf8'));
let allPYQs = [];
for (const year of Object.keys(pyqIndex.years || {})) {
  const file = pyqIndex.years[year].file;
  const content = fs.readFileSync(ROOT + '/' + file, 'utf8');
  const match = content.match(/window\.NETCRACKER_INTERACTIVE_PYQS_\d+\s*=\s*(\{[\s\S]*\});?/);
  if (match) {
    const data = Function('return ' + match[1])();
    if (data && data.questions) allPYQs.push(...data.questions);
  }
}

assert(allPYQs.length === 1595, `Expected 1595 PYQs, got ${allPYQs.length}`);

const reqCounts = { none: 0, supplementary: 0, essential: 0 };
const fallbackCounts = { complete: 0, partial: 0, insufficient: 0 };

for (const q of allPYQs) {
  const c = ctx.window.classifyVisualQuestion(q);
  assert(c && c.visualRequirement, `Question ${q.id} missing visualRequirement`);
  assert(c && c.textFallbackQuality, `Question ${q.id} missing textFallbackQuality`);
  reqCounts[c.visualRequirement]++;
  fallbackCounts[c.textFallbackQuality]++;
}

assert(reqCounts.none === 912, `Expected 912 none, got ${reqCounts.none}`);
assert(reqCounts.supplementary === 315, `Expected 315 supplementary, got ${reqCounts.supplementary}`);
assert(reqCounts.essential === 368, `Expected 368 essential, got ${reqCounts.essential}`);

console.log('✓ 1,595 Questions classified successfully:', { reqCounts, fallbackCounts });

// 3. Decision Engine Branch Tests
const textOnlyQ = allPYQs.find(q => ctx.window.classifyVisualQuestion(q).visualRequirement === 'none');
const essentialQ = allPYQs.find(q => ctx.window.classifyVisualQuestion(q).visualRequirement === 'essential');

let d1 = ctx.window.decideVisualAIRequest(textOnlyQ, 'gemini', 'gemini-3.6-flash');
assert(d1.action === 'send-text-only', 'Text-only question should give send-text-only');

let d2 = ctx.window.decideVisualAIRequest(essentialQ, 'gemini', 'gemini-3.6-flash');
assert(d2.action === 'send-text-and-image', 'Essential visual + Gemini 3.6 Flash should give send-text-and-image');

let d3 = ctx.window.decideVisualAIRequest(essentialQ, 'groq', 'llama-3.3-70b-versatile');
assert(d3.action === 'require-model-switch' || d3.action === 'offer-text-fallback', 'Essential visual + Groq text model should require model switch or fallback offer');

let d4 = ctx.window.decideVisualAIRequest(essentialQ, 'groq', 'qwen/qwen3.6-27b');
assert(d4.action === 'send-text-and-image', 'Essential visual + Qwen Vision should give send-text-and-image');

console.log('✓ Ask AI decision engine branches verified');

// 4. Renderer test
ctx.window.renderQuestionSheetToPNG(essentialQ).then(sheet => {
  assert(sheet.width === 800, 'Renderer width should be 800');
  assert(sheet.height > 0, 'Renderer height should be > 0');
  assert(sheet.byteSize > 0, 'Renderer byteSize should be > 0');
  console.log('✓ Question sheet renderer test passed:', { width: sheet.width, height: sheet.height, bytes: sheet.byteSize });

  console.log('=== VISUAL QUESTION AI SUITE PASSED ===');
  if (ERRORS.length) {
    console.error('Errors:', ERRORS);
    process.exit(1);
  }
}).catch(e => {
  ERRORS.push('Renderer error: ' + e.message);
  console.error('Errors:', ERRORS);
  process.exit(1);
});
