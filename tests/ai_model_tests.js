'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const catalogSrc=fs.readFileSync(ROOT+'/data/ai-model-catalog.js','utf8');
// Extract the catalog object by finding the assignment and using eval in a sandbox
const vm2=require('vm');
const sandbox={window:{}};
vm2.createContext(sandbox);
vm2.runInContext(catalogSrc,sandbox);
const CAT=sandbox.window.NETCRACKER_AI_MODEL_CATALOG;
const ERRORS=[];

function fail(msg){ERRORS.push(msg)}
function assert(cond,msg){if(!cond)fail(msg)}

// ============================================================
// CATALOG TESTS
// ============================================================
assert(CAT.providers.length===5,'Expected exactly 5 providers, got '+CAT.providers.length);
const ids=CAT.providers.map(p=>p.providerId);
assert(ids.includes('gemini'),'Missing gemini');
assert(ids.includes('openai'),'Missing openai');
assert(ids.includes('xai'),'Missing xai');
assert(ids.includes('groq'),'Missing groq');
assert(ids.includes('custom'),'Missing custom');
assert(ids.indexOf('groq')!==ids.indexOf('xai'),'groq and xai must be separate');
assert(CAT.catalogVersion,'Missing catalogVersion');
assert(CAT.officiallyCheckedDate,'Missing officiallyCheckedDate');
// Each provider has a recommended model
for(const p of CAT.providers){
  if(p.providerId==='custom')continue;
  const rec=p.models.filter(m=>m.recommended);
  assert(rec.length===1,p.providerId+' must have exactly 1 recommended, got '+rec.length);
  assert(ids.includes(p.defaultModel)||p.models.some(m=>m.id===p.defaultModel),p.providerId+' defaultModel "'+p.defaultModel+'" not in its models list');
}
// Model IDs unique within provider
const allModelIds={};
for(const p of CAT.providers){
  if(!p.models)continue;
  allModelIds[p.providerId]=new Set();
  for(const m of p.models){
    assert(!allModelIds[p.providerId].has(m.id),'Duplicate model '+m.id+' in '+p.providerId);
    allModelIds[p.providerId].add(m.id);
  }
}
// Gemini has gemini-3.6-flash
assert(CAT.providers.find(p=>p.providerId==='gemini').models.some(m=>m.id==='gemini-3.6-flash'),'Missing gemini-3.6-flash');
assert(CAT.providers.find(p=>p.providerId==='openai').models.some(m=>m.id==='gpt-5.6-terra'),'Missing gpt-5.6-terra');
assert(CAT.providers.find(p=>p.providerId==='xai').models.some(m=>m.id==='grok-4.5'),'Missing grok-4.5');
assert(CAT.providers.find(p=>p.providerId==='groq').models.some(m=>m.id==='openai/gpt-oss-120b'),'Missing openai/gpt-oss-120b');
assert(CAT.providers.find(p=>p.providerId==='custom').supportsCustomModelId===true,'Custom provider must support custom model ID');
// Provider labels
const gemini=CAT.providers.find(p=>p.providerId==='gemini');
assert(gemini.label==='Google Gemini','Gemini label');
assert(CAT.providers.find(p=>p.providerId==='xai').label==='xAI Grok','xAI label');
assert(CAT.providers.find(p=>p.providerId==='groq').label==='GroqCloud','Groq label');
assert(CAT.providers.find(p=>p.providerId==='custom').label==='Custom OpenAI-compatible','Custom label');
// Default model matches
assert(gemini.defaultModel==='gemini-3.6-flash','Gemini default');
assert(CAT.providers.find(p=>p.providerId==='openai').defaultModel==='gpt-5.6-terra','OpenAI default');
assert(CAT.providers.find(p=>p.providerId==='groq').defaultModel==='openai/gpt-oss-120b','Groq default must be openai/gpt-oss-120b');

const groqModels=CAT.providers.find(p=>p.providerId==='groq').models;
const qwenM=groqModels.find(m=>m.id==='qwen/qwen3.6-27b');
assert(Boolean(qwenM),'Qwen vision model missing');
assert(qwenM.maxImages===3,'Qwen maxImages must be exactly 3');

const llama33=groqModels.find(m=>m.id==='llama-3.3-70b-versatile');
assert(llama33.deprecated===true&&llama33.shutdownDate==='2026-08-16'&&llama33.recommended===false,'llama-3.3-70b-versatile must be deprecated');
const llama31=groqModels.find(m=>m.id==='llama-3.1-8b-instant');
assert(llama31.deprecated===true&&llama31.shutdownDate==='2026-08-16'&&llama31.recommended===false,'llama-3.1-8b-instant must be deprecated');
assert(CAT.providers.find(p=>p.providerId==='xai').defaultModel==='grok-4.5','xAI default');
// Endpoints
assert(gemini.baseUrl==='https://generativelanguage.googleapis.com/v1beta','Gemini baseUrl');
assert(gemini.discoveryConfig.authHeader==='x-goog-api-key','Gemini auth header');
assert(gemini.discoveryConfig.authInQuery===false,'Gemini key not in query');
assert(CAT.providers.find(p=>p.providerId==='openai').baseUrl==='https://api.openai.com/v1','OpenAI baseUrl');
assert(CAT.providers.find(p=>p.providerId==='xai').baseUrl==='https://api.x.ai/v1','xAI baseUrl');
assert(CAT.providers.find(p=>p.providerId==='groq').baseUrl==='https://api.groq.com/openai/v1','Groq baseUrl');

// xAI models have reasoningOptions
const xaiModels=CAT.providers.find(p=>p.providerId==='xai').models;
for(const m of xaiModels){
  assert(Array.isArray(m.reasoningOptions),'xAI model '+m.id+' missing reasoningOptions');
  assert(m.reasoningOptions.includes('medium'),'xAI model '+m.id+' missing medium reasoning');
}

console.log(JSON.stringify({status:'AI model catalog tests',passed:ERRORS.length===0,errors:ERRORS}));
if(ERRORS.length)process.exit(1);
