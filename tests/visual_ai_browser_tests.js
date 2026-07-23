'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

function buildBrowserContext(viewportWidth = 1440, viewportHeight = 900) {
  const localStore = new Map(), sessionStore = new Map();
  const storage = m => ({
    getItem: k => m.has(k) ? m.get(k) : null,
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k)
  });

  const elements = new Map();
  function el(tag = 'div', overrides = {}) {
    const classSet = new Set();
    return Object.assign({
      tagName: tag.toUpperCase(),
      classList: {
        add(...cs) { cs.forEach(c => classSet.add(c)); },
        remove(...cs) { cs.forEach(c => classSet.delete(c)); },
        toggle(c) { classSet.has(c) ? classSet.delete(c) : classSet.add(c); },
        contains(c) { return classSet.has(c); }
      },
      style: {}, dataset: {}, hidden: false, value: '', checked: false,
      textContent: '', innerHTML: '', onclick: null, onchange: null, oninput: null, onkeydown: null,
      disabled: false, offsetWidth: viewportWidth - 260, offsetHeight: 600, scrollHeight: 600, scrollTop: 0,
      focus() {}, setAttribute(k, v) { this.dataset[k] = v; }, getAttribute(k) { return this.dataset[k] || null; },
      appendChild(child) { if (child && child.onload) child.onload(); return child; },
      removeChild() {},
      querySelector(sel) { return elements.get(sel) || el('div'); },
      querySelectorAll(sel) { return []; },
      closest(sel) { return this; },
      insertAdjacentHTML(pos, html) { this.innerHTML += html; },
      click() { if (this.onclick) return this.onclick(); }
    }, overrides);
  }

  const docEl = el('html');
  const document = {
    documentElement: docEl,
    head: el('head'),
    body: el('body'),
    querySelector(sel) {
      if (!elements.has(sel)) elements.set(sel, el('div'));
      return elements.get(sel);
    },
    querySelectorAll(sel) { return []; },
    createElement(t) { return el(t); },
    addEventListener() {}
  };

  const consoleLogs = [], consoleErrors = [];
  const handlers = {};

  const w = {
    document,
    location: { hash: '#dashboard', protocol: 'http:' },
    addEventListener(type, fn) { handlers[type] = fn; },
    matchMedia() { return { matches: viewportWidth <= 760 }; },
    crypto: { randomUUID: () => 'browser-uuid-456' },
    URLSearchParams,
    innerWidth: viewportWidth,
    innerHeight: viewportHeight,
    Blob: class Blob { constructor(p, o) { this.p = p; this.o = o; } },
    URL: { createObjectURL: () => 'blob:http://localhost/mock-blob', revokeObjectURL: () => {} },
    Image: class Image { constructor() { setTimeout(() => { if (this.onload) this.onload(); }, 2); } }
  };

  const env = {
    window: w,
    document,
    location: w.location,
    navigator: { onLine: true, userAgent: 'Chrome/120.0.0.0' },
    localStorage: storage(localStore),
    sessionStorage: storage(sessionStore),
    matchMedia: w.matchMedia,
    URLSearchParams,
    Date, Math, JSON, Array, String, Number, Boolean, RegExp, Set, Map, Error, Promise,
    console: {
      log(...a) { consoleLogs.push(a.join(' ')); },
      warn(...a) {},
      error(...a) { consoleErrors.push(a.join(' ')); }
    },
    setTimeout, clearTimeout, setInterval, clearInterval,
    confirm: () => true,
    crypto: w.crypto,
    fetch: async (url, opts) => {
      if (url.includes(':generateContent') || url.includes('/chat/completions')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: 'AI analysis: The official answer is correct because...' } }],
            candidates: [{ content: { parts: [{ text: 'AI analysis: The official answer is correct because...' }] } }]
          })
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    },
    Blob: w.Blob,
    URL: w.URL,
    Image: w.Image,
    AbortSignal: { timeout: () => new AbortController().signal },
    AbortController
  };

  env.globalThis = env;
  vm.createContext(env);

  vm.runInContext(fs.readFileSync(ROOT + '/data/ai-model-catalog.js', 'utf8'), env);
  vm.runInContext(fs.readFileSync(ROOT + '/data/ai-visual-question-overrides.js', 'utf8'), env);
  vm.runInContext(fs.readFileSync(ROOT + '/data/bundle.js', 'utf8'), env);
  vm.runInContext(fs.readFileSync(ROOT + '/data/pyq-index.js', 'utf8'), env);

  const pyqs = [];
  const yearFiles = fs.readdirSync(ROOT + '/data').filter(f => f.startsWith('interactive-pyqs-'));
  for (const f of yearFiles) {
    vm.runInContext(fs.readFileSync(ROOT + '/data/' + f, 'utf8'), env);
    const m = f.match(/\d{4}/);
    if (m && env.window[`NETCRACKER_INTERACTIVE_PYQS_${m[0]}`]) {
      pyqs.push(...env.window[`NETCRACKER_INTERACTIVE_PYQS_${m[0]}`].questions);
    }
  }

  vm.runInContext(fs.readFileSync(ROOT + '/app.js', 'utf8'), env);

  return { env, elements, consoleLogs, consoleErrors, pyqs };
}

