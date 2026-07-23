'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');

function runAppTest(description,testFn){
  try{
    const ctx=buildContext();
    const result=testFn(ctx);
    return {description,passed:true,result};
  }catch(e){
    return {description,passed:false,error:e.message};
  }
}

function buildContext(){
  const cls=()=>({add(){},remove(){},toggle(){},contains(){return false}});
  const elements=new Map();
  function el(overrides){
    return Object.assign({
      classList:cls(),style:{},dataset:{},hidden:false,value:'',checked:false,
      textContent:'',innerHTML:'',onclick:null,onchange:null,oninput:null,onkeydown:null,
      disabled:false,focus(){},
      appendChild(node){if(node.onload)node.onload()},
      insertAdjacentHTML(pos,x){this.innerHTML+=x},
      scrollTop:0,scrollHeight:0,closest(s){return this},
      setAttribute(){},getAttribute(){return null},
      click(){if(this.onclick)return this.onclick()}
    },overrides||{});
  }
  const docEl=el({dataset:{}});
  const document={
    documentElement:docEl,
    head:el(),
    querySelector(sel){if(!elements.has(sel))elements.set(sel,el());return elements.get(sel)},
    querySelectorAll(){return []},
    createElement(t){const e=el();if(t==='script'){e.onload=null;e.src=''};return e},
    addEventListener(){}
  };
  const localStore=new Map(),sessionStore=new Map();
  const storage=m=>({getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)});
  const location={hash:'#settings',protocol:'http:'};
  const handlers={};
  const w={
    document,location,
    addEventListener(type,fn){handlers[type]=fn},
    matchMedia(){return {matches:false}},
    crypto:{randomUUID:()=>String(Math.random())},
    URLSearchParams,
    NETCRACKER_DATA:null,
    NETCRACKER_PYQ_INDEX:null,
    NETCRACKER_LESSONS:{},
    NETCRACKER_AI_MODEL_CATALOG:null
  };
  const consoleLogs=[];
  const env={
    window:w,document,location,
    navigator:{onLine:true},
    localStorage:storage(localStore),sessionStorage:storage(sessionStore),
    matchMedia:w.matchMedia,URLSearchParams,Date,Math,JSON,
    console:{log(...args){consoleLogs.push(args);console.log(...args)},warn(){},error(){}},
    setTimeout(){return 0},clearTimeout(){},setInterval(){return 0},clearInterval(){},
    confirm(){return true},crypto:w.crypto,
    fetch:async()=>{throw new Error('fetch not mocked')},
    Blob,URL,
    AbortSignal:{timeout:()=>new AbortController().signal},
    AbortController
  };
  env.globalThis=env;
  vm.createContext(env);
  // Load catalog first
  const catalogSrc=fs.readFileSync(ROOT+'/data/ai-model-catalog.js','utf8');
  vm.runInContext(catalogSrc,env,{filename:'data/ai-model-catalog.js'});
  // Load data files
  vm.runInContext(fs.readFileSync(ROOT+'/data/bundle.js','utf8'),env,{filename:'data/bundle.js'});
  vm.runInContext(fs.readFileSync(ROOT+'/data/pyq-index.js','utf8'),env,{filename:'data/pyq-index.js'});
  // Create year globals
  const yearFiles=fs.readdirSync(ROOT+'/data').filter(f=>f.startsWith('interactive-pyqs-'));
  for(const f of yearFiles){
    const year=f.match(/\d{4}/)[0];
    vm.runInContext(fs.readFileSync(ROOT+'/data/'+f,'utf8'),env,{filename:'data/'+f});
  }
  vm.runInContext(fs.readFileSync(ROOT+'/data/lessons.js','utf8'),env,{filename:'data/lessons.js'});
  // Load app
  vm.runInContext(fs.readFileSync(ROOT+'/app.js','utf8'),env,{filename:'app.js'});
  // Store elements map for inspection
  env._elements=elements;
  env._consoleLogs=consoleLogs;
  return env;
}

function getHTML(ctx,sel){const el=ctx._elements.get(sel);return el?el.innerHTML:''}

// ============================================================
// TEST SUITE
// ============================================================
const results=[];

// Test 1: Provider selector options
results.push(runAppTest('Provider selector has correct values',(ctx)=>{
  const sel=ctx._elements.get('#aiProvider');
  // Simulate options by checking the rendered HTML
  const html=getHTML(ctx,'#main');
  if(!html.includes('value="gemini"'))throw new Error('Missing gemini option');
  if(!html.includes('value="openai"'))throw new Error('Missing openai option');
  if(!html.includes('value="xai"'))throw new Error('Missing xai option');
  if(!html.includes('value="groq"'))throw new Error('Missing groq option');
  if(!html.includes('value="custom"'))throw new Error('Missing custom option');
  return 'all 5 options present';
}));

// Test 2: OpenAI defaults to gpt-5.6-terra
results.push(runAppTest('OpenAI defaults to gpt-5.6-terra',(ctx)=>{
  const cat=ctx.window.NETCRACKER_AI_MODEL_CATALOG;
  const oa=cat.providers.find(p=>p.providerId==='openai');
  if(oa.defaultModel!=='gpt-5.6-terra')throw new Error('OpenAI default is '+oa.defaultModel);
  return 'openai default is gpt-5.6-terra';
}));

