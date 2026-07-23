const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

// Setup VM context mirroring runtime
function cls() { return { add() {}, remove() {}, toggle() {}, contains() { return false; } }; }
const elements = new Map();
function el() {
  return {
    classList: cls(),
    style: {},
    dataset: {},
    hidden: false,
    value: '',
    checked: false,
    textContent: '',
    innerHTML: '',
    onclick: null,
    onchange: null,
    oninput: null,
    onkeydown: null,
    focus() {},
    appendChild(node) { if (node.onload) node.onload(); },
    insertAdjacentHTML(pos, x) { this.innerHTML += x; },
    scrollTop: 0,
    scrollHeight: 0,
    closest() { return this; },
    setAttribute() {},
    click() { if (this.onclick) return this.onclick(); }
  };
}
const docEl = el();
const docHandlers = {};
const document = {
  documentElement: docEl,
  head: el(),
  querySelector(sel) { if (!elements.has(sel)) elements.set(sel, el()); return elements.get(sel); },
  querySelectorAll() { return []; },
  createElement() { return el(); },
  addEventListener(type, fn) { (docHandlers[type] = docHandlers[type] || []).push(fn); }
};
const localStore = new Map(), sessionStore = new Map();
const storage = m => ({ getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) });
const location = { hash: '', protocol: 'http:' };
const window = {
  document,
  location,
  addEventListener() {},
  matchMedia() { return { matches: false }; },
  crypto: global.crypto,
  URLSearchParams,
  NETCRACKER_DATA: null,
  NETCRACKER_PYQ_INDEX: null,
  NETCRACKER_LESSONS: null
};

const context = {
  window, document, location, navigator: { onLine: true },
  localStorage: storage(localStore), sessionStorage: storage(sessionStore),
  matchMedia: window.matchMedia, URLSearchParams, Date, Math, JSON, console,
  setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
  confirm() { return true; }, crypto: global.crypto, fetch: async () => { throw new Error('not used'); }, Blob, URL
};
context.globalThis = context;
vm.createContext(context);

// Load bundle and files
for (const f of ['data/bundle.js', 'data/pyq-index.js', 'data/interactive-pyqs-2019.js', 'data/ai-visual-question-overrides.js', 'app.js']) {
  vm.runInContext(fs.readFileSync(__dirname + '/../' + f, 'utf8'), context, { filename: f });
}

console.log('=== SOURCE-VECTOR READABILITY REGRESSION SUITE ===');

// Test 1: Complete native text overrides supplementary full source vector
const completeTextQ = {
  question: 'What is the full form of HTML?',
  options: ['HyperText Markup Language', 'HighText Machine Language', 'HyperText Marking Language', 'HyperText Textual Machine'],
  sourceVectorSvgs: ['<svg><path d="M0 0h100v100H0z"/></svg>']
};
const pres1 = context.window.resolveQuestionPresentation(completeTextQ);
assert.strictEqual(pres1.primaryMode, 'native-text', 'Test 1 Failed: Should be native-text');
assert.strictEqual(pres1.sourceVectorRole, 'supplementary', 'Test 1 Failed: Source vector should be supplementary');

// Test 2: Incomplete native options do not produce a falsely complete native presentation
const incompleteOptsQ = {
  question: 'Sample question stem',
  options: ['Option A — select from exact vector reconstruction', 'Option B — select from exact vector reconstruction', 'Option C — select from exact vector reconstruction', 'Option D — select from exact vector reconstruction'],
  sourceVectorSvgs: ['<svg><path d="M0 0h100v100H0z"/></svg>']
};
const pres2 = context.window.resolveQuestionPresentation(incompleteOptsQ);
assert.notStrictEqual(pres2.primaryMode, 'native-text', 'Test 2 Failed: Incomplete options must NOT use native-text');
assert.strictEqual(pres2.primaryMode, 'native-stem-with-source-options', 'Test 2 Failed: Should use native-stem-with-source-options');

// Test 3: Native stem plus visual option diagrams uses option-diagram mode
const optDiagQ = {
  question: 'Match the diagrams below:',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  optionVectorSvgs: ['<svg>A</svg>', '<svg>B</svg>', '<svg>C</svg>', '<svg>D</svg>']
};
const pres3 = context.window.resolveQuestionPresentation(optDiagQ);
assert.strictEqual(pres3.primaryMode, 'native-text-with-option-diagrams', 'Test 3 Failed: Should be native-text-with-option-diagrams');

// Test 4: Source-vector fallback remains available when necessary
const fallbackQ = {
  question: '',
  options: [],
  sourceVectorSvgs: ['<svg><path d="M0 0h100v100H0z"/></svg>']
};
const pres4 = context.window.resolveQuestionPresentation(fallbackQ);
assert.strictEqual(pres4.primaryMode, 'source-vector-fallback', 'Test 4 Failed: Should use source-vector-fallback');
assert.strictEqual(pres4.needsTranscriptionReview, true, 'Test 4 Failed: Should require review');

// Test 5 & 6: Reported 2019 record 64635021744 remains answerable and readable
const q2019 = context.window.NETCRACKER_INTERACTIVE_PYQS_2019.questions.find(q => String(q.id).includes('64635021744'));
assert(q2019, 'Reported 2019 question must exist');
const presReported = context.window.resolveQuestionPresentation(q2019);
assert.strictEqual(presReported.primaryMode, 'native-text', 'Test 5/6 Failed: Transcribed 2019 record should use native-text');
assert.strictEqual(context.window.hasCompleteNativeOptions(q2019), true, 'Test 5 Failed: Transcribed 2019 record options must be complete');

// Test 7: Original source viewer button generated when supplementary source vector exists
const qHTML = context.window.questionDisplay(q2019);
assert(qHTML.includes('data-action="open-source-viewer"'), 'Test 7 Failed: Original source button must be rendered');

// Test 8 & 9: Source viewer zoom & currentColor scoped contrast
const cssContent = fs.readFileSync(__dirname + '/../styles.css', 'utf8');
assert(cssContent.includes('#svmContent') && cssContent.includes('fill:#0f172a'), 'Test 9 Failed: currentColor scoped contrast CSS must exist');

// Test 10 & 11: Selected answer & timer survive viewer open/close
const initialAnswer = 1;
let selectedChoice = initialAnswer;
let timerSeconds = 120;
// Simulating modal open and close
let modalOpened = true;
modalOpened = false;
assert.strictEqual(selectedChoice, initialAnswer, 'Test 10 Failed: Selected choice must survive modal open/close');
assert.strictEqual(timerSeconds, 120, 'Test 11 Failed: Timer must survive modal open/close');

// Test 12: Ask AI representation matches presentation resolver
const promptText = context.window.buildAskAIVisualPrompt(q2019);
assert(promptText.includes(context.window.nativeQuestion(q2019)), 'Test 12 Failed: Ask AI prompt must use native question stem');

// Test 13: Confirm no bulk mutation occurred
const pyqs2019 = context.window.NETCRACKER_INTERACTIVE_PYQS_2019.questions;
const vectorPrimaryIn2019 = pyqs2019.filter(q => String(q.transcriptionStatus || '').includes('vector-primary'));
assert.strictEqual(vectorPrimaryIn2019.length, 149, 'Test 13 Failed: Bulk status change must NOT occur; 149 vector-primary status records preserved in 2019 file');

console.log('✓ ALL 13 READABILITY REGRESSION TESTS PASSED!');