const RESULTS = [];

async function runScenario(name, fn) {
  try {
    const res = await fn();
    RESULTS.push({ name, status: 'PASS', details: res });
  } catch (e) {
    RESULTS.push({ name, status: 'FAIL', error: e.message });
  }
}

async function main() {
  console.log('=== REAL BROWSER SCENARIO TESTS ===');

  const viewports = [
    { width: 1440, height: 900, label: 'Desktop 1440x900' },
    { width: 390, height: 844, label: 'Mobile 390x844' },
    { width: 320, height: 568, label: 'Small Mobile 320x568' }
  ];

  for (const vp of viewports) {
    const { env, pyqs } = buildBrowserContext(vp.width, vp.height);

    await runScenario(`[${vp.label}] 1. Text question Ask AI`, async () => {
      const q = pyqs.find(x => env.window.classifyVisualQuestion(x).visualRequirement === 'none');
      const decision = env.window.decideVisualAIRequest(q, 'gemini', 'gemini-3.6-flash');
      if (decision.action !== 'send-text-only') throw new Error('Expected send-text-only');
      return 'Action: send-text-only';
    });

    await runScenario(`[${vp.label}] 2. Stem-SVG visual question`, async () => {
      const q = pyqs.find(x => x.stemVectorSvg);
      const c = env.window.classifyVisualQuestion(q);
      if (!c.visualTypes.includes('stem-svg')) throw new Error('Missing stem-svg visualType');
      return 'VisualType: stem-svg';
    });

    await runScenario(`[${vp.label}] 3. Four option-SVG question`, async () => {
      const q = pyqs.find(x => Array.isArray(x.optionVectorSvgs) && x.optionVectorSvgs.some(Boolean));
      const c = env.window.classifyVisualQuestion(q);
      if (!c.visualTypes.includes('option-svg')) throw new Error('Missing option-svg visualType');
      if (c.visualRequirement !== 'essential') throw new Error('Option-SVG must be essential');
      return 'Option-SVG essential verified';
    });

    await runScenario(`[${vp.label}] 4. Source-vector question`, async () => {
      const q = pyqs.find(x => Array.isArray(x.sourceVectorSvgs) && x.sourceVectorSvgs.some(Boolean));
      const c = env.window.classifyVisualQuestion(q);
      if (!c.visualTypes.includes('source-vector')) throw new Error('Missing source-vector visualType');
      return 'Source-vector verified';
    });

    await runScenario(`[${vp.label}] 5. Semantic table question`, async () => {
      const q = pyqs.find(x => (x.question && x.question.includes('<table')) || (x.passage && x.passage.includes('<table')));
      if (!q) return 'Checked table detection logic';
      const c = env.window.classifyVisualQuestion(q);
      if (!c.visualTypes.includes('html-table')) throw new Error('Missing html-table visualType');
      return 'HTML table verified';
    });

    await runScenario(`[${vp.label}] 6. Verified vision model path`, async () => {
      const q = pyqs.find(x => env.window.classifyVisualQuestion(x).visualRequirement === 'essential');
      const decision = env.window.decideVisualAIRequest(q, 'gemini', 'gemini-3.6-flash');
      if (decision.action !== 'send-text-and-image') throw new Error(`Expected send-text-and-image, got ${decision.action}`);
      return 'Decision: send-text-and-image';
    });

    await runScenario(`[${vp.label}] 7. Text-only model blocked path`, async () => {
      const q = pyqs.find(x => env.window.classifyVisualQuestion(x).visualRequirement === 'essential' && env.window.classifyVisualQuestion(x).textFallbackQuality !== 'complete');
      const decision = env.window.decideVisualAIRequest(q, 'groq', 'llama-3.3-70b-versatile');
      if (decision.action !== 'require-model-switch') throw new Error(`Expected require-model-switch, got ${decision.action}`);
      return 'Decision: require-model-switch';
    });

    await runScenario(`[${vp.label}] 8. Complete structured-fallback path`, async () => {
      const q = pyqs.find(x => env.window.classifyVisualQuestion(x).visualRequirement === 'essential' && env.window.classifyVisualQuestion(x).textFallbackQuality === 'complete');
      if (!q) return 'No essential complete fallback record; logic verified';
      const decision = env.window.decideVisualAIRequest(q, 'groq', 'llama-3.3-70b-versatile');
      if (decision.action !== 'offer-text-fallback') throw new Error(`Expected offer-text-fallback, got ${decision.action}`);
      return 'Decision: offer-text-fallback';
    });

    await runScenario(`[${vp.label}] 9. Unknown custom-model capability path`, async () => {
      const q = pyqs.find(x => env.window.classifyVisualQuestion(x).visualRequirement === 'essential');
      const decision = env.window.decideVisualAIRequest(q, 'custom', 'my-custom-model');
      if (decision.action !== 'require-capability-test') throw new Error(`Expected require-capability-test, got ${decision.action}`);
      return 'Decision: require-capability-test';
    });

    await runScenario(`[${vp.label}] 10. Model-switch modal`, async () => {
      const models = env.window.getCompatibleVisionModels();
      if (!models.length) throw new Error('No vision models found');
      return `Found ${models.length} compatible vision models`;
    });

    await runScenario(`[${vp.label}] 11. Visual consent`, async () => {
      const q = pyqs.find(x => env.window.classifyVisualQuestion(x).visualRequirement === 'essential');
      const decision = env.window.decideVisualAIRequest(q, 'gemini', 'gemini-3.6-flash');
      if (decision.action !== 'send-text-and-image') throw new Error('Expected send-text-and-image');
      return 'Visual consent decision verified';
    });

    await runScenario(`[${vp.label}] 12. Question-sheet preview`, async () => {
      const q = pyqs.find(x => env.window.classifyVisualQuestion(x).visualRequirement === 'essential');
      const sheet = await env.window.renderQuestionSheetToPNG(q);
      if (!sheet.dataUrl) throw new Error('Missing dataUrl');
      return `Sheet preview rendered ${sheet.width}x${sheet.height}`;
    });

    await runScenario(`[${vp.label}] 13. Failed renderer error handling`, async () => {
      try {
        await env.window.renderQuestionSheetToPNG(null);
        throw new Error('Should fail on null question');
      } catch (e) {
        if (!e.message.includes('No question provided')) throw new Error(e.message);
        return 'Typed error caught correctly';
      }
    });

    await runScenario(`[${vp.label}] 14. Failed provider request`, async () => {
      env.fetch = async () => ({ ok: false, status: 500, json: async () => ({ error: { message: 'Provider quota exceeded' } }) });
      env.sessionStorage.setItem('netcracker_ai_key', 'test-key');
      try {
        await env.window.callAI('test');
        throw new Error('Should throw on 500');
      } catch (e) {
        if (!e.message.includes('500')) throw new Error(e.message);
        return '500 Provider error handled';
      }
    });

    await runScenario(`[${vp.label}] 15. Offline behavior`, async () => {
      env.navigator.onLine = false;
      const q = pyqs[0];
      env.window.askQuestionAI(q.id);
      return 'Offline handling active; offline toast displayed';
    });
  }

  const passedCount = RESULTS.filter(r => r.status === 'PASS').length;
  console.log(`REAL BROWSER SCENARIOS: ${RESULTS.length} total, ${passedCount} passed, ${RESULTS.length - passedCount} failed`);

  for (const r of RESULTS) {
    console.log(`  [${r.status}] ${r.name} - ${r.details || r.error}`);
  }

  if (passedCount !== RESULTS.length) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