// Test 3: xAI defaults to grok-4.5
results.push(runAppTest('xAI defaults to grok-4.5',(ctx)=>{
  const cat=ctx.window.NETCRACKER_AI_MODEL_CATALOG;
  const xai=cat.providers.find(p=>p.providerId==='xai');
  if(xai.defaultModel!=='grok-4.5')throw new Error('xAI default is '+xai.defaultModel);
  return 'xai default is grok-4.5';
}));

// Test 4: Groq defaults to llama-3.3-70b-versatile
results.push(runAppTest('Groq defaults to llama-3.3-70b-versatile',(ctx)=>{
  const cat=ctx.window.NETCRACKER_AI_MODEL_CATALOG;
  const groq=cat.providers.find(p=>p.providerId==='groq');
  if(groq.defaultModel!=='llama-3.3-70b-versatile')throw new Error('Groq default is '+groq.defaultModel);
  return 'groq default is llama-3.3-70b-versatile';
}));

// Test 5: Custom provider supports custom model ID
results.push(runAppTest('Custom provider supports custom model ID',(ctx)=>{
  const cat=ctx.window.NETCRACKER_AI_MODEL_CATALOG;
  const custom=cat.providers.find(p=>p.providerId==='custom');
  if(custom.supportsCustomModelId!==true)throw new Error('Custom does not support custom model ID');
  return 'custom supportsCustomModelId is true';
}));

// Test 6: Catalog has checked date
results.push(runAppTest('Catalog has officiallyCheckedDate',(ctx)=>{
  const cat=ctx.window.NETCRACKER_AI_MODEL_CATALOG;
  if(!cat.officiallyCheckedDate)throw new Error('Missing officiallyCheckedDate');
  return 'Date: '+cat.officiallyCheckedDate;
}));

// Test 7: Model metadata for Gemini recommended
results.push(runAppTest('Model metadata available',(ctx)=>{
  const cat=ctx.window.NETCRACKER_AI_MODEL_CATALOG;
  const gemini=cat.providers.find(p=>p.providerId==='gemini');
  const rec=gemini.models.find(m=>m.recommended);
  if(!rec)throw new Error('No recommended model for Gemini');
  if(!rec.tier)throw new Error('Missing tier');
  if(!rec.description)throw new Error('Missing description');
  return rec.label+': '+rec.tier;
}));

// Test 8: xAI and GroqCloud are separate
results.push(runAppTest('xAI and GroqCloud are separate providers',(ctx)=>{
  const cat=ctx.window.NETCRACKER_AI_MODEL_CATALOG;
  const xai=cat.providers.find(p=>p.providerId==='xai');
  const groq=cat.providers.find(p=>p.providerId==='groq');
  if(!xai)throw new Error('xAI provider missing');
  if(!groq)throw new Error('GroqCloud provider missing');
  if(xai.label===groq.label)throw new Error('Labels should differ');
  return 'xAI: '+xai.label+', Groq: '+groq.label;
}));

// Test 9: Catalog version exists
results.push(runAppTest('Catalog version exists',(ctx)=>{
  const cat=ctx.window.NETCRACKER_AI_MODEL_CATALOG;
  if(!cat.catalogVersion)throw new Error('Missing catalogVersion');
  return cat.catalogVersion;
}));

// Test 10: Settings shows catalog verified note
results.push(runAppTest('Settings shows catalog verified note',(ctx)=>{
  const html=getHTML(ctx,'#main');
  if(!html.includes('23 July 2026'))throw new Error('Missing catalog date note');
  return 'catalog date note found';
}));

// Test 11: All providers have base URLs
results.push(runAppTest('All non-custom providers have base URLs',(ctx)=>{
  const cat=ctx.window.NETCRACKER_AI_MODEL_CATALOG;
  for(const p of cat.providers){
    if(p.providerId==='custom')continue;
    if(!p.baseUrl)throw new Error(p.providerId+' missing baseUrl');
  }
  return 'all non-custom providers have baseUrl';
}));

// Test 12: xAI models have reasoningOptions
results.push(runAppTest('xAI models have reasoningOptions',(ctx)=>{
  const cat=ctx.window.NETCRACKER_AI_MODEL_CATALOG;
  const xai=cat.providers.find(p=>p.providerId==='xai');
  for(const m of xai.models){
    if(!m.reasoningOptions||!m.reasoningOptions.includes('medium'))throw new Error('xAI model '+m.id+' missing reasoningOptions/medium');
  }
  return 'xAI reasoning options OK';
}));

// ============================================================
// RESULTS
// ============================================================
const passed=results.filter(r=>r.passed).length;
const failed=results.filter(r=>!r.passed);
console.log('AI MODEL BROWSER TESTS');
console.log('Total: '+results.length+', Passed: '+passed+', Failed: '+(results.length-passed));
for(const r of results){
  const status=r.passed?'PASS':'FAIL';
  console.log('  ['+status+'] '+r.description+(r.result?': '+r.result:'')+(r.error?' - '+r.error:''));
}
if(failed.length)process.exit(1);
