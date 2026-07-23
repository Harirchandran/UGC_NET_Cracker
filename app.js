(() => {
'use strict';
const DATA = window.NETCRACKER_DATA;
const PYQ_INDEX = window.NETCRACKER_PYQ_INDEX || {years:{},mappedTotal:0,scoreableTotal:0};
const ALL_YEAR_MAP = {};
const CERTIFIED_INTERACTIVE_YEARS = new Set(Object.keys(PYQ_INDEX.years||{}).map(Number));
const loadedYears = new Set();
const AI_CATALOG = window.NETCRACKER_AI_MODEL_CATALOG || {providers:[]};
const AI_MODEL_MEMORY_KEY = 'netcracker_ai_model_per_provider';
const mergeQuestions=questions=>{const existingMap=new Map(DATA.questions.map((q,i)=>[q.id,i]));for(const q of questions){if(q.scored!==false&&!q.dropped){if(existingMap.has(q.id)){DATA.questions[existingMap.get(q.id)]=q}else{DATA.questions.push(q);existingMap.set(q.id,DATA.questions.length-1)}}}};
async function loadYear(year){
 year=Number(year);if(loadedYears.has(year))return ALL_YEAR_MAP[year]||[];
 const globalName=`NETCRACKER_INTERACTIVE_PYQS_${year}`;
 if(!window[globalName])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=((PYQ_INDEX.years?.[year]?.file||`data/interactive-pyqs-${year}.js`)+'?v='+(Date.now()));script.async=true;script.onload=resolve;script.onerror=()=>reject(new Error(`Could not load the ${year} question archive.`));document.head.appendChild(script)});
 const questions=Array.isArray(window[globalName]?.questions)?window[globalName].questions:[];
 if(!questions.length)throw new Error(`The ${year} question archive is empty or invalid.`);
 ALL_YEAR_MAP[year]=questions;loadedYears.add(year);mergeQuestions(questions);return questions;
}
async function loadYears(years){const out=[];for(const year of years)out.push(...await loadYear(year));return out}
window.loadYear = loadYear;
window.loadYears = loadYears;
const officialScoreableCount=Number(PYQ_INDEX.scoreableTotal||0);
const STORAGE_KEY = 'netcracker_state_v1';
const AI_KEY_SESSION = 'netcracker_ai_key';
const ARCHIVE_CACHE_KEY = 'netcracker_archive_cached_v4';
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const esc = (s='') => String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const todayISO=()=>new Date().toISOString().slice(0,10);
const fmtDate=(x)=>x?new Date(x+'T00:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'Not set';
const daysBetween=(a,b)=>Math.ceil((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000);
const shuffle=(arr, seed=Date.now())=>{let a=[...arr],x=seed>>>0;for(let i=a.length-1;i>0;i--){x=(1664525*x+1013904223)>>>0;const j=x%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a};
const allTopics=()=>DATA.syllabus.papers.flatMap(p=>p.units.flatMap(u=>u.topics.map(t=>({...t,paperCode:p.code,paperName:p.name,unit:u.number,unitName:u.name}))));
const topicById=(id)=>allTopics().find(t=>t.id===id);
const unitQuestions=(paper,unit)=>DATA.questions.filter(q=>!q.dropped&&q.paper===Number(paper)&&q.unit===Number(unit));
const optionTextValid=o=>o&&!/^(?:Option\s*)?[A-D1-4](?:\s*\(.*vector.*\))?$/i.test(String(o).trim())&&!/^Option\s+[A-D1-4]\s*—\s*select\s+from\s+exact\s+vector\s+reconstruction/i.test(String(o).trim());
const questionById=id=>DATA.questions.find(q=>q.id===id);
const safeVector=(svg='')=>{const x=String(svg||'').trim();if(!x.startsWith('<svg')||/<\/?(?:script|image|foreignObject)\b/i.test(x)||/\son\w+\s*=/i.test(x))return '';return x};
const nativeQuestion=(q)=>q.ocrQuestion||(q.question&&!/^Option\s+[A-D1-4]\b/i.test(q.question)?q.question:'');
const hasNativeQuestion=(q)=>!!nativeQuestion(q).trim();
const nativeOptions=(q)=>{if(q.ocrOptions&&Array.isArray(q.ocrOptions)&&q.ocrOptions.length>=2&&q.ocrOptions.every(optionTextValid))return q.ocrOptions;if(q.options&&Array.isArray(q.options)&&q.options.length>=2&&q.options.every(optionTextValid))return q.options;return null};
const hasCompleteNativeOptions=(q)=>!!nativeOptions(q);
const optionsDisplayText=(q,i)=>{const no=nativeOptions(q);if(no&&no[i])return no[i];const o=q.options?.[i];const alt=Array.isArray(q.optionAlt)?q.optionAlt[i]:'';return optionTextValid(o)?o:(alt||`Option ${String.fromCharCode(65+i)}`)};
const resolveQuestionPresentation=(q)=>{if(!q)return {primaryMode:'source-vector-fallback',sourceVectorRole:'hidden',reasons:['no-question'],needsTranscriptionReview:true};
  const hasStem=hasNativeQuestion(q);const hasOpts=hasCompleteNativeOptions(q);const hasStemDiag=!!(q.stemVectorSvg&&safeVector(q.stemVectorSvg));const hasOptDiags=Array.isArray(q.optionVectorSvgs)&&q.optionVectorSvgs.some(s=>s&&safeVector(s));const isTable=!!(q.tableHtml||q.isTable||q.presentation==='semantic-table');const hasSrcVec=Array.isArray(q.sourceVectorSvgs)&&q.sourceVectorSvgs.some(s=>s&&safeVector(s));const reasons=[];
  if(isTable){reasons.push('semantic-table-layout-required');return {primaryMode:'semantic-table',sourceVectorRole:hasSrcVec?'supplementary':'hidden',reasons,needsTranscriptionReview:!hasOpts||!hasStem}}
  if(hasStem&&hasOpts){reasons.push('native-stem-complete');reasons.push('native-options-complete');if(hasStemDiag&&hasOptDiags){reasons.push('essential-stem-and-option-diagrams-present');return {primaryMode:'native-text-with-stem-diagram',sourceVectorRole:hasSrcVec?'supplementary':'hidden',reasons,needsTranscriptionReview:false}}if(hasStemDiag){reasons.push('essential-stem-diagram-present');return {primaryMode:'native-text-with-stem-diagram',sourceVectorRole:hasSrcVec?'supplementary':'hidden',reasons,needsTranscriptionReview:false}}if(hasOptDiags){reasons.push('essential-option-diagrams-present');return {primaryMode:'native-text-with-option-diagrams',sourceVectorRole:hasSrcVec?'supplementary':'hidden',reasons,needsTranscriptionReview:false}}if(hasSrcVec)reasons.push('source-vector-available-as-supplementary');return {primaryMode:'native-text',sourceVectorRole:hasSrcVec?'supplementary':'hidden',reasons,needsTranscriptionReview:false}}
  if(hasStem&&!hasOpts){reasons.push('native-stem-complete');reasons.push('native-options-incomplete');if(hasOptDiags){reasons.push('option-diagrams-supply-options');return {primaryMode:'native-text-with-option-diagrams',sourceVectorRole:hasSrcVec?'supplementary':'hidden',reasons,needsTranscriptionReview:false}}if(hasSrcVec){reasons.push('source-vector-supplements-options');return {primaryMode:'native-stem-with-source-options',sourceVectorRole:'primary-fallback',reasons,needsTranscriptionReview:true}}return {primaryMode:'source-vector-fallback',sourceVectorRole:'primary-fallback',reasons,needsTranscriptionReview:true}}
  if(!hasStem&&hasOpts){reasons.push('native-stem-incomplete');reasons.push('native-options-complete');if(hasSrcVec){reasons.push('source-vector-supplements-stem');return {primaryMode:'native-options-with-source-stem',sourceVectorRole:'primary-fallback',reasons,needsTranscriptionReview:true}}return {primaryMode:'source-vector-fallback',sourceVectorRole:'primary-fallback',reasons,needsTranscriptionReview:true}}
  reasons.push('native-transcription-incomplete');if(hasSrcVec)reasons.push('source-vector-used-as-primary-fallback');return {primaryMode:'source-vector-fallback',sourceVectorRole:hasSrcVec?'primary-fallback':'hidden',reasons,needsTranscriptionReview:true}};
const advisory=q=>{const st=String(q.transcriptionStatus||'');const pres=resolveQuestionPresentation(q);if(pres.sourceVectorRole==='primary-fallback'||pres.needsTranscriptionReview)return true;return st.startsWith('quarantined')||Number(q.transcriptionConfidence||1)<.7};
const vectorStack=q=>Array.isArray(q.sourceVectorSvgs)?q.sourceVectorSvgs.map(safeVector).filter(Boolean).map(x=>`<div class="vector-sheet">${x}</div>`).join(''):'';
const sourceViewerHTML=(vectors,label='View original source')=>{if(!vectors)return '';return `<button class="button ghost compact" data-action="open-source-viewer" data-vectors="${esc(vectors)}" aria-label="${esc(label)}">${esc(label)}</button>`};
const questionDisplay=q=>{const pres=resolveQuestionPresentation(q);const sVectors=Array.isArray(q.sourceVectorSvgs)?q.sourceVectorSvgs.map(safeVector).filter(Boolean).join(''):'';const vectors=sVectors?`<div class="vector-sheet">${sVectors}</div>`:'';const passage=q.passage?`<div class="passage"><strong>Shared passage / data:</strong><p>${esc(q.passage)}</p></div>`:'';const text=hasNativeQuestion(q)?`<div class="q-text">${esc(nativeQuestion(q))}</div>`:'';const stemDiag=(pres.primaryMode==='native-text-with-stem-diagram'||pres.primaryMode==='native-stem-with-source-options')&&q.stemVectorSvg?`<div class="vector-sheet semantic-visual">${safeVector(q.stemVectorSvg)}</div>`:'';const tableHtml=pres.primaryMode==='semantic-table'&&q.tableHtml?`<div class="semantic-table-wrapper">${q.tableHtml}</div>`:'';const warning=pres.needsTranscriptionReview?`<div class="alert warning small"><strong>Needs native transcription review.</strong> Accessible text or options for this question may rely on source visuals.</div>`:'';const svButton=(pres.sourceVectorRole==='supplementary'&&sVectors)||pres.primaryMode==='native-stem-with-source-options'||pres.primaryMode==='native-options-with-source-stem'?sourceViewerHTML(sVectors):'';
  if(pres.primaryMode==='source-vector-fallback'){return `${warning}${stemDiag}<div class="exact-vector primary-vector"><div class="visual-caption"><strong>Original source reconstruction</strong><span>This question has not yet been fully converted to accessible text. Use zoom for accurate reading.</span></div>${vectors}</div>`}
  if(pres.primaryMode==='native-stem-with-source-options'){return `${warning}${passage}${text}${stemDiag}<div class="alert info small" style="margin-top:10px;"><strong>Answer choices:</strong> View original source sheet for full visual choices, then select A, B, C, or D below. ${svButton}</div>`}
  if(pres.primaryMode==='native-options-with-source-stem'){return `${warning}${passage}<div class="exact-vector primary-vector"><div class="visual-caption"><strong>Question stem (original source)</strong></div>${vectors}</div>`}
  if(pres.primaryMode==='semantic-table'){return `${passage}${text}${tableHtml}${svButton}`}
  return `${passage}${text}${stemDiag}${svButton}`};
const optionDisplay=(q,o,i)=>{const pres=resolveQuestionPresentation(q);const label=optionsDisplayText(q,i);const svg=Array.isArray(q.optionVectorSvgs)&&(pres.primaryMode==='native-text-with-option-diagrams'||pres.primaryMode==='native-stem-with-source-options')?safeVector(q.optionVectorSvgs[i]):'';if(svg)return `<span class="option-content"><span class="option-title">${esc(label)}</span><span class="option-vector">${svg}</span></span>`;return `<span class="option-content">${esc(label)}</span>`};
const optionLabel=(q,i)=>optionsDisplayText(q,i);
const verificationLabel=q=>{if(q.dropped)return 'Official source item · dropped';const pres=resolveQuestionPresentation(q);const st=String(q.transcriptionStatus||'');const cv=String(q.contentVerification||'');if(pres.primaryMode==='source-vector-fallback')return 'Exact source-vector preservation · needs native review';if(pres.needsTranscriptionReview)return 'Structured transcription · review metadata retained';if(st.includes('semantic-svg'))return 'Manually reconstructed text + semantic SVG';if(cv.includes('manual-source-page'))return 'Manually reconstructed from source page';if(cv.includes('clean-native')||st==='verified-text'||(hasNativeQuestion(q)&&hasCompleteNativeOptions(q)))return 'Native text structurally checked';if(cv.includes('structured')||st.includes('machine-transcribed'))return 'Structured transcription · review metadata retained';return 'Content status not independently established'};
const sourceBadge=q=>q.isPyq?`<span class="tag success">Archived official-paper item</span><span class="tag">${esc(verificationLabel(q))}</span>${q.dropped?` <span class="tag warning">Not scored</span>`:''}`:q.source==='NETCracker original practice'?'<span class="tag">Original practice</span>':'<span class="tag">Source noted</span>';
const questionMetaHTML=(q,compact=false)=>{const currentPaper=q.paper===1?'Paper 1':'Paper 2 · Computer Science';const original=q.legacyPaper&&q.legacyPaper!==q.paper?`Legacy Paper ${q.legacyPaper} → current Paper ${q.paper}`:(q.legacyPaper?`Original Paper ${q.legacyPaper}`:currentPaper);const pres=resolveQuestionPresentation(q);const visual=q.visualType||(pres.primaryMode==='native-text-with-option-diagrams'?'Option diagrams':pres.primaryMode==='native-text-with-stem-diagram'?'Stem diagram':pres.primaryMode==='source-vector-fallback'?'Source-vector verification':pres.sourceVectorRole==='supplementary'?'Text + source evidence':'Text');const items=[['Exam',q.examCycle||`UGC-NET ${q.year||''}`],['Year',q.year||'Practice'],['Paper',original],['Official question',q.questionNumber??'—'],['Source page',q.sourcePage??'—'],['Archive ID',q.questionId||q.id],['Answer status',q.dropped?'Officially dropped':q.answerKeyMapped===false?'Not mapped':q.answerVerification||'Mapped'],['Content status',verificationLabel(q)],['Presentation',visual]];return `<div class="question-meta ${compact?'compact':''}">${items.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>${q.reviewNotes?`<div class="tiny muted review-note">${esc(q.reviewNotes)}</div>`:''}`};

const defaultState=()=>({
 version:1,
 profile:{name:'',examDate:'',category:'UNRESERVED',goal:'JRF',targetTotal:210,targetP1:70,targetP2:140,hoursPerDay:3,daysPerWeek:6,language:'English',risk:'Balanced',onboarded:false},
 progress:{},
 tasks:{},
 attempts:[],
 mistakes:[],
 chats:[],
 notes:{},
  settings:{theme:'system',notifications:false,aiProvider:'gemini',aiModel:'gemini-3.6-flash',aiModelPerProvider:{},aiCustomModelId:'',aiBaseUrl:'',rememberKey:false,aiValidated:false,aiReasoningMode:'auto',questionOrder:'mixed',aiVisualConsent:{},aiModelCapabilities:{},customModelVisionSupport:false,customModelImageFormat:'openai-chat'},
 meta:{createdAt:new Date().toISOString(),lastOpened:new Date().toISOString(),streak:0,lastStudyDate:null,totalMinutes:0}
});
let state=loadState();
let deferredInstall=null;
let currentRoute='dashboard';
let testSession=null;
let timerHandle=null;
let revisionIndex=0;
let questionBrowser={year:Math.max(...CERTIFIED_INTERACTIVE_YEARS),paper:'all',status:'scoreable',visual:'all',query:'',index:0,reveal:false,loading:false};

function migrateState(s){
  const oldModel=s.settings?.aiModel;
  if(oldModel==='gemini-2.0-flash')s.settings.aiModel='gemini-3.6-flash';
  if(!s.settings.aiModelPerProvider)s.settings.aiModelPerProvider={};
  if(oldModel&&oldModel!=='gemini-2.0-flash'&&s.settings.aiProvider&&!s.settings.aiModelPerProvider[s.settings.aiProvider]){s.settings.aiModelPerProvider[s.settings.aiProvider]=oldModel}
  if(s.settings.aiReasoningMode===undefined)s.settings.aiReasoningMode='auto';
  if(s.settings.aiCustomModelId===undefined)s.settings.aiCustomModelId='';
  if(!s.settings.aiVisualConsent)s.settings.aiVisualConsent={};
  if(!s.settings.aiModelCapabilities)s.settings.aiModelCapabilities={};
  if(s.settings.customModelVisionSupport===undefined)s.settings.customModelVisionSupport=false;
  if(s.settings.customModelImageFormat===undefined)s.settings.customModelImageFormat='openai-chat';
  return s;
}
function loadState(){
  try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return defaultState();const parsed=JSON.parse(raw);return migrateState(deepMerge(defaultState(),parsed))}catch(e){console.warn(e);return defaultState()}
}
function deepMerge(base, extra){
 if(Array.isArray(base)) return Array.isArray(extra)?extra:base;
 if(base&&typeof base==='object'){const out={...base};for(const k of Object.keys(extra||{}))out[k]=k in base?deepMerge(base[k],extra[k]):extra[k];return out}
 return extra===undefined?base:extra;
}
function saveState(){state.meta.lastOpened=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));updateChrome()}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),2600)}
function mastery(id){return clamp(Number(state.progress[id]?.mastery||0),0,100)}
function updateProgress(id,delta,confidence=null){
 const p=state.progress[id]||{mastery:0,studied:false,confidence:0,lastStudied:null,nextReview:null,reviews:0};
 p.mastery=clamp(Math.round((p.mastery||0)+delta),0,100);p.studied=true;p.lastStudied=todayISO();
 if(confidence!==null)p.confidence=confidence;
 const gap=p.mastery>=80?21:p.mastery>=60?7:p.mastery>=35?3:1;
 const d=new Date();d.setDate(d.getDate()+gap);p.nextReview=d.toISOString().slice(0,10);p.reviews=(p.reviews||0)+1;
 state.progress[id]=p;saveState();
}
function overallMastery(paperCode=null){const ts=allTopics().filter(t=>!paperCode||t.paperCode===paperCode);return ts.length?Math.round(ts.reduce((a,t)=>a+mastery(t.id),0)/ts.length):0}
function coverage(paperCode=null){const ts=allTopics().filter(t=>!paperCode||t.paperCode===paperCode);return ts.length?Math.round(ts.filter(t=>state.progress[t.id]?.studied).length/ts.length*100):0}
function examDays(){return state.profile.examDate?Math.max(0,daysBetween(todayISO(),state.profile.examDate)):null}
function readiness(){
 const m=overallMastery(), attempts=state.attempts.slice(-8);
 const accuracy=attempts.length?attempts.reduce((a,x)=>a+x.accuracy,0)/attempts.length:0;
 const coverageScore=coverage();return Math.round(clamp(m*.52+accuracy*.28+coverageScore*.2,0,100));
}
function predictedScore(){
 const r=readiness();const recent=state.attempts.filter(a=>a.type==='mock').slice(-3);
 if(recent.length){const avg=recent.reduce((a,x)=>a+x.score,0)/recent.length;return {low:Math.max(0,Math.round(avg-10)),high:Math.min(300,Math.round(avg+10)),basis:'recent mocks'}}
 const mid=Math.round(r*3);return {low:Math.max(0,mid-18),high:Math.min(300,mid+18),basis:'mastery estimate'};
}
function cutoffForGoal(){const c=DATA.cutoffs.categories[state.profile.category]||DATA.cutoffs.categories.UNRESERVED;return state.profile.goal==='JRF'?c.jrf:state.profile.goal==='Assistant Professor'?c.assistantProfessor:state.profile.goal==='PhD only'?c.phdOnly:state.profile.targetTotal}
function taskKey(){return todayISO()}
function dueTopics(){return allTopics().filter(t=>state.progress[t.id]?.nextReview && state.progress[t.id].nextReview<=todayISO()).sort((a,b)=>mastery(a.id)-mastery(b.id))}
function priorityTopics(){
 const days=Math.max(1,examDays()||180),urgency=1+120/days;
 return allTopics().map(t=>{const p=state.progress[t.id]||{};const gap=1-mastery(t.id)/100;const forgetting=p.nextReview&&p.nextReview<=todayISO()?1.7:1;const score=t.importance*gap*forgetting*urgency/(t.difficulty||2);return {...t,priority:score}}).sort((a,b)=>b.priority-a.priority)
}
function getDailyTasks(date=todayISO()){
 if(state.tasks[date])return state.tasks[date];
 const pri=priorityTopics(),due=dueTopics();
 const learn=pri.find(t=>!state.progress[t.id]?.studied)||pri[0];
 const practise=pri.find(t=>t.id!==learn?.id)||pri[1];
 const revise=due[0]||pri.find(t=>mastery(t.id)>0&&t.id!==learn?.id)||pri[2];
 const paper1=pri.find(t=>t.paperCode==='00')||pri[0];
 const mins=Math.round(state.profile.hoursPerDay*60);
 const tasks=[
  {id:`${date}-learn`,type:'Learn',topicId:learn?.id,title:learn?.name||'Choose a syllabus topic',minutes:Math.max(25,Math.round(mins*.34)),done:false},
  {id:`${date}-practice`,type:'Practice',topicId:practise?.id,title:`MCQs: ${practise?.name||'mixed practice'}`,minutes:Math.max(20,Math.round(mins*.25)),done:false},
  {id:`${date}-revision`,type:'Revise',topicId:revise?.id,title:revise?.name||'Revision queue',minutes:Math.max(15,Math.round(mins*.16)),done:false},
  {id:`${date}-paper1`,type:'Paper 1',topicId:paper1?.id,title:paper1?.name||'Paper 1 drill',minutes:Math.max(15,Math.round(mins*.12)),done:false},
  {id:`${date}-test`,type:'Test',topicId:null,title:'Timed 10-question mixed test',minutes:Math.max(18,Math.round(mins*.13)),done:false}
 ];
 state.tasks[date]=tasks;saveState();return tasks;
}
function completeTask(id){const tasks=getDailyTasks();const t=tasks.find(x=>x.id===id);if(!t)return;t.done=!t.done;if(t.done&&t.topicId){updateProgress(t.topicId,t.type==='Learn'?10:t.type==='Revise'?7:4)}state.meta.totalMinutes+=(t.done?t.minutes:-t.minutes);updateStreak();saveState();render()}
function updateStreak(){const today=todayISO(),last=state.meta.lastStudyDate;if(last===today)return;if(last){const diff=daysBetween(last,today);state.meta.streak=diff===1?(state.meta.streak||0)+1:1}else state.meta.streak=1;state.meta.lastStudyDate=today}
function renderProgress(pct,cls=''){return `<div class="progress ${cls}"><i style="width:${clamp(pct,0,100)}%"></i></div>`}
function updateChrome(){
 const p=overallMastery();$('#sideProgressText').textContent=`${p}% mastered`;$('#sideProgressBar').style.width=`${p}%`;
 $('#aiNavLock').textContent=state.settings.aiValidated?'ready':'locked';
 document.documentElement.dataset.theme=state.settings.theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):state.settings.theme;
 const badge=$('#offlineBadge');if(badge&&localStorage.getItem(ARCHIVE_CACHE_KEY)==='1')badge.textContent=navigator.onLine?'Online · full archive cached':'Offline · full archive cached';
}
function routeTo(route){location.hash=route}
function getRoute(){return (location.hash||'#dashboard').slice(1).split('?')[0]||'dashboard'}
function render(){
 currentRoute=getRoute();$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.route===currentRoute));$('#sidebar').classList.remove('open');
 const main=$('#main');
 const views={dashboard:renderDashboard,plan:renderPlan,syllabus:renderSyllabus,learn:renderLearn,practice:renderPractice,mock:renderMock,revision:renderRevision,mistakes:renderMistakes,analytics:renderAnalytics,questions:renderQuestionBrowser,papers:renderPapers,tutor:renderTutor,sources:renderSources,settings:renderSettings};
 main.innerHTML=(views[currentRoute]||renderDashboard)();main.focus({preventScroll:true});bindView();updateChrome();
 if(!state.profile.onboarded)setTimeout(showOnboarding,80);
}
function pageHead(title,desc,actions=''){return `<div class="page-head"><div><h1>${title}</h1><p>${desc}</p></div>${actions?`<div class="head-actions">${actions}</div>`:''}</div>`}
function renderDashboard(){
 const days=examDays(),pred=predictedScore(),tasks=getDailyTasks(),done=tasks.filter(t=>t.done).length,goalCut=cutoffForGoal();
 const risk=pred.high>=state.profile.targetTotal?'On track':pred.high>=state.profile.targetTotal-20?'Needs acceleration':'High risk';
 return `<section class="page">
 ${pageHead(`Welcome${state.profile.name?', '+esc(state.profile.name):''}`,`Your local UGC-NET Computer Science command centre. ${days===null?'Set a target examination date to activate deadline planning.':`${days} days remain to your personal target date.`}`,`<button class="button ghost" data-action="edit-target">Edit target</button><button class="button" data-route="plan">Start today</button>`)}
 <div class="card hero"><div class="row between wrap"><div><div class="pill">${esc(state.profile.goal)} · ${esc(state.profile.category)}</div><h2 style="font-size:32px;margin:12px 0 4px">Target ${state.profile.targetTotal}/300</h2><p>Paper 1: ${state.profile.targetP1}/100 · Paper 2: ${state.profile.targetP2}/200 · Historical reference cutoff: ${goalCut}</p></div><div><div class="result-ring" style="--pct:${readiness()}%"><strong>${readiness()}%</strong></div><div class="tiny" style="text-align:center;margin-top:8px">readiness estimate</div></div></div></div>
 <div class="grid cols-4" style="margin-top:16px">
  <div class="card metric"><div class="label">Syllabus coverage</div><strong>${coverage()}%</strong>${renderProgress(coverage())}<small>${allTopics().filter(t=>state.progress[t.id]?.studied).length}/${allTopics().length} topic nodes studied</small></div>
  <div class="card metric"><div class="label">Predicted score</div><strong>${pred.low}–${pred.high}</strong><small>Out of 300, based on ${pred.basis}. Estimate, not a guarantee.</small></div>
  <div class="card metric"><div class="label">Study streak</div><strong>${state.meta.streak||0} days</strong><small>${Math.round((state.meta.totalMinutes||0)/60)} tracked hours completed</small></div>
  <div class="card metric"><div class="label">Target status</div><strong style="font-size:25px">${risk}</strong><small>${Math.max(0,state.profile.targetTotal-pred.high)} marks above current optimistic estimate</small></div>
 </div>
 <div class="grid cols-2" style="margin-top:16px">
  <div class="card"><div class="row between"><div><h2>Today’s closed loop</h2><p>${done}/${tasks.length} tasks completed</p></div><span class="pill">${Math.round(tasks.reduce((a,t)=>a+t.minutes,0)/60*10)/10} h</span></div>${renderProgress(done/tasks.length*100,'lg')}<div class="stack" style="margin-top:14px">${tasks.map(taskHTML).join('')}</div></div>
  <div class="stack">
   <div class="card"><h2>Priority alert</h2>${priorityAlert()}</div>
   <div class="card"><h2>Paper balance</h2><div class="bar-list"><div class="bar-row"><span>Paper 1 mastery</span><div class="bar-track"><i style="width:${overallMastery('00')}%"></i></div><b>${overallMastery('00')}%</b></div><div class="bar-row"><span>Paper 2 mastery</span><div class="bar-track"><i style="width:${overallMastery('87')}%"></i></div><b>${overallMastery('87')}%</b></div></div></div>
   <div class="card"><h2>Next best action</h2><p>${nextActionText()}</p><button class="button secondary" data-route="learn">Open learning workspace</button></div>
  </div>
 </div>
 </section>`
}
function taskHTML(t){return `<div class="task ${t.done?'done':''}"><button class="task-check" data-action="toggle-task" data-id="${t.id}" aria-label="Toggle task">${t.done?'✓':''}</button><div><h4>${esc(t.type)} · ${esc(t.title)}</h4><p>${t.topicId?esc(topicById(t.topicId)?.unitName||''):'Mixed syllabus'}</p></div><span class="task-time">${t.minutes} min</span></div>`}
function priorityAlert(){const t=priorityTopics()[0];if(!t)return '<p>No topic data.</p>';return `<div class="alert warning"><strong>${esc(t.name)}</strong><div class="small">${esc(t.paperName)} · Unit ${t.unit}: ${esc(t.unitName)}</div><p>Mastery ${mastery(t.id)}%. It is currently prioritised by knowledge gap, importance, revision risk and time remaining.</p></div>`}
function nextActionText(){const t=getDailyTasks().find(x=>!x.done);return t?`Complete “${t.type}: ${t.title}” for about ${t.minutes} minutes. The plan will then update mastery and the next review date.`:'Today’s plan is complete. Use a timed mixed test or clear the revision queue.'}

function renderPlan(){
 const tasks=getDailyTasks(),days=examDays();let week='';for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()+i);const iso=d.toISOString().slice(0,10);const pri=priorityTopics().slice(i*2,i*2+2);week+=`<div class="card flat"><div class="row between"><strong>${i===0?'Today':d.toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'})}</strong><span class="tag">${Math.round(state.profile.hoursPerDay*60)} min</span></div><p class="small">${pri.map(x=>x.name).join(' · ')||'Adaptive revision and testing'}</p></div>`}
 return `<section class="page">${pageHead('Adaptive study plan','The plan is rebuilt from your target, available time, mastery, due revisions and recent mistakes.',`<button class="button ghost" data-action="regenerate-plan">Regenerate</button><button class="button" data-action="edit-target">Change target</button>`)}
 <div class="grid cols-3"><div class="card metric"><div class="label">Target date</div><strong style="font-size:23px">${fmtDate(state.profile.examDate)}</strong><small>${days===null?'Date required':days+' days remaining'}</small></div><div class="card metric"><div class="label">Weekly capacity</div><strong>${state.profile.hoursPerDay*state.profile.daysPerWeek} h</strong><small>${state.profile.daysPerWeek} study days × ${state.profile.hoursPerDay} hours</small></div><div class="card metric"><div class="label">Remaining workload</div><strong>${estimateHours()} h</strong><small>Adaptive estimate from unmastered concepts</small></div></div>
 <div class="grid cols-2" style="margin-top:16px"><div class="card"><h2>Today</h2><div class="stack">${tasks.map(taskHTML).join('')}</div></div><div class="card"><h2>Plan logic</h2><div class="alert"><strong>Priority formula</strong><p>Importance × knowledge gap × forgetting risk × deadline urgency ÷ estimated effort.</p></div><p>Missed work is redistributed across remaining study days. Revision and mock time are protected instead of being pushed entirely to the final week.</p><button class="button secondary" data-action="mark-missed">Simulate missed day</button></div></div>
 <div class="card" style="margin-top:16px"><h2>Seven-day preview</h2><div class="grid cols-3">${week}</div></div>
 </section>`
}
function estimateHours(){return Math.round(allTopics().reduce((a,t)=>a+(100-mastery(t.id))/100*(t.estimatedMinutes||60),0)/60)}

function renderSyllabus(){
 const papers=DATA.syllabus.papers.map(p=>`<div class="card"><div class="row between wrap"><div><h2>${esc(p.name)}</h2><p>${p.units.length} official units · ${p.units.reduce((a,u)=>a+u.topics.length,0)} mapped topic nodes</p></div><div><strong>${overallMastery(p.code)}% mastery</strong>${renderProgress(overallMastery(p.code))}</div></div><div class="stack">${p.units.map(u=>unitHTML(p,u)).join('')}</div></div>`).join('');
 return `<section class="page">${pageHead('Official syllabus map','The complete current Paper 1 and Computer Science Code 87 structure is converted into trackable learning nodes.',`<button class="button ghost" data-route="sources">Verify sources</button>`)}<div class="alert success"><strong>Verified snapshot:</strong> ${esc(DATA.syllabus.version)}. The app maps every official unit into concise trackable topic descriptions and retains links to the source documents.</div><div class="stack" style="margin-top:16px">${papers}</div></section>`
}
function unitHTML(p,u){const avg=Math.round(u.topics.reduce((a,t)=>a+mastery(t.id),0)/u.topics.length);return `<div class="unit"><button class="unit-head" data-action="toggle-unit"><div><h3>Unit ${u.number} · ${esc(u.name)}</h3><span class="small muted">${u.topics.length} topics</span></div><div class="mastery-badge">${avg}%<br><span class="muted">⌄</span></div></button><div class="unit-content">${u.topics.map(t=>`<div class="topic-row"><div><h4>${esc(t.name)}</h4><p>${esc(t.description)}</p><div class="tags"><span class="tag">Difficulty ${t.difficulty}/3</span><span class="tag">Importance ${t.importance}/5</span></div></div>${renderProgress(mastery(t.id))}<div><div class="mastery-badge">${mastery(t.id)}%</div><button class="button ghost compact" data-action="open-topic" data-id="${t.id}">Study</button></div></div>`).join('')}</div></div>`}

function selectedTopic(){const query=new URLSearchParams((location.hash.split('?')[1]||''));return topicById(query.get('topic'))||priorityTopics()[0]||allTopics()[0]}
function renderLearn(){
 const t=selectedTopic(),related=unitQuestions(t.paperCode==='00'?1:2,t.unit).slice(0,3),p=state.progress[t.id]||{},kit=(window.NETCRACKER_LESSONS||{})[`${t.paperCode==='00'?1:2}-${t.unit}`]||{};
 return `<section class="page">${pageHead('Learning workspace','Study one syllabus-linked concept, check understanding and create its revision schedule.',`<button class="button ghost" data-action="prev-topic" data-id="${t.id}">Previous</button><button class="button ghost" data-action="next-topic" data-id="${t.id}">Next</button>`)}
 <div class="grid cols-3"><div class="card" style="grid-column:span 2"><div class="tags"><span class="tag">${esc(t.paperName)}</span><span class="tag">Unit ${t.unit}</span><span class="tag">${mastery(t.id)}% mastery</span></div><h2 style="font-size:30px;margin-top:12px">${esc(t.name)}</h2><p style="font-size:17px">${esc(t.description)}</p><div class="divider"></div><h3>Unit foundation</h3><p>${esc(kit.overview||t.offlineNote)}</p>${kit.keyPoints?`<ul>${kit.keyPoints.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${kit.formulas?`<h3>Key formulas / rules</h3><div class="stack">${kit.formulas.map(x=>`<div class="alert">${esc(x)}</div>`).join('')}</div>`:''}${kit.traps?`<h3>Common traps</h3><ul>${kit.traps.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}<div class="divider"></div><h3>Active study method</h3><p>${esc(t.offlineNote)}</p><ol><li>Write the definition from memory.</li><li>List the properties, contrasts, algorithms or formulas in the official scope.</li><li>Create one correct example and one common trap.</li><li>Solve the linked practice without notes.</li><li>Rate confidence honestly; delayed recall will determine mastery.</li></ol><div class="field"><label for="topicNotes">Your local notes</label><textarea id="topicNotes" placeholder="Write a concise explanation in your own words…">${esc(state.notes[t.id]||'')}</textarea></div><div class="row wrap" style="margin-top:12px"><button class="button" data-action="save-topic" data-id="${t.id}">Save and mark studied</button><button class="button secondary" data-action="topic-practice" data-id="${t.id}">Practise this unit</button><button class="button ghost" data-action="ask-topic-ai" data-id="${t.id}">Ask AI tutor</button></div></div>
 <div class="stack"><div class="card"><h3>Mastery controls</h3><div class="field"><label for="confidenceRange">Confidence <span id="confidenceValue">${p.confidence||0}%</span></label><input id="confidenceRange" type="range" min="0" max="100" value="${p.confidence||0}"></div><div class="divider"></div><div class="small"><strong>Last studied:</strong> ${p.lastStudied?fmtDate(p.lastStudied):'Never'}<br><strong>Next review:</strong> ${p.nextReview?fmtDate(p.nextReview):'Not scheduled'}<br><strong>Reviews:</strong> ${p.reviews||0}</div></div><div class="card"><h3>Linked sample questions</h3>${related.map(q=>`<div class="small" style="margin-bottom:10px"><strong>${esc(q.question)}</strong><div class="muted">${esc(q.topic)}</div></div>`).join('')||'<p>No local questions mapped yet. Use unit practice.</p>'}</div></div></div>
 </section>`
}

function renderPractice(){
 if(testSession&&(testSession.type==='practice'||testSession.type==='official-pyq'))return renderTestEngine();
 const units=DATA.syllabus.papers.map((p,pi)=>`<optgroup label="${esc(p.name)}">${p.units.map(u=>`<option value="${pi+1}-${u.number}">Paper ${pi+1} · Unit ${u.number}: ${esc(u.name)}</option>`).join('')}</optgroup>`).join('');
 const yearOptions=[...CERTIFIED_INTERACTIVE_YEARS].sort((a,b)=>b-a).map(y=>`<option value="year-${y}">Official ${y} PYQs</option>`).join('');
 const pyqCount=officialScoreableCount;
 const origCount=DATA.questions.filter(q=>!q.isPyq).length;
 return `<section class="page">${pageHead('Practice engine','Build a timed or untimed test from the locally verified question bank. Wrong answers feed mistake intelligence.')}
 <div class="grid cols-2"><div class="card"><h2>Create a test</h2><div class="form-grid"><div class="field full"><label for="practiceScope">Scope</label><select id="practiceScope"><option value="mixed">Mixed verified bank</option><option value="pyq">All official PYQs (2015–2024)</option>${yearOptions}<option value="paper1">Paper 1 only</option><option value="paper2">Computer Science / current Paper 2 only</option>${units}</select></div><div class="field"><label for="practiceCount">Questions</label><select id="practiceCount"><option>5</option><option selected>10</option><option>20</option><option>30</option><option>50</option></select></div><div class="field"><label for="practiceTime">Time mode</label><select id="practiceTime"><option value="0">Untimed</option><option value="1">1 minute per question</option><option value="1.2" selected>72 seconds per question</option></select></div><div class="field full"><label for="practiceDifficulty">Difficulty</label><select id="practiceDifficulty"><option value="all">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option></select></div></div><button class="button" style="margin-top:16px" data-action="start-practice">Start practice</button></div>
 <div class="stack"><div class="card"><h2>Question bank summary</h2><div class="grid cols-3"><div><strong>${DATA.questions.length}</strong><div class="small muted">total MCQs</div></div><div><strong>${pyqCount}</strong><div class="small muted">scored, key-verified PYQs</div></div><div><strong>${origCount}</strong><div class="small muted">Original practice</div></div></div><div class="alert warning" style="margin-top:14px">All PYQs are stored as structured text with official option-index mappings. Where OCR is uncertain, the exact question is shown as an inline SVG reconstruction; no PDF or raster page image is required.</div></div><div class="card"><h2>Recent attempts</h2>${recentAttemptsHTML()}</div></div></div>
 </section>`
}
function recentAttemptsHTML(){const a=state.attempts.slice(-5).reverse();return a.length?a.map(x=>`<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--border)"><div><strong>${esc(x.type)}</strong><div class="tiny muted">${new Date(x.date).toLocaleString()}</div></div><div><strong>${x.score}/${x.maxScore}</strong><div class="tiny muted">${Math.round(x.accuracy)}%</div></div></div>`).join(''):'<div class="empty">No attempts yet.</div>'}
async function startPractice(scope,count,time,diff){
 try{
  if(scope==='pyq'||scope==='paper1'||scope==='paper2')await loadYears([...CERTIFIED_INTERACTIVE_YEARS].sort());
  else if(/^year-\d+$/.test(scope))await loadYear(Number(scope.slice(5)));
  let pool=DATA.questions.filter(q=>!q.dropped&&q.scored!==false);if(scope==='paper1')pool=pool.filter(q=>q.paper===1);else if(scope==='paper2')pool=pool.filter(q=>q.paper===2);else if(scope==='pyq')pool=pool.filter(q=>q.isPyq);else if(/^year-\d+$/.test(scope)){const y=Number(scope.slice(5));pool=pool.filter(q=>q.isPyq&&q.year===y)}else if(/^\d+-\d+$/.test(scope)){const [p,u]=scope.split('-').map(Number);pool=pool.filter(q=>q.paper===p&&q.unit===u)}if(diff!=='all')pool=pool.filter(q=>q.difficulty===diff);const qs=shuffle(pool).slice(0,Math.min(count,pool.length));if(!qs.length){toast('No scoreable questions match this filter.');return}startTest('practice',qs,time?Math.round(qs.length*time*60):0)
 }catch(e){toast(e.message)}
}
async function buildFullMock(){await loadYears([2019,2020,2021,2022,2023,2024]);const bank=DATA.questions.filter(q=>q.scored!==false&&!q.dropped&&q.isPyq&&q.year>=2019);const p1=shuffle(bank.filter(q=>q.paper===1)).slice(0,50);const p2=shuffle(bank.filter(q=>q.paper===2)).slice(0,100);return [...p1,...p2]}
function startTest(type,questions,duration){clearInterval(timerHandle);questions=questions.filter(q=>!q.dropped&&q.scored!==false);if(!questions.length){toast('No valid questions are available.');return}testSession={type,questions,answers:{},review:new Set(),index:0,duration,remaining:duration,started:Date.now(),submitted:false};if(duration)timerHandle=setInterval(tickTimer,1000);render()}
function tickTimer(){if(!testSession||!testSession.remaining)return;testSession.remaining--;const el=$('#timerDisplay');if(el)el.textContent=formatSeconds(testSession.remaining);if(testSession.remaining<=0){clearInterval(timerHandle);submitTest(true)}}
function formatSeconds(s){const h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=s%60;return `${h?String(h).padStart(2,'0')+':':''}${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}
function correctIndexes(q){return Array.isArray(q.answers)&&q.answers.length?q.answers:[q.answer]}
function isCorrect(q,selected){return correctIndexes(q).includes(selected)}
function correctText(q){return correctIndexes(q).map(index=>optionLabel(q,index)).join(' or ')}
function renderMock(){
 if(testSession&&testSession.type==='mock')return renderTestEngine();
 return `<section class="page">${pageHead('Full UGC-NET simulation','A 150-question, 300-mark, 180-minute simulation: Paper 1 has 50 questions and Paper 2 has 100. No negative marking.')}
 <div class="card hero"><h2>Full examination mode</h2><p>Each mock samples 50 Paper 1 and 100 Computer Science questions from the verified offline PYQ bank, allowing a complete current-format simulation. The interface includes a timer, question palette, review marks, autosaved answers during the active session and post-test analysis.</p><div class="grid cols-4"><div><strong>150</strong><div>questions</div></div><div><strong>300</strong><div>marks</div></div><div><strong>180</strong><div>minutes</div></div><div><strong>0</strong><div>negative marks</div></div></div><button class="button" style="margin-top:18px" data-action="start-mock">Begin full mock</button></div>
 <div class="grid cols-2" style="margin-top:16px"><div class="card"><h2>Before you start</h2><ul><li>Use a stable three-hour window.</li><li>Attempt every question because the official pattern has no negative marking.</li><li>Use “Mark for review” when uncertain.</li><li>Do not use the AI tutor during the simulation.</li></ul></div><div class="card"><h2>Mock history</h2>${state.attempts.filter(a=>a.type==='mock').length?recentAttemptsHTML():'<div class="empty">No full mock completed yet.</div>'}</div></div></section>`
}
function renderTestEngine(){
 if(!testSession)return '<section class="page"><div class="empty">No active test.</div></section>';if(testSession.submitted)return renderTestResult();
 const q=testSession.questions[testSession.index],sel=testSession.answers[q.id];
 return `<section class="page"><div class="page-head"><div><h1>${testSession.type==='mock'?'Full mock':'Practice test'}</h1><p>${testSession.questions.length} questions · ${testSession.duration?formatSeconds(testSession.duration):'untimed'}</p></div><div class="head-actions"><button class="button ghost" data-action="exit-test">Exit</button><button class="button danger" data-action="submit-test">Submit</button></div></div>
 <div class="quiz-layout"><div class="card question-card"><div class="row between wrap"><span class="q-number">Test position ${testSession.index+1} of ${testSession.questions.length}</span><div class="tags">${sourceBadge(q)}</div></div>${questionMetaHTML(q,true)}<div class="question-body">${questionDisplay(q)}</div><div class="options">${q.options.map((o,i)=>`<button class="option ${sel===i?'selected':''}" data-action="answer" data-value="${i}"><span class="option-index">${String.fromCharCode(65+i)}</span>${optionDisplay(q,o,i)}</button>`).join('')}</div><div class="row between wrap" style="margin-top:18px"><button class="button ghost" data-action="test-prev" ${testSession.index===0?'disabled':''}>Previous</button><button class="button secondary" data-action="toggle-review">${testSession.review.has(q.id)?'Unmark review':'Mark for review'}</button><button class="button" data-action="test-next">${testSession.index===testSession.questions.length-1?'Review test':'Save & next'}</button></div></div>
 <div class="card quiz-side"><div class="row between"><div><div class="tiny muted">Time remaining</div><div class="timer" id="timerDisplay">${testSession.duration?formatSeconds(testSession.remaining):'Untimed'}</div></div><div><strong>${Object.keys(testSession.answers).length}</strong><div class="tiny muted">answered</div></div></div><div class="divider"></div><div class="palette">${testSession.questions.map((x,i)=>`<button data-action="jump-question" data-index="${i}" class="${i===testSession.index?'current':''} ${testSession.answers[x.id]!==undefined?'answered':''} ${testSession.review.has(x.id)?'review':''}">${i+1}</button>`).join('')}</div><div class="divider"></div><div class="tiny muted">Green = answered · underline = marked for review</div></div></div></section>`
}
function submitTest(auto=false){if(!testSession||testSession.submitted)return;clearInterval(timerHandle);const qs=testSession.questions;let correct=0;const wrong=[];for(const q of qs){const a=testSession.answers[q.id];if(isCorrect(q,a))correct++;else wrong.push({questionId:q.id,selected:a,correct:correctIndexes(q),date:new Date().toISOString(),type:a===undefined?'unattempted':'conceptual/recall'})}const score=correct*2,maxScore=qs.length*2,accuracy=correct/qs.length*100;testSession.result={correct,wrong,score,maxScore,accuracy,auto};testSession.submitted=true;const att={id:crypto.randomUUID?.()||String(Date.now()),type:testSession.type,date:new Date().toISOString(),score,maxScore,accuracy,correct,total:qs.length,durationUsed:testSession.duration?testSession.duration-testSession.remaining:null,paper1Score:qs.filter(q=>q.paper===1&&isCorrect(q,testSession.answers[q.id])).length*2,paper2Score:qs.filter(q=>q.paper===2&&isCorrect(q,testSession.answers[q.id])).length*2};state.attempts.push(att);for(const q of qs){const tid=findTopicForQuestion(q);if(tid)updateProgress(tid,isCorrect(q,testSession.answers[q.id])?2:-1)}for(const w of wrong){const q=DATA.questions.find(x=>x.id===w.questionId);if(q&&!state.mistakes.some(m=>m.questionId===q.id&&!m.resolved))state.mistakes.push({...w,resolved:false,paper:q.paper,unit:q.unit,topic:q.topic,year:q.year||null})}updateStreak();saveState();render()}
function findTopicForQuestion(q){const p=DATA.syllabus.papers[q.paper-1],u=p?.units.find(x=>x.number===q.unit);if(!u)return null;const s=(q.topic||'').toLowerCase();return (u.topics.find(t=>t.name.toLowerCase().includes(s)||s.includes(t.name.toLowerCase().split(' ')[0]))||u.topics[0])?.id}
function renderTestResult(){const r=testSession.result,pct=Math.round(r.accuracy),wrongQs=r.wrong.slice(0,12).map(w=>({q:DATA.questions.find(q=>q.id===w.questionId),w})).filter(x=>x.q);return `<section class="page">${pageHead('Test analysis','Every error has been added to the local mistake notebook and weak concepts have been reprioritised.',`<button class="button" data-action="finish-test">Finish</button>`)}<div class="grid cols-3"><div class="card"><div class="result-ring" style="--pct:${pct}%"><strong>${r.score}/${r.maxScore}</strong></div></div><div class="card metric"><div class="label">Accuracy</div><strong>${pct}%</strong><small>${r.correct} correct · ${r.wrong.length} incorrect/unattempted</small></div><div class="card metric"><div class="label">Recoverable marks</div><strong>${r.wrong.length*2}</strong><small>Maximum marks represented by the reviewed errors</small></div></div><div class="card" style="margin-top:16px"><h2>Error review</h2>${wrongQs.length?wrongQs.map(({q,w})=>`<div class="mistake" style="margin-top:10px">${questionMetaHTML(q,true)}<div class="question-body review-question">${questionDisplay(q)}</div><div class="answer"><strong>Your choice:</strong> ${w.selected===undefined?'Unattempted':esc(optionLabel(q,w.selected))}<br><strong>Correct:</strong> ${esc(correctText(q))}</div><p>${esc(q.explanation)}</p><div style="margin-top:8px">${askAIButtonHTML(q, { selected: w.selected!==undefined?w.selected:'' })}</div></div>`).join(''):'<div class="alert success">Perfect score. Schedule delayed recall to confirm retention.</div>'}</div></section>`}

function renderRevision(){const due=dueTopics();const unresolved=state.mistakes.filter(m=>!m.resolved);const cards=[...due.map(t=>({kind:'topic',title:t.name,prompt:t.description,answer:t.offlineNote,id:t.id})),...unresolved.slice(0,20).map(m=>{const q=DATA.questions.find(x=>x.id===m.questionId);return q?{kind:'mistake',title:q.topic||`Paper ${q.paper} Unit ${q.unit}`,prompt:q.question,answer:`${correctText(q)} — ${q.explanation}`,id:m.questionId}:null}).filter(Boolean)];const card=cards.length?cards[revisionIndex%cards.length]:null;return `<section class="page">${pageHead('Revision and memory','Due concepts and past mistakes are converted into active-recall cards. Review intervals adapt to mastery.')}
 <div class="grid cols-3"><div class="card metric"><div class="label">Due concepts</div><strong>${due.length}</strong><small>Based on locally scheduled review dates</small></div><div class="card metric"><div class="label">Unresolved mistakes</div><strong>${unresolved.length}</strong><small>Questions requiring remediation</small></div><div class="card metric"><div class="label">Next interval</div><strong style="font-size:23px">1 · 3 · 7 · 21 days</strong><small>Adjusted according to performance</small></div></div>
 <div class="card" style="margin-top:16px;min-height:350px">${card?`<div class="tags"><span class="tag">${card.kind}</span><span class="tag">Card ${(revisionIndex%cards.length)+1}/${cards.length}</span></div><h2>${esc(card.title)}</h2><p style="font-size:19px">${esc(card.prompt)}</p><div id="revisionAnswer" class="alert" hidden><strong>Recall check</strong><p>${esc(card.answer)}</p></div><div class="row wrap" style="margin-top:18px"><button class="button secondary" data-action="show-revision-answer">Show answer</button><button class="button ghost" data-action="rate-revision" data-rating="hard" data-id="${card.id}" data-kind="${card.kind}">Hard</button><button class="button ghost" data-action="rate-revision" data-rating="good" data-id="${card.id}" data-kind="${card.kind}">Good</button><button class="button" data-action="rate-revision" data-rating="easy" data-id="${card.id}" data-kind="${card.kind}">Easy</button></div>`:'<div class="empty">Nothing is due. Complete learning sessions or practice questions to populate revision.</div>'}</div></section>`}
function rateRevision(kind,id,rating){if(kind==='topic'){updateProgress(id,rating==='easy'?9:rating==='good'?6:2,rating==='easy'?90:rating==='good'?70:40)}else{const m=state.mistakes.find(x=>x.questionId===id&&!x.resolved);if(m&&rating!=='hard')m.resolved=true;saveState()}revisionIndex++;render()}

function renderMistakes(){const ms=state.mistakes.slice().reverse();return `<section class="page">${pageHead('Mistake intelligence','Wrong answers are retained locally, classified and converted into remediation and revision actions.',`<button class="button ghost" data-action="clear-resolved">Remove resolved</button>`)}<div class="grid cols-3"><div class="card metric"><div class="label">Total logged</div><strong>${ms.length}</strong></div><div class="card metric"><div class="label">Unresolved</div><strong>${ms.filter(m=>!m.resolved).length}</strong></div><div class="card metric"><div class="label">Marks represented</div><strong>${ms.filter(m=>!m.resolved).length*2}</strong></div></div><div class="stack" style="margin-top:16px">${ms.length?ms.map(m=>mistakeHTML(m)).join(''):'<div class="empty">Your mistake notebook is empty. Practice answers will appear here.</div>'}</div></section>`}
function mistakeHTML(m){const q=DATA.questions.find(x=>x.id===m.questionId);if(!q)return '';return `<div class="card mistake ${m.resolved?'muted':''}"><div class="row between wrap"><div class="tags"><span class="tag">Paper ${q.paper}</span><span class="tag">Unit ${q.unit}</span><span class="tag">${esc(m.type)}</span></div><span class="pill">${m.resolved?'Resolved':'Needs work'}</span></div>${questionMetaHTML(q,true)}<div class="question-body review-question">${questionDisplay(q)}</div><div class="answer"><strong>Your answer:</strong> ${m.selected===undefined?'Unattempted':esc(optionLabel(q,m.selected))}<br><strong>Correct:</strong> ${esc(correctText(q))}</div><p>${esc(q.explanation)}</p><div class="row wrap" style="margin-top:8px"><button class="button ${m.resolved?'ghost':'secondary'} compact" data-action="toggle-mistake" data-id="${q.id}">${m.resolved?'Reopen':'Mark resolved'}</button>${askAIButtonHTML(q, { selected: m.selected!==undefined?m.selected:'' })}</div></div>`}

function renderAnalytics(){
 const pred=predictedScore(),units=[];for(const p of DATA.syllabus.papers)for(const u of p.units){const avg=Math.round(u.topics.reduce((a,t)=>a+mastery(t.id),0)/u.topics.length);units.push({name:`P${p.code==='00'?1:2} U${u.number}`,full:u.name,value:avg})}
 const attempts=state.attempts.slice(-10),points=attempts.map((a,i)=>`${i*(300/Math.max(1,attempts.length-1))},${120-a.accuracy*1.05}`).join(' ');
 return `<section class="page">${pageHead('Readiness analytics','Every visual answers a preparation decision: what is weak, what is being forgotten and how far the score target is.')}
 <div class="grid cols-4"><div class="card metric"><div class="label">Readiness</div><strong>${readiness()}%</strong></div><div class="card metric"><div class="label">Mastery</div><strong>${overallMastery()}%</strong></div><div class="card metric"><div class="label">Forecast</div><strong>${pred.low}–${pred.high}</strong></div><div class="card metric"><div class="label">Target gap</div><strong>${Math.max(0,state.profile.targetTotal-pred.high)}</strong></div></div>
 <div class="grid cols-2" style="margin-top:16px"><div class="card"><h2>Unit mastery</h2><div class="bar-list">${units.map(u=>`<div class="bar-row" title="${esc(u.full)}"><span>${u.name}</span><div class="bar-track"><i style="width:${u.value}%"></i></div><b>${u.value}%</b></div>`).join('')}</div></div><div class="card"><h2>Attempt accuracy trend</h2>${attempts.length?`<svg class="spark" viewBox="0 0 300 130" role="img" aria-label="Accuracy trend"><line x1="0" y1="120" x2="300" y2="120" stroke="currentColor" opacity=".2"/><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="small muted">Last ${attempts.length} attempts</div>`:'<div class="empty">Complete tests to build a trend.</div>'}</div></div>
 <div class="card" style="margin-top:16px"><h2>Syllabus heat map</h2><div class="heat-grid">${units.map(u=>`<div class="heat-cell heat-${u.value===0?0:u.value<35?1:u.value<60?2:u.value<80?3:4}" title="${esc(u.full)}: ${u.value}%"><strong>${u.name}</strong><span>${u.value}%</span></div>`).join('')}</div></div>
 <div class="grid cols-2" style="margin-top:16px"><div class="card"><h2>Lost marks by unit</h2>${lostMarksHTML()}</div><div class="card"><h2>Feasibility</h2>${feasibilityHTML()}</div></div></section>`
}
function lostMarksHTML(){const counts={};state.mistakes.filter(m=>!m.resolved).forEach(m=>{const k=`P${m.paper} U${m.unit}`;counts[k]=(counts[k]||0)+2});const es=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10);return es.length?`<div class="bar-list">${es.map(([k,v])=>`<div class="bar-row"><span>${k}</span><div class="bar-track"><i style="width:${Math.min(100,v*5)}%"></i></div><b>${v}</b></div>`).join('')}</div>`:'<div class="empty">No unresolved errors.</div>'}
function feasibilityHTML(){const rem=estimateHours(),days=examDays(),weekly=state.profile.hoursPerDay*state.profile.daysPerWeek,available=days===null?null:Math.round(days/7*weekly);if(available===null)return '<div class="alert warning">Set an exam date to calculate available study time.</div>';const status=available>=rem?'Achievable at current capacity':'Capacity gap';return `<div class="alert ${available>=rem?'success':'danger'}"><strong>${status}</strong><p>Estimated required: ${rem} h<br>Estimated available: ${available} h<br>Difference: ${available-rem} h</p></div><p class="small muted">This estimate is based on mapped topic effort and mastery, not a promise of qualification.</p>`}


function getModelCapability(providerId, modelId) {
  providerId = providerId || state.settings.aiProvider;
  modelId = modelId || getEffectiveModelId();

  if (providerId === 'custom') {
    const isVision = Boolean(state.settings.customModelVisionSupport);
    return {
      visionSupport: isVision ? 'verified' : 'unknown',
      visualQuestionSupport: isVision,
      inputModalities: isVision ? ['text', 'image'] : ['text'],
      outputModalities: ['text'],
      supportedImageTypes: ['image/png', 'image/jpeg'],
      maxImages: null,
      maxImageBytes: null,
      capabilitySource: isVision ? 'custom-declared' : 'unknown',
      imageFormat: state.settings.customModelImageFormat || 'openai-chat'
    };
  }

  const cacheKey = `${providerId}:${modelId}`;
  if (state.settings.aiModelCapabilities?.[cacheKey]) {
    return state.settings.aiModelCapabilities[cacheKey];
  }

  const curatedModels = getProviderModels(providerId);
  const curated = curatedModels.find(m => m.id === modelId);
  if (curated) {
    return {
      visionSupport: curated.visionSupport || 'unsupported',
      visualQuestionSupport: Boolean(curated.visualQuestionSupport),
      inputModalities: curated.inputModalities || ['text'],
      outputModalities: curated.outputModalities || ['text'],
      supportedImageTypes: curated.supportedImageTypes || [],
      maxImages: curated.maxImages || null,
      maxImageBytes: curated.maxImageBytes || null,
      capabilitySource: curated.capabilitySource || 'curated-official',
      stability: curated.stability || 'stable'
    };
  }

  const discovered = window.NETCRACKER_DISCOVERED_MODELS?.[providerId] || [];
  const disc = discovered.find(d => d.id === modelId);
  if (disc && disc.visionSupport) {
    return disc;
  }

  return {
    visionSupport: 'unknown',
    visualQuestionSupport: false,
    inputModalities: ['text'],
    outputModalities: ['text'],
    supportedImageTypes: ['image/png', 'image/jpeg'],
    maxImages: null,
    maxImageBytes: null,
    capabilitySource: 'unknown'
  };
}

function getCompatibleVisionModels() {
  const list = [];
  const currentProvider = state.settings.aiProvider;
  for (const p of AI_CATALOG.providers) {
    for (const m of p.models || []) {
      if (m.visionSupport === 'verified') {
        list.push({
          providerId: p.providerId,
          providerLabel: p.label,
          modelId: m.id,
          modelLabel: m.label,
          tier: m.tier,
          recommended: m.recommended,
          stability: m.stability,
          isCurrentProvider: p.providerId === currentProvider
        });
      }
    }
  }
  return list;
}

function decideVisualAIRequest(question, selectedProviderId = null, selectedModelId = null, userIntent = 'auto') {
  const providerId = selectedProviderId || state?.settings?.aiProvider || 'gemini';
  const modelId = selectedModelId || (typeof getEffectiveModelId === 'function' ? getEffectiveModelId() : 'gemini-3.6-flash');
  const vMeta = window.classifyVisualQuestion ? window.classifyVisualQuestion(question) : { visualRequirement: 'none', textFallbackQuality: 'complete' };
  const cap = getModelCapability(providerId, modelId);
  const hasConsent = Boolean(state.settings.aiVisualConsent?.[providerId]);

  if (vMeta.visualRequirement === 'none') {
    return {
      action: 'send-text-only',
      reason: 'text-only-question',
      requiresConsent: false,
      canProceed: true,
      recommendedModels: []
    };
  }

  if (vMeta.visualRequirement === 'supplementary') {
    if (cap.visionSupport === 'verified') {
      if (userIntent === 'text') {
        return {
          action: 'send-text-only',
          reason: 'supplementary-visual-text-intent',
          requiresConsent: false,
          canProceed: true,
          recommendedModels: []
        };
      }
      return {
        action: 'send-text-and-image',
        reason: 'supplementary-visual-verified-vision',
        requiresConsent: !hasConsent,
        canProceed: true,
        recommendedModels: []
      };
    }
    if (cap.visionSupport === 'unsupported') {
      return {
        action: 'offer-text-fallback',
        reason: 'supplementary-visual-unsupported-model',
        requiresConsent: false,
        canProceed: true,
        recommendedModels: getCompatibleVisionModels()
      };
    }
    return {
      action: 'require-capability-test',
      reason: 'supplementary-visual-unknown-model',
      requiresConsent: true,
      canProceed: false,
      recommendedModels: getCompatibleVisionModels()
    };
  }

  // Essential visual
  if (cap.visionSupport === 'verified') {
    return {
      action: 'send-text-and-image',
      reason: 'essential-visual-verified-vision',
      requiresConsent: !hasConsent,
      canProceed: true,
      recommendedModels: []
    };
  }

  if (cap.visionSupport === 'unsupported') {
    if (vMeta.textFallbackQuality === 'complete') {
      return {
        action: 'offer-text-fallback',
        reason: 'essential-visual-complete-fallback-unsupported-model',
        requiresConsent: false,
        canProceed: true,
        recommendedModels: getCompatibleVisionModels()
      };
    }
    return {
      action: 'require-model-switch',
      reason: 'essential-visual-insufficient-fallback-unsupported-model',
      requiresConsent: false,
      canProceed: false,
      recommendedModels: getCompatibleVisionModels()
    };
  }

  return {
    action: 'require-capability-test',
    reason: 'essential-visual-unknown-model',
    requiresConsent: true,
    canProceed: false,
    recommendedModels: getCompatibleVisionModels()
  };
}

async function renderQuestionSheetToPNG(q) {
  if (!q) throw new Error('No question provided to renderer');

  const pres = resolveQuestionPresentation(q);
  const passage = q.passage ? `<div style="background:#f8fafc; border-left:4px solid #3b82f6; padding:12px; margin-bottom:14px; border-radius:6px; font-size:14px; color:#334155;"><strong>Shared Passage / Context:</strong><br>${esc(q.passage)}</div>` : '';
  const questionText = hasNativeQuestion(q) ? `<div style="font-size:16px; font-weight:700; color:#0f172a; margin-bottom:14px; line-height:1.5;">${esc(nativeQuestion(q))}</div>` : (q.question ? `<div style="font-size:16px; font-weight:700; color:#0f172a; margin-bottom:14px; line-height:1.5;">${esc(q.question)}</div>` : '');
  const stemSvg = q.stemVectorSvg ? `<div style="margin-bottom:14px; text-align:center;">${safeVector(q.stemVectorSvg)}</div>` : '';
  const sourceVectors = (pres.primaryMode === 'source-vector-fallback' && Array.isArray(q.sourceVectorSvgs)) ? q.sourceVectorSvgs.map(safeVector).filter(Boolean).map(s => `<div style="margin-bottom:14px; text-align:center;">${s}</div>`).join('') : '';

  const optionsHTML = (q.options || []).map((o, i) => {
    const label = String.fromCharCode(65 + i);
    const svg = Array.isArray(q.optionVectorSvgs) ? safeVector(q.optionVectorSvgs[i]) : '';
    const alt = Array.isArray(q.optionAlt) ? q.optionAlt[i] : '';
    const text = optionTextValid(o) ? String(o) : (alt || `Option ${label}`);
    return `
      <div style="display:flex; align-items:flex-start; gap:12px; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:8px; padding:12px 14px;">
        <div style="font-weight:800; font-size:14px; color:#1e293b; background:#e2e8f0; width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${label}</div>
        <div style="font-size:15px; color:#0f172a; flex:1; line-height:1.4;">
          <div>${esc(text)}</div>
          ${svg ? `<div style="margin-top:8px;">${svg}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  const header = `
    <div style="border-bottom:2px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:12px; font-weight:800; letter-spacing:0.05em; color:#64748b; text-transform:uppercase;">
          UGC-NET ${q.year || ''} ${q.paper ? '· Paper ' + q.paper : ''} ${q.unit ? '· Unit ' + q.unit : ''}
        </div>
        <div style="font-size:18px; font-weight:800; color:#0f172a; margin-top:2px;">
          Question ${q.questionNumber || '—'} <span style="font-size:12px; font-weight:400; color:#64748b;">(ID: ${esc(q.questionId || q.id)})</span>
        </div>
      </div>
      <div style="font-size:11px; color:#94a3b8; font-weight:600;">NETCracker AI Visual Sheet</div>
    </div>
  `;

  const content = `
    <div xmlns="http://www.w3.org/1999/xhtml" style="background:#ffffff; color:#0f172a; font-family:system-ui, -apple-system, sans-serif; padding:24px; box-sizing:border-box; width:800px; max-width:800px; border-radius:12px;">
      ${header}
      ${passage}
      ${questionText}
      ${stemSvg}
      ${sourceVectors}
      <div style="display:flex; flex-direction:column; gap:10px; margin-top:14px;">
        ${optionsHTML}
      </div>
    </div>
  `;

  let height = 800;
  if (typeof document !== 'undefined' && document.body && typeof document.body.appendChild === 'function') {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '800px';
    container.innerHTML = content;
    document.body.appendChild(container);
    height = Math.max(300, Math.min(4000, container.offsetHeight || 800));
    document.body.removeChild(container);
  }

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${height}">
    <foreignObject width="100%" height="100%">
      ${content}
    </foreignObject>
  </svg>`;

  if (typeof Image === 'undefined' || typeof document === 'undefined') {
    const base64 = Buffer.from(svgString).toString('base64');
    return {
      dataUrl: `data:image/svg+xml;base64,${base64}`,
      base64,
      width: 800,
      height,
      byteSize: svgString.length,
      mimeType: 'image/svg+xml'
    };
  }

  function toB64(str) {
    if (typeof Buffer !== 'undefined') return Buffer.from(str).toString('base64');
    if (typeof btoa !== 'undefined') return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p1) => String.fromCharCode(parseInt(p1, 16))));
    return '';
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const dataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

    img.onload = () => {
      let dataUrl = '';
      let base64 = '';
      let byteSize = 0;
      let mimeType = 'image/png';

      try {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = height;
        let ctx = null;
        try { ctx = canvas.getContext('2d'); } catch (ce) {}

        if (ctx) {
          try {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 800, height);
            ctx.drawImage(img, 0, 0);
            dataUrl = canvas.toDataURL('image/png');
            base64 = dataUrl.split(',')[1];
            byteSize = Math.round((base64.length * 3) / 4);
          } catch (taintErr) {
            base64 = toB64(svgString);
            dataUrl = `data:image/svg+xml;base64,${base64}`;
            byteSize = svgString.length;
            mimeType = 'image/svg+xml';
          }
        } else {
          base64 = toB64(svgString);
          dataUrl = `data:image/svg+xml;base64,${base64}`;
          byteSize = svgString.length;
          mimeType = 'image/svg+xml';
        }

        resolve({
          dataUrl,
          base64,
          width: 800,
          height,
          byteSize,
          mimeType
        });
      } catch (e) {
        reject(new Error('Question-sheet rendering failed: ' + e.message));
      }
    };

    img.onerror = () => {
      reject(new Error('Question-sheet rendering failed during image load'));
    };

    img.src = dataUri;
  });
}

function buildAskAIVisualPrompt(q, assistanceMode = 'explain-official', selectedChoice = null, isAttachedImage = false, isStructuredFallback = false) {
  const optionsText = (q.options || []).map((o, i) => `${String.fromCharCode(65 + i)}) ${optionLabel(q, i)}`).join('\n');
  const userChoiceText = selectedChoice !== null && selectedChoice !== undefined && selectedChoice !== '' ? `\nStudent selected answer: ${String.fromCharCode(65 + Number(selectedChoice))}) ${optionLabel(q, Number(selectedChoice))}` : '';
  const qtext = hasNativeQuestion(q) ? nativeQuestion(q) : (q.question || 'See attached visual diagram');

  let prompt = `You are analysing a UGC-NET Paper ${q.paper} (Unit ${q.unit}: ${q.topic || 'Syllabus topic'}) multiple-choice question.\n\nQuestion ID: ${q.questionId || q.id}\nQuestion Number: ${q.questionNumber || '—'}\nYear: ${q.year || ''}\nQuestion text: ${qtext}\nOptions:\n${optionsText}${userChoiceText}\n`;

  if (isAttachedImage) {
    prompt += `\n[AN ATTACHED IMAGE IS PROVIDED: An exact PNG question sheet containing the stem diagram, text, and option diagrams is attached with this request.]\nThe option labels A, B, C and D in the attached image are authoritative.\n`;
  } else if (isStructuredFallback) {
    const vMeta = window.classifyVisualQuestion ? window.classifyVisualQuestion(q) : {};
    prompt += `\n[STRUCTURED DESCRIPTION FALLBACK USED: The model selected is text-only. High-fidelity structured description: ${vMeta.semanticVisualDescription || q.explanation || 'Refer to text breakdown'}]\n`;
  }

  if (assistanceMode === 'hint') {
    prompt += `\nAssistance Mode: HINT ONLY.\nProvide a helpful conceptual hint without revealing the correct option key (A, B, C or D). Direct the student's thinking toward the core concept.`;
  } else if (assistanceMode === 'concept') {
    prompt += `\nAssistance Mode: CONCEPT EXPLANATION.\nExplain the underlying core concept tested by this question in detail. Do not state the final answer option unless required for conceptual clarity.`;
  } else if (assistanceMode === 'why-wrong') {
    const correctLabel = correctIndexes(q).map(i => `${String.fromCharCode(65 + i)}) ${optionLabel(q, i)}`).join(' or ');
    prompt += `\nAssistance Mode: WHY MY ANSWER WAS WRONG.\nOfficial correct answer: ${correctLabel}.\nExplain why the student's choice was incorrect and how it differs conceptually from the correct option.`;
  } else if (assistanceMode === 'solve-independent') {
    prompt += `\nAssistance Mode: INDEPENDENT SOLUTION.\nSolve this question step by step independently. Conclude with your recommended answer option (A, B, C or D).`;
  } else {
    // explain-official
    const correctLabel = correctIndexes(q).map(i => `${String.fromCharCode(65 + i)}) ${optionLabel(q, i)}`).join(' or ');
    prompt += `\nAssistance Mode: EXPLAIN OFFICIAL ANSWER.\nOfficial correct answer: ${correctLabel}.\nBasic explanation: ${q.explanation || 'None'}\n\nPlease provide:\n1. Step-by-step conceptual breakdown\n2. Option-by-option analysis (why correct option is right and incorrect options are wrong)\n3. Key formula, diagram summary or memory tip for the exam.`;
  }

  return prompt;
}

async function runVisualCapabilityTest(providerId, modelId) {
  let dataUrl, base64;
  if (typeof document !== 'undefined' && document.createElement) {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 120, 40);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('NET A B C D', 10, 26);
    dataUrl = canvas.toDataURL('image/png');
    base64 = dataUrl.split(',')[1];
  } else {
    base64 = Buffer.from('NET A B C D').toString('base64');
    dataUrl = `data:image/png;base64,${base64}`;
  }

  const imagePayload = { dataUrl, base64, mimeType: 'image/png' };
  const testPrompt = 'Read the four letters shown in the image and reply exactly:\nA B C D';
  const answer = await callAI(testPrompt, false, imagePayload);

  if (answer && answer.toUpperCase().includes('A B C D')) {
    if (!state.settings.aiModelCapabilities) state.settings.aiModelCapabilities = {};
    state.settings.aiModelCapabilities[`${providerId}:${modelId}`] = {
      visionSupport: 'verified',
      visualQuestionSupport: true,
      inputModalities: ['text', 'image'],
      outputModalities: ['text'],
      supportedImageTypes: ['image/png', 'image/jpeg'],
      capabilitySource: 'student-tested',
      testedDate: new Date().toISOString()
    };
    saveState();
    return true;
  }
  throw new Error(`Capability test failed. Model responded: "${answer.slice(0, 100)}", expected "A B C D".`);
}

function showVisualConsentModal(providerId, onConsent) {
  const cfg = getProviderConfig(providerId);
  const providerLabel = cfg ? cfg.label : providerId;
  $('#modalRoot').innerHTML = `
    <div class="modal-backdrop" id="visualConsentModal">
      <div class="modal">
        <div class="row between">
          <h2>Visual AI Privacy Consent</h2>
          <button class="icon-button" data-action="close-modal">×</button>
        </div>
        <p>NETCracker will generate a temporary in-memory image containing this question, its diagram and its options.</p>
        <p>The image and structured question text will be sent directly to: <strong>${esc(providerLabel)}</strong>.</p>
        <div class="alert warning small" style="margin-top:10px">
          The image is generated dynamically in memory and is not added to your backups, offline question archive, or device storage.
        </div>
        <div class="row wrap" style="margin-top:18px">
          <button class="button" id="trustProviderBtn">Trust ${esc(providerLabel)} for future visual questions</button>
          <button class="button secondary" id="onceConsentBtn">Continue once</button>
          <button class="button ghost" data-action="close-modal">Cancel</button>
        </div>
      </div>
    </div>
  `;
  bindView();
  $('#trustProviderBtn').onclick = () => {
    if (!state.settings.aiVisualConsent) state.settings.aiVisualConsent = {};
    state.settings.aiVisualConsent[providerId] = true;
    saveState();
    $('#modalRoot').innerHTML = '';
    onConsent();
  };
  $('#onceConsentBtn').onclick = () => {
    $('#modalRoot').innerHTML = '';
    onConsent();
  };
}

function showModelSwitchModal(q, selectedChoice, assistanceMode) {
  const models = getCompatibleVisionModels();
  const optionsHTML = models.map(m => `
    <div class="card flat" style="border:1px solid var(--border); padding:12px; margin-top:8px;">
      <div class="row between wrap">
        <div>
          <strong>${esc(m.providerLabel)} — ${esc(m.modelLabel)}</strong>
          <div class="small muted">${esc(m.tier)} · Verified Vision</div>
        </div>
        <button class="button compact" data-action="switch-and-ask" data-provider="${esc(m.providerId)}" data-model="${esc(m.modelId)}">Switch &amp; Ask</button>
      </div>
    </div>
  `).join('');

  $('#modalRoot').innerHTML = `
    <div class="modal-backdrop" id="modelSwitchModal">
      <div class="modal">
        <div class="row between">
          <h2>Vision-Capable Model Required</h2>
          <button class="icon-button" data-action="close-modal">×</button>
        </div>
        <div class="alert danger small" style="margin-top:10px">
          This question contains essential visual content and cannot be analysed reliably with the selected text-only model.
        </div>
        <p style="margin-top:12px">Select a verified vision-capable model below:</p>
        <div style="max-height:50vh; overflow:auto;">
          ${optionsHTML}
        </div>
        <div class="row wrap" style="margin-top:16px">
          <button class="button ghost" data-action="close-modal">Cancel</button>
        </div>
      </div>
    </div>
  `;
  bindView();
  $$('[data-action="switch-and-ask"]').forEach(btn => {
    btn.onclick = () => {
      const p = btn.dataset.provider;
      const m = btn.dataset.model;
      state.settings.aiProvider = p;
      saveCurrentModelForProvider(p, m);
      state.settings.aiModel = m;
      saveState();
      $('#modalRoot').innerHTML = '';
      askQuestionAI(q.id, selectedChoice, assistanceMode, 'visual');
    };
  });
}

function showCapabilityTestModal(providerId, modelId, q, selectedChoice, assistanceMode) {
  $('#modalRoot').innerHTML = `
    <div class="modal-backdrop" id="capabilityTestModal">
      <div class="modal">
        <div class="row between">
          <h2>Vision Support Unverified</h2>
          <button class="icon-button" data-action="close-modal">×</button>
        </div>
        <div class="alert warning small" style="margin-top:10px">
          Vision support for <strong>${esc(modelId)}</strong> has not been verified.
        </div>
        <p>Run a quick capability test to verify whether this model can read image inputs.</p>
        <div class="row wrap" style="margin-top:18px">
          <button class="button" id="runTestBtn">Test visual support</button>
          <button class="button secondary" id="switchModelBtn">Switch model</button>
          <button class="button ghost" data-action="close-modal">Cancel</button>
        </div>
      </div>
    </div>
  `;
  bindView();
  $('#runTestBtn').onclick = async () => {
    const btn = $('#runTestBtn');
    btn.disabled = true;
    btn.textContent = 'Testing…';
    try {
      await runVisualCapabilityTest(providerId, modelId);
      toast('Visual support verified!');
      $('#modalRoot').innerHTML = '';
      askQuestionAI(q.id, selectedChoice, assistanceMode, 'visual');
    } catch (e) {
      toast(`Capability test failed: ${e.message}`);
      btn.disabled = false;
      btn.textContent = 'Test visual support';
    }
  };
  $('#switchModelBtn').onclick = () => {
    $('#modalRoot').innerHTML = '';
    showModelSwitchModal(q, selectedChoice, assistanceMode);
  };
}

function showStructuredFallbackOfferModal(q, selectedChoice, assistanceMode) {
  $('#modalRoot').innerHTML = `
    <div class="modal-backdrop" id="fallbackOfferModal">
      <div class="modal">
        <div class="row between">
          <h2>Essential Visual Content Notice</h2>
          <button class="icon-button" data-action="close-modal">×</button>
        </div>
        <p>This question contains essential visual content.</p>
        <p>The selected model does not support images. A reviewed structured description is available.</p>
        <div class="row wrap" style="margin-top:18px">
          <button class="button" id="useDescriptionBtn">Ask using structured description</button>
          <button class="button secondary" id="switchVisionModelBtn">Switch to a vision model</button>
          <button class="button ghost" data-action="close-modal">Cancel</button>
        </div>
      </div>
    </div>
  `;
  bindView();
  $('#useDescriptionBtn').onclick = () => {
    $('#modalRoot').innerHTML = '';
    executeAskAIVisual(q, selectedChoice, assistanceMode, false);
  };
  $('#switchVisionModelBtn').onclick = () => {
    $('#modalRoot').innerHTML = '';
    showModelSwitchModal(q, selectedChoice, assistanceMode);
  };
}

function showQuestionSheetPreviewModal(q) {
  toast('Rendering AI question sheet preview…');
  renderQuestionSheetToPNG(q).then(sheet => {
    $('#modalRoot').innerHTML = `
      <div class="modal-backdrop" id="sheetPreviewModal">
        <div class="modal wide">
          <div class="row between">
            <h2>AI Question Sheet Preview</h2>
            <button class="icon-button" data-action="close-modal">×</button>
          </div>
          <div class="tags" style="margin:10px 0;">
            <span class="tag success">${sheet.width} × ${sheet.height} px</span>
            <span class="tag">${Math.round(sheet.byteSize / 1024)} KB</span>
            <span class="tag">PNG format</span>
            <span class="tag">In-memory only</span>
          </div>
          <div style="max-height:60vh; overflow:auto; border:1px solid var(--border); border-radius:12px; background:#fff; text-align:center; padding:12px;">
            <img src="${sheet.dataUrl}" style="max-width:100%; height:auto; display:block; margin:0 auto;" alt="AI question sheet preview">
          </div>
          <p class="small muted" style="margin-top:10px;">This exact high-contrast PNG is sent in memory to vision-capable models with option labels A, B, C, D rendered into the image.</p>
          <div class="row wrap" style="margin-top:14px;">
            <button class="button" data-action="close-modal">Close preview</button>
          </div>
        </div>
      </div>
    `;
    bindView();
  }).catch(e => {
    toast(`Preview failed: ${e.message}`);
  });
}

async function executeAskAIVisual(q, selectedChoice = null, assistanceMode = 'explain-official', useImage = false) {
  if (!navigator.onLine) {
    toast('AI analysis requires internet access. The question, diagram and all offline study tools remain available.');
    return;
  }

  const pLabel = () => { const c = getProviderConfig(state.settings.aiProvider); return c ? c.label : state.settings.aiProvider; };
  const modelId = getEffectiveModelId();

  toast(`Sending request to ${pLabel()} (${modelId})…`);
  routeTo('tutor');

  const log = $('#chatLog');
  if (log) {
    log.insertAdjacentHTML('beforeend', `<div class="message ai" id="typingMsg">Rendering question sheet and generating AI analysis…</div>`);
    log.scrollTop = log.scrollHeight;
  }

  try {
    let sheet = null;
    if (useImage) {
      sheet = await renderQuestionSheetToPNG(q);
    }
    const isFallback = !useImage && window.classifyVisualQuestion && window.classifyVisualQuestion(q).visualRequirement !== 'none';
    const prompt = buildAskAIVisualPrompt(q, assistanceMode, selectedChoice, useImage, isFallback);

    let answer = await callAI(prompt, false, sheet);

    if (assistanceMode === 'solve-independent') {
      const match = answer.match(/\b([A-D])\b/i);
      const official = correctText(q);
      const isMatch = match && official.toUpperCase().includes(match[1].toUpperCase());
      const statusNote = isMatch ? `\n\n✓ AI answer agrees with official key (${official})` : `\n\n⚠ AI answer differs from official key (Official: ${official})`;
      answer += statusNote;
    }

    state.chats.push({ role: 'user', content: `[Ask AI for Question ${q.questionNumber || q.id}] Mode: ${assistanceMode}`, date: new Date().toISOString() });
    state.chats.push({ role: 'assistant', content: answer, date: new Date().toISOString() });
    saveState();
    render();
  } catch (e) {
    const errorMsg = `Visual AI request failed: ${e.message}. Your test timer, answers and local progress are completely safe.`;
    state.chats.push({ role: 'assistant', content: errorMsg, date: new Date().toISOString() });
    saveState();
    render();
    toast(e.message);
  }
}

function askAIButtonHTML(q, options = {}) {
  const { selected = '', mode = 'explain-official' } = options;
  const vMeta = window.classifyVisualQuestion ? window.classifyVisualQuestion(q) : { visualRequirement: 'none', textFallbackQuality: 'complete' };
  const decision = decideVisualAIRequest(q);

  let label = '✦ Ask AI';
  let btnClass = 'button ghost compact';
  let badgeHTML = '';

  if (vMeta.visualRequirement !== 'none') {
    badgeHTML += `<span class="tag warning">Visual (${esc(vMeta.visualRequirement)})</span>`;
    if (decision.action === 'send-text-and-image') {
      label = '✦ Ask AI with visual';
      btnClass = 'button secondary compact';
      badgeHTML += `<span class="tag success">Vision ready</span>`;
    } else if (decision.action === 'offer-text-fallback') {
      label = '✦ Ask AI using description';
      badgeHTML += `<span class="tag">Structured fallback</span>`;
    } else if (decision.action === 'require-model-switch') {
      label = '✦ Switch model to ask AI';
      btnClass = 'button danger compact';
      badgeHTML += `<span class="tag danger">Vision model required</span>`;
    } else if (decision.action === 'require-capability-test') {
      label = '✦ Verify visual support';
      badgeHTML += `<span class="tag warning">Vision unverified</span>`;
    }
  } else {
    const cap = getModelCapability(state.settings.aiProvider, getEffectiveModelId());
    if (cap.visionSupport === 'verified') {
      badgeHTML += `<span class="tag success">Vision model</span>`;
    } else if (cap.visionSupport === 'unsupported') {
      badgeHTML += `<span class="tag">Text-only model</span>`;
    }
  }

  return `
    <div class="row wrap" style="align-items:center; gap:6px;">
      <button class="${btnClass}" data-action="ask-question-ai" data-id="${esc(q.id)}" data-selected="${selected !== null && selected !== undefined ? esc(selected) : ''}" data-mode="${esc(mode)}">${esc(label)}</button>
      ${vMeta.visualRequirement !== 'none' ? `<button class="button ghost compact" data-action="preview-question-sheet" data-id="${esc(q.id)}" title="Preview AI question sheet">👁 Sheet preview</button>` : ''}
      ${badgeHTML}
    </div>
  `;
}


window.getModelCapability = getModelCapability;
window.getCompatibleVisionModels = getCompatibleVisionModels;
window.decideVisualAIRequest = decideVisualAIRequest;
window.renderQuestionSheetToPNG = renderQuestionSheetToPNG;
window.buildAskAIVisualPrompt = buildAskAIVisualPrompt;
window.askAIButtonHTML = askAIButtonHTML;
window.askQuestionAI = askQuestionAI;
window.callAI = callAI;
window.executeAskAIVisual = executeAskAIVisual;

function getProviderConfig(providerId){return AI_CATALOG.providers.find(p=>p.providerId===providerId)}
function getProviderModels(providerId){const cfg=getProviderConfig(providerId);return cfg?cfg.models:[]}
function getProviderDefaultModel(providerId){const cfg=getProviderConfig(providerId);return cfg?cfg.defaultModel:''}
function getCurrentModelForProvider(providerId){const mem=state.settings.aiModelPerProvider||{};return mem[providerId]||getProviderDefaultModel(providerId)}
function saveCurrentModelForProvider(providerId,modelId){if(!state.settings.aiModelPerProvider)state.settings.aiModelPerProvider={};state.settings.aiModelPerProvider[providerId]=modelId}
function getEffectiveModelId(){const p=state.settings.aiProvider;if(p==='custom')return state.settings.aiCustomModelId||'';return getCurrentModelForProvider(p)||getProviderDefaultModel(p)}
function getSelectedModelMeta(providerId,modelId){const models=getProviderModels(providerId);return models.find(m=>m.id===modelId)}
function buildProviderOptions(){return AI_CATALOG.providers.map(p=>`<option value="${p.providerId}" ${state.settings.aiProvider===p.providerId?'selected':''}>${esc(p.label)}</option>`).join('')}
function buildModelOptionsForProvider(providerId,customVal){const cfg=getProviderConfig(providerId);if(!cfg)return '';const models=cfg.models||[];const current=getCurrentModelForProvider(providerId);const isCustom=providerId==='custom';const discovered=window.NETCRACKER_DISCOVERED_MODELS?.[providerId]||[];const discoveredBuiltinIds=new Set(models.map(m=>m.id));const trulyNew=discovered.filter(d=>!discoveredBuiltinIds.has(d.id));const curatedIds=new Set(models.map(m=>m.id));const selectedId=current;let html='';const recommended=models.filter(m=>m.recommended);const alternatives=models.filter(m=>!m.recommended);if(recommended.length){html+=`<optgroup label="Recommended">`;html+=recommended.map(m=>`<option value="${esc(m.id)}" ${selectedId===m.id?'selected':''}>${esc(m.label)} — ${esc(m.tier)}</option>`).join('');html+=`</optgroup>`}if(alternatives.length){html+=`<optgroup label="Built-in alternatives">`;html+=alternatives.map(m=>`<option value="${esc(m.id)}" ${selectedId===m.id?'selected':''}>${esc(m.label)} — ${esc(m.tier)}</option>`).join('');html+=`</optgroup>`}if(trulyNew.length){html+=`<optgroup label="Available to your API key">`;html+=trulyNew.map(m=>`<option value="${esc(m.id)}" ${selectedId===m.id?'selected':''}>${esc(m.label||m.id)}</option>`).join('');html+=`</optgroup>`}html+=`<optgroup label="Custom">`;html+=`<option value="__custom__" ${customVal||(!models.find(m=>m.id===current)&&providerId!=='custom')?'selected':''}>Custom model ID…</option>`;html+=`</optgroup>`;return html}
function aiCatalogCheckedNote(){const d=AI_CATALOG.officiallyCheckedDate||'';const fmt=d?new Date(d+'T00:00:00').toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'}):'';return fmt?`<p class="tiny muted">Built-in model catalog last verified: ${fmt}. Validate your key to load models currently available to your account.</p>`:''}
function renderTutor(){
  if(!state.settings.aiValidated)return `<section class="page">${pageHead('AI tutor','AI is disabled until you add and validate your own API key. All other app features remain offline and functional.')}<div class="grid cols-2"><div class="card hero"><h2>Unlock grounded tutoring</h2><p>Supported providers: Google Gemini, OpenAI, xAI Grok, GroqCloud and custom OpenAI-compatible endpoints. The key is sent only to the selected provider.</p><button class="button" data-route="settings">Configure API key</button></div><div class="card"><h2>Without AI, you still have</h2><ul><li>Complete syllabus tracker</li><li>Adaptive local plan</li><li>150-question full offline mock</li><li>Mastery, revision and mistakes</li><li>Analytics and data export</li></ul></div></div></section>`;
  const pLabel=()=>{const c=getProviderConfig(state.settings.aiProvider);return c?c.label:state.settings.aiProvider};
  const msgs=state.chats.slice(-30);return `<section class="page">${pageHead('Grounded AI tutor',`Connected to ${esc(pLabel())} · ${esc(getEffectiveModelId())}. Answers receive your current target, selected syllabus node and progress context.`,`<button class="button ghost" data-action="clear-chat">Clear chat</button>`)}<div class="card chat"><div class="chat-log" id="chatLog">${msgs.length?msgs.map(m=>`<div class="message ${m.role==='user'?'user':'ai'}">${esc(m.content)}</div>`).join(''):'<div class="empty">Ask for an explanation, quiz, study-plan adjustment or mistake analysis.</div>'}</div></div><div class="chat-input"><button class="icon-button" data-action="voice-input" title="Voice input">🎙</button><textarea id="chatInput" aria-label="Chat message" placeholder="Explain context-free grammars from zero, then quiz me…"></textarea><button class="button" data-action="send-chat">Send</button></div></div><div class="tags" style="margin-top:10px"><button class="button ghost compact" data-prompt="What should I study today and why?">Plan today</button><button class="button ghost compact" data-prompt="Quiz me with five questions from my weakest unit, one at a time. Do not reveal answers early.">Quiz weak unit</button><button class="button ghost compact" data-prompt="Analyse my unresolved mistakes and give a concise recovery plan.">Fix mistakes</button><button class="button ghost compact" data-prompt="Create a 20-minute rapid revision session for my next due topic.">Rapid revision</button></div></section>`
}
async function sendChat(text){if(!text.trim())return;state.chats.push({role:'user',content:text.trim(),date:new Date().toISOString()});saveState();render();const log=$('#chatLog');if(log){log.insertAdjacentHTML('beforeend','<div class="message ai" id="typingMsg">Thinking…</div>');log.scrollTop=log.scrollHeight}try{const answer=await callAI(buildTutorPrompt(text));state.chats.push({role:'assistant',content:answer,date:new Date().toISOString()});saveState();render()}catch(e){state.chats.push({role:'assistant',content:`AI request failed: ${e.message}. Your offline data and study features are unaffected.`,date:new Date().toISOString()});saveState();render()}}
function buildTutorPrompt(userText){const weak=priorityTopics().slice(0,5).map(t=>`${t.paperName}, Unit ${t.unit} ${t.name}: mastery ${mastery(t.id)}%`).join('; ');const recent=state.mistakes.filter(m=>!m.resolved).slice(-5).map(m=>{const q=DATA.questions.find(x=>x.id===m.questionId);return q?.topic}).filter(Boolean).join(', ');return `You are NETCracker AI, a precise UGC-NET tutor for Paper 1 and Computer Science & Applications Code 87. Stay within the official syllabus. The student target is ${state.profile.goal}, ${state.profile.targetTotal}/300, category ${state.profile.category}, target date ${state.profile.examDate||'not set'}. Weak priorities: ${weak}. Recent mistake topics: ${recent||'none'}. Explain uncertainty. Never claim guaranteed qualification. Use concise structured teaching, then a recall check when appropriate. Student request: ${userText}`}
async function callAI(prompt,validation=false,imagePayload=null){const key=getAIKey();if(!key)throw new Error('No API key is available');const provider=state.settings.aiProvider;const model=getEffectiveModelId();if(!model&&provider!=='custom')throw new Error('No model selected');const cfg=getProviderConfig(provider);if(provider==='gemini'){if(!cfg)throw new Error('Unknown provider');const url=cfg.baseUrl+'/models/'+encodeURIComponent(model)+':generateContent';const parts=[{text:validation?'Reply with exactly KEY_OK':prompt}];if(imagePayload&&!validation){parts.push({inlineData:{mimeType:imagePayload.mimeType||'image/png',data:imagePayload.base64}})}const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts}],generationConfig:{temperature:validation?0:0.35,maxOutputTokens:validation?20:1200}})});if(!r.ok)throw new Error(await providerError(r));const d=await r.json();return d.candidates?.[0]?.content?.parts?.map(x=>x.text).join('')||'No response text returned.'}
 const base=provider==='custom'?((state.settings.aiBaseUrl||'').replace(/\/+$/,'')):(cfg?cfg.baseUrl:'');if(!base)throw new Error('Custom base URL is required');const cap=getModelCapability(provider,model);let userContent=validation?'Reply with exactly KEY_OK':prompt;if(imagePayload&&!validation){if(provider==='groq'&&cap.visionSupport!=='verified'){throw new Error(`The selected Groq model (${model}) is text-only. Choose Qwen 3.6 27B Vision or another verified vision model to analyse this diagram.`)}if(cap.visionSupport==='unsupported'&&provider!=='custom'){throw new Error(`The selected model (${model}) does not accept image inputs.`)}userContent=[{type:'text',text:prompt},{type:'image_url',image_url:{url:imagePayload.dataUrl||`data:image/png;base64,${imagePayload.base64}`}}]}const reqBody={model,messages:[{role:'system',content:'You are a reliable examination tutor.'},{role:'user',content:userContent}],temperature:validation?0:0.35,max_tokens:validation?20:1200};if(provider==='xai')reqBody.store=false;const r=await fetch(base+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify(reqBody)});if(!r.ok)throw new Error(await providerError(r));const d=await r.json();return d.choices?.[0]?.message?.content||'No response text returned.'}
async function providerError(r){let txt='';try{const d=await r.json();txt=d.error?.message||JSON.stringify(d)}catch{txt=await r.text()}return `${r.status}: ${txt.slice(0,300)}`}
function getAIKey(){return sessionStorage.getItem(AI_KEY_SESSION)||localStorage.getItem(AI_KEY_SESSION)||''}
async function discoverModelsForProvider(providerId,key){
  const cfg=getProviderConfig(providerId);
  if(!cfg||providerId==='custom'){
    const rawUrl=state.settings.aiBaseUrl||'';
    const baseUrl=providerId==='custom'?rawUrl.replace(/\/+$/,''):'';
    if(!baseUrl)return [];
    const r=await fetch(baseUrl+'/models',{headers:{'Authorization':'Bearer '+key},signal:AbortSignal.timeout(8000)});
    if(!r.ok)throw new Error('Discovery failed ('+r.status+')');
    const d=await r.json();return (d.data||[]).map(m=>({id:m.id,label:m.id}));
  }
  if(providerId==='gemini'){
    const url=cfg.baseUrl+'/models';
    const r=await fetch(url,{headers:{'x-goog-api-key':key},signal:AbortSignal.timeout(8000)});
    if(!r.ok)throw new Error('Discovery failed ('+r.status+')');
    const d=await r.json();const all=d.models||[];
    const prefix=cfg.discoveryConfig?.stripPrefix||'';
    const method=cfg.discoveryConfig?.supportedMethod||'generateContent';
    return all.filter(m=>Array.isArray(m.supportedGenerationMethods)&&m.supportedGenerationMethods.includes(method)).map(m=>({id:m.name.startsWith(prefix)?m.name.slice(prefix.length):m.name,label:m.displayName||(m.name.startsWith(prefix)?m.name.slice(prefix.length):m.name)}));
  }
  const ep=cfg.baseUrl+(cfg.modelsEndpoint||'/models');
  const r=await fetch(ep,{headers:{'Authorization':'Bearer '+key},signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw new Error('Discovery failed ('+r.status+')');
  const d=await r.json();const raw=d.data||[];
  const exclude={
    gemini:['embedding','text-embedding','aqa','imagen','videogen','speech','realtime'],
    openai:['embedding','tts','whisper','dall-e','moderation','gpt-4o-audio'],
    xai:['embedding','imagen','dall-e','image','video','audio','speech','moderation'],
    groq:['whisper','embedding','guard','speech','image','video','audio','moderation','prompt-guard','safety']
  };
  const ex=exclude[providerId]||[];
  return raw.filter(m=>!ex.some(pre=>m.id.toLowerCase().startsWith(pre))).map(m=>({id:m.id,label:m.id}));
}
async function saveDiscoveredModels(providerId,models){if(!window.NETCRACKER_DISCOVERED_MODELS)window.NETCRACKER_DISCOVERED_MODELS={};window.NETCRACKER_DISCOVERED_MODELS[providerId]=models}
async function validateAIKey(){const input=$('#apiKey'),key=input?.value.trim();if(!key){toast('Enter an API key first.');return}
 const provider=$('#aiProvider').value;
 const modelId=$('#aiModel').value;
 const baseUrl=$('#aiBaseUrl').value.trim();
 const rememberKey=$('#rememberKey').checked;
 const customModelId=$('#aiCustomModelId')?.value.trim()||'';
 state.settings.aiProvider=provider;state.settings.aiBaseUrl=baseUrl;state.settings.rememberKey=rememberKey;
 if(provider==='custom'){state.settings.aiCustomModelId=customModelId}else if(modelId!=='__custom__'){saveCurrentModelForProvider(provider,modelId);state.settings.aiModel=modelId}
 sessionStorage.setItem(AI_KEY_SESSION,key);if(rememberKey)localStorage.setItem(AI_KEY_SESSION,key);else localStorage.removeItem(AI_KEY_SESSION);
 const btn=$('[data-action="validate-ai"]');btn.disabled=true;btn.textContent='Validating…';
 try{let discovered=[];try{discovered=await discoverModelsForProvider(provider,key);await saveDiscoveredModels(provider,discovered)}catch(de){console.warn('Model discovery warning:',de.message)}
  const ans=await callAI('test',true);state.settings.aiValidated=Boolean(ans);saveState();toast('API key validated. AI tutor unlocked.');render()
 }catch(e){state.settings.aiValidated=false;sessionStorage.removeItem(AI_KEY_SESSION);if(!rememberKey)localStorage.removeItem(AI_KEY_SESSION);saveState();toast('Validation failed: '+e.message);render()}
}


function browserPool(){
 const qs=ALL_YEAR_MAP[questionBrowser.year]||[];const query=questionBrowser.query.trim().toLowerCase();
 return qs.filter(q=>{if(questionBrowser.paper!=='all'&&q.paper!==Number(questionBrowser.paper))return false;if(questionBrowser.status==='scoreable'&&(q.scored===false||q.dropped))return false;if(questionBrowser.status==='dropped'&&!q.dropped)return false;if(questionBrowser.status==='review'&&!advisory(q))return false;const hasVisual=Boolean(q.stemVectorSvg||q.optionVectorSvgs||q.sourceVectorSvgs);if(questionBrowser.visual==='visual'&&!hasVisual)return false;if(questionBrowser.visual==='text'&&hasVisual)return false;if(query){const hay=[q.question,q.topic,q.questionNumber,q.questionId,q.id,...(q.options||[]),...(q.optionAlt||[])].join(' ').toLowerCase();if(!hay.includes(query))return false}return true});
}
async function ensureBrowserYear(){if(questionBrowser.loading||loadedYears.has(questionBrowser.year))return;questionBrowser.loading=true;try{await loadYear(questionBrowser.year)}finally{questionBrowser.loading=false}}
function renderQuestionBrowser(){
 const years=[...CERTIFIED_INTERACTIVE_YEARS].sort((a,b)=>b-a);if(!loadedYears.has(questionBrowser.year)){ensureBrowserYear().then(()=>render()).catch(e=>toast(e.message));return `<section class="page">${pageHead('Question bank','Loading the selected offline year archive…')}<div class="card empty">Loading ${questionBrowser.year} questions…</div></section>`}
 const pool=browserPool();questionBrowser.index=clamp(questionBrowser.index,0,Math.max(0,pool.length-1));const q=pool[questionBrowser.index];
 const controls=`<div class="question-filters"><div class="field"><label for="qbYear">Year</label><select id="qbYear">${years.map(y=>`<option value="${y}" ${questionBrowser.year===y?'selected':''}>${y}</option>`).join('')}</select></div><div class="field"><label for="qbPaper">Paper</label><select id="qbPaper"><option value="all">All papers</option><option value="1" ${questionBrowser.paper==='1'?'selected':''}>Paper 1</option><option value="2" ${questionBrowser.paper==='2'?'selected':''}>Paper 2 · Computer Science</option></select></div><div class="field"><label for="qbStatus">Publishing status</label><select id="qbStatus"><option value="scoreable" ${questionBrowser.status==='scoreable'?'selected':''}>Scoreable</option><option value="all" ${questionBrowser.status==='all'?'selected':''}>All, including dropped</option><option value="dropped" ${questionBrowser.status==='dropped'?'selected':''}>Officially dropped</option><option value="review" ${questionBrowser.status==='review'?'selected':''}>Vector/advisory</option></select></div><div class="field"><label for="qbVisual">Presentation</label><select id="qbVisual"><option value="all">Text and diagrams</option><option value="visual" ${questionBrowser.visual==='visual'?'selected':''}>Has diagram/vector</option><option value="text" ${questionBrowser.visual==='text'?'selected':''}>Text only</option></select></div><div class="field qb-search"><label for="qbQuery">Search question, option or number</label><input id="qbQuery" value="${esc(questionBrowser.query)}" placeholder="e.g. deadlock, 59, HTML table"></div></div>`;
 if(!q)return `<section class="page">${pageHead('Question bank','Browse every archived item by exact year, paper, question number and content status.')}<div class="card">${controls}<div class="empty">No questions match these filters.</div></div></section>`;
 const answer=questionBrowser.reveal?`<div class="answer-panel"><strong>Accepted answer:</strong> ${esc(correctText(q))}<p>${esc(q.explanation||'No explanation is bundled.')}</p></div>`:'';
 return `<section class="page">${pageHead('Question bank',`${PYQ_INDEX.mappedTotal} archived records. Questions remain local and are loaded one year at a time.`,`<button class="button secondary" data-action="start-browser-year">Test this filtered set</button>`)}<div class="card">${controls}<div class="row between wrap qb-position"><strong>${pool.length} matching questions</strong><span>Result ${questionBrowser.index+1} of ${pool.length}</span></div></div><div class="card question-browser-card">${questionMetaHTML(q)}<div class="row between wrap" style="margin-top:14px"><div class="tags">${sourceBadge(q)}</div><span class="q-number">Archive position ${questionBrowser.index+1}/${pool.length}</span></div><div class="question-body">${questionDisplay(q)}</div><div class="options browser-options">${q.options.map((o,i)=>`<div class="option static ${questionBrowser.reveal&&correctIndexes(q).includes(i)?'correct':''}"><span class="option-index">${String.fromCharCode(65+i)}</span>${optionDisplay(q,o,i)}</div>`).join('')}</div>${answer}<div style="margin-top:12px">${askAIButtonHTML(q)}</div><div class="row between wrap" style="margin-top:18px"><button class="button ghost" data-action="qb-prev" ${questionBrowser.index===0?'disabled':''}>Previous</button><button class="button secondary" data-action="qb-reveal">${questionBrowser.reveal?'Hide answer':'Show answer'}</button><button class="button" data-action="qb-next" ${questionBrowser.index===pool.length-1?'disabled':''}>Next</button></div></div></section>`;
}

function renderPapers(){
 const years=[...CERTIFIED_INTERACTIVE_YEARS].sort((a,b)=>b-a);
 const cards=years.map(year=>{const meta=PYQ_INDEX.years?.[year]||{};const loaded=loadedYears.has(year);return `<article class="card paper-card"><div class="row between wrap"><span class="paper-year">${year}</span><span class="tag success">${meta.total||0} mapped questions</span></div><h2>UGC-NET ${year}</h2><p>Paper 1: ${meta.paper1||0} · Computer Science: ${meta.paper2||0}${meta.legacy?' · legacy Papers II/III normalized':''}</p><div class="tags"><span class="tag">${meta.vectors||0} exact SVG reconstructions</span><span class="tag ${meta.advisory?'warning':''}">${meta.advisory||0} vector/advisory records</span><span class="tag">${loaded?'loaded now':'loads on demand'}</span></div><p class="small muted">Correct-option indexes come from the imported key mapping. Where text is uncertain, the exact vector reconstruction—not OCR alone—is displayed.</p><div class="row wrap paper-actions"><button class="button secondary" data-action="browse-year" data-year="${year}">Browse questions</button><button class="button" data-action="start-verified-${year}">Start ${year} paper</button></div></article>`}).join('');
 return `<section class="page">${pageHead('Previous-year interactive archive',`${PYQ_INDEX.mappedTotal||0} locally stored questions across ${years.length} years. No PDF, page screenshot or network request is needed after offline caching.`)}
 <div class="alert success"><strong>Text-first and raster-free.</strong> Years load only when opened, reducing phone startup memory. The service worker caches the complete archive in the background for offline use.</div>
 <div class="alert warning" style="margin-top:14px"><strong>Historical format:</strong> pre-2018 Computer Science Papers II and III are retained as historical questions but normalized to the current Paper 2 category.</div>
 <div class="paper-grid" style="margin-top:16px">${cards}</div></section>`;
}

function renderSources(){return `<section class="page">${pageHead('Official sources and data provenance','The app hardcodes a verified syllabus snapshot and examination configuration, while keeping the official links available for future checking.')}
 <div class="alert warning"><strong>Important:</strong> The target exam date is deliberately user-editable because no future cycle date should be treated as official until NTA publishes it. The bundled examination pattern reflects the June 2026 official bulletin.</div>
 <div class="grid cols-2" style="margin-top:16px">${DATA.syllabus.officialSources.map(s=>`<div class="card source-card"><h3>${esc(s.title)}</h3><p>${esc(s.url)}</p><a class="button secondary" href="${esc(s.url)}" target="_blank" rel="noopener">Open official page</a></div>`).join('')}<div class="card source-card"><h3>December 2025 Computer Science cutoffs</h3><p>${esc(DATA.cutoffs.sourceUrl)}</p><a class="button secondary" href="${esc(DATA.cutoffs.sourceUrl)}" target="_blank" rel="noopener">Open official cutoff page</a></div></div>
 <div class="card" style="margin-top:16px"><h2>Bundled cutoff reference</h2><p>Historical cutoffs guide targets but do not predict a future result.</p><div class="bar-list">${Object.entries(DATA.cutoffs.categories).slice(0,5).map(([k,v])=>`<div class="bar-row"><span>${esc(k)}</span><div class="small">JRF ${v.jrf} · AP ${v.assistantProfessor} · PhD ${v.phdOnly}</div><b>/300</b></div>`).join('')}</div></div>
 <div class="card" style="margin-top:16px"><h2>Content labels</h2><ul><li><strong>Official syllabus snapshot:</strong> structured from UGC’s Code 00 and Code 87 documents.</li><li><strong>Examination pattern:</strong> NTA June 2026 bulletin.</li><li><strong>Cutoff reference:</strong> NTA December 2025 subject/category table.</li><li><strong>Practice questions:</strong> original questions created for this app; not represented as PYQs.</li><li><strong>AI answers:</strong> generated by your selected provider and should be checked against trusted sources.</li></ul></div></section>`}

function renderSettings(){return `<section class="page">${pageHead('Settings and local data','Configure targets, AI provider, appearance, backup and installation.')}
 <div class="grid cols-2"><div class="card"><h2>Student and target</h2>${profileFormHTML()}<button class="button" style="margin-top:14px" data-action="save-profile">Save target and replan</button></div>
 <div class="card"><h2>Bring your own AI key</h2><div class="alert warning small">Browser apps cannot hide a client-side key from the device owner. By default, the key is kept only for this browser session. AI requires internet; every non-AI feature works offline.</div><div class="form-grid" style="margin-top:14px"><div class="field"><label for="aiProvider">Provider</label><select id="aiProvider">${buildProviderOptions()}</select></div><div class="field"><label for="aiModel">Model</label><select id="aiModel">${buildModelOptionsForProvider(state.settings.aiProvider,state.settings.aiCustomModelId)}</select></div><div class="field full" id="customModelField"${state.settings.aiProvider!=='custom'&&state.settings.aiModel!=='__custom__'?' style="display:none"':''}><label for="aiCustomModelId">Custom model ID</label><input id="aiCustomModelId" value="${esc(state.settings.aiCustomModelId)}" placeholder="e.g. gpt-4o-mini"></div><div class="field full" id="aiBaseUrlField"${state.settings.aiProvider!=='custom'?' style="display:none"':''}><label for="aiBaseUrl">Custom base URL</label><input id="aiBaseUrl" value="${esc(state.settings.aiBaseUrl)}" placeholder="https://example.com/v1"></div><div class="field full" id="customVisionSettings"${state.settings.aiProvider!=='custom'?' style="display:none"':''}><label class="row small"><input id="customModelVisionSupport" type="checkbox" ${state.settings.customModelVisionSupport?'checked':''}> This custom model supports image input</label><div class="field" style="margin-top:6px;"><label for="customModelImageFormat">Image request format</label><select id="customModelImageFormat"><option value="openai-chat" ${state.settings.customModelImageFormat==='openai-chat'?'selected':''}>OpenAI-compatible Chat Completions</option><option value="openai-responses" ${state.settings.customModelImageFormat==='openai-responses'?'selected':''}>OpenAI-compatible Responses</option><option value="unknown" ${state.settings.customModelImageFormat==='unknown'?'selected':''}>Unknown / text only</option></select></div></div><div class="field full"><label for="apiKey">API key</label><input id="apiKey" type="password" autocomplete="off" placeholder="Paste your key"></div><label class="row small" for="rememberKey"><input id="rememberKey" type="checkbox" ${state.settings.rememberKey?'checked':''}> Remember key on this device (less secure)</label></div><div class="row wrap" style="margin-top:14px"><button class="button" data-action="validate-ai">Validate key and load available models</button><button class="button secondary" data-action="discover-models">Discover models from key</button><button class="button ghost" data-action="forget-ai">Forget key</button><span class="pill">${state.settings.aiValidated?'Validated':'Locked'}</span></div>${aiCatalogCheckedNote()}</div></div>
 <div class="grid cols-2" style="margin-top:16px"><div class="card"><h2>Backup and portability</h2><p>Export all profile, mastery, plans, attempts, mistakes, notes and chats as one JSON file.</p><div class="row wrap"><button class="button secondary" data-action="export-data">Export backup</button><label class="button ghost">Import backup<input id="importFile" type="file" accept="application/json" hidden aria-label="Import backup file"></label></div></div><div class="card"><h2>Appearance and reset</h2><div class="field"><label for="themeSelect">Theme</label><select id="themeSelect"><option value="system" ${state.settings.theme==='system'?'selected':''}>System</option><option value="light" ${state.settings.theme==='light'?'selected':''}>Light</option><option value="dark" ${state.settings.theme==='dark'?'selected':''}>Dark</option></select></div><div class="row wrap" style="margin-top:14px"><button class="button ghost" data-action="install-app">Install app</button><button class="button danger" data-action="reset-data">Erase all local data</button></div></div></div>
 <div class="card" style="margin-top:16px"><h2>Advanced AI settings</h2><details><summary class="small muted" style="cursor:pointer">Expand advanced configuration</summary><div class="form-grid" style="margin-top:14px"><div class="field"><label for="aiReasoningMode">AI response mode</label><select id="aiReasoningMode"><option value="auto" ${state.settings.aiReasoningMode==='auto'?'selected':''}>Automatic (provider default)</option><option value="fast" ${state.settings.aiReasoningMode==='fast'?'selected':''}>Fast</option><option value="balanced" ${state.settings.aiReasoningMode==='balanced'?'selected':''}>Balanced</option><option value="deep" ${state.settings.aiReasoningMode==='deep'?'selected':''}>Deep</option></select></div><div class="field" style="grid-column:1/-1"><label>Active model ID</label><div class="small" style="padding:7px 0">${esc(getEffectiveModelId())}</div></div></div></details></div>
 <div class="card" style="margin-top:16px"><h2>Task-based recommendations</h2><p class="small muted">Guidance only. Your selected model will not be changed automatically.</p><div class="grid cols-2" style="margin-top:10px;gap:10px"><div><strong>Teach a difficult concept</strong><br><span class="small">Quality or Balanced</span></div><div><strong>Analyse why an answer was wrong</strong><br><span class="small">Quality</span></div><div><strong>Generate flashcards</strong><br><span class="small">Economy</span></div><div><strong>Generate short quizzes</strong><br><span class="small">Economy or Balanced</span></div><div><strong>Create a revision plan</strong><br><span class="small">Balanced</span></div><div><strong>Analyse mock-test weaknesses</strong><br><span class="small">Quality</span></div><div><strong>Motivation or general study chat</strong><br><span class="small">Economy</span></div></div></div>
 </section>`}
function profileFormHTML(){const p=state.profile;return `<div class="form-grid"><div class="field"><label for="profileName">Name</label><input id="profileName" value="${esc(p.name)}"></div><div class="field"><label for="examDate">Personal target exam date</label><input id="examDate" type="date" value="${esc(p.examDate)}"></div><div class="field"><label for="category">Category</label><select id="category">${Object.keys(DATA.cutoffs.categories).map(c=>`<option ${p.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div><div class="field"><label for="goal">Goal</label><select id="goal"><option ${p.goal==='JRF'?'selected':''}>JRF</option><option ${p.goal==='Assistant Professor'?'selected':''}>Assistant Professor</option><option ${p.goal==='PhD only'?'selected':''}>PhD only</option><option ${p.goal==='Custom'?'selected':''}>Custom</option></select></div><div class="field"><label for="targetTotal">Total target /300</label><input id="targetTotal" type="number" min="0" max="300" step="2" value="${p.targetTotal}"></div><div class="field"><label for="targetP1">Paper 1 target /100</label><input id="targetP1" type="number" min="0" max="100" step="2" value="${p.targetP1}"></div><div class="field"><label for="targetP2">Paper 2 target /200</label><input id="targetP2" type="number" min="0" max="200" step="2" value="${p.targetP2}"></div><div class="field"><label for="hoursPerDay">Study hours/day</label><input id="hoursPerDay" type="number" min="0.5" max="12" step="0.5" value="${p.hoursPerDay}"></div><div class="field"><label for="daysPerWeek">Study days/week</label><input id="daysPerWeek" type="number" min="1" max="7" value="${p.daysPerWeek}"></div><div class="field"><label for="risk">Risk mode</label><select id="risk"><option ${p.risk==='Safe'?'selected':''}>Safe</option><option ${p.risk==='Balanced'?'selected':''}>Balanced</option><option ${p.risk==='Aggressive'?'selected':''}>Aggressive</option></select></div></div>`}
function saveProfileFromForm(){const total=Number($('#targetTotal').value),p1=Number($('#targetP1').value),p2=Number($('#targetP2').value);if(p1+p2!==total){toast('Paper 1 and Paper 2 targets must add up to the total target.');return false}Object.assign(state.profile,{name:$('#profileName').value.trim(),examDate:$('#examDate').value,category:$('#category').value,goal:$('#goal').value,targetTotal:total,targetP1:p1,targetP2:p2,hoursPerDay:Number($('#hoursPerDay').value),daysPerWeek:Number($('#daysPerWeek').value),risk:$('#risk').value,onboarded:true});state.tasks={};saveState();toast('Target saved and plan regenerated.');return true}
function showOnboarding(){if($('#onboardModal'))return;$('#modalRoot').innerHTML=`<div class="modal-backdrop" id="onboardModal"><div class="modal"><div class="brand"><div class="brand-mark">N</div><div><strong>Set up NETCracker AI</strong><small>Single-student local profile</small></div></div><h2 style="margin-top:20px">Build your preparation contract</h2><p>The examination date below is your editable planning target—not an assertion of an official future exam date.</p>${profileFormHTML()}<div class="alert warning small" style="margin-top:14px">Start with JRF 210/300 as a safe personal preparation target, then change it at any time. Historical cutoffs are references, not guarantees.</div><button class="button" style="width:100%;margin-top:16px" data-action="finish-onboarding">Create my plan</button></div></div>`;bindView()}
function showTargetModal(){if($('#targetModal'))return;$('#modalRoot').innerHTML=`<div class="modal-backdrop" id="targetModal"><div class="modal"><div class="row between"><h2>Edit target</h2><button class="icon-button" data-action="close-modal">×</button></div>${profileFormHTML()}<div id="targetImpact" class="alert" style="margin-top:14px">Change values to preview impact. The planner will preserve your progress and rebuild future tasks.</div><button class="button" style="width:100%;margin-top:16px" data-action="save-target-modal">Apply and replan</button></div></div>`;bindView()}

function askQuestionAI(qId, selected = null, assistanceMode = 'explain-official', userIntent = 'auto') {
  const q = DATA.questions.find(x => x.id === qId) || (ALL_YEAR_MAP[questionBrowser?.year]?.find(x => x.id === qId));
  if (!q) return;
  if (!state.settings.aiValidated) {
    toast('Validate an API key in Settings to use the AI Question Explainer.');
    routeTo('settings');
    return;
  }
  if (!navigator.onLine) {
    toast('AI analysis requires internet access. The question, diagram and all offline study tools remain available.');
    return;
  }
  const decision = decideVisualAIRequest(q, null, userIntent);
  if (decision.action === 'require-model-switch') {
    showModelSwitchModal(q, selected, assistanceMode);
    return;
  }
  if (decision.action === 'require-capability-test') {
    showCapabilityTestModal(state.settings.aiProvider, getEffectiveModelId(), q, selected, assistanceMode);
    return;
  }
  if (decision.action === 'offer-text-fallback') {
    showStructuredFallbackOfferModal(q, selected, assistanceMode);
    return;
  }
  if (decision.action === 'send-text-and-image') {
    if (decision.requiresConsent) {
      showVisualConsentModal(state.settings.aiProvider, () => {
        executeAskAIVisual(q, selected, assistanceMode, true);
      });
    } else {
      executeAskAIVisual(q, selected, assistanceMode, true);
    }
    return;
  }
  executeAskAIVisual(q, selected, assistanceMode, false);
}

function bindView(){
 $$('[data-route]').forEach(el=>el.onclick=()=>routeTo(el.dataset.route));
 $$('[data-action]').forEach(el=>{const a=el.dataset.action;if(a==='toggle-task')el.onclick=()=>completeTask(el.dataset.id);if(a==='edit-target')el.onclick=showTargetModal;if(a==='close-modal')el.onclick=()=>$('#modalRoot').innerHTML='';if(a==='finish-onboarding')el.onclick=()=>{if(saveProfileFromForm()){$('#modalRoot').innerHTML='';render()}};if(a==='save-target-modal')el.onclick=()=>{if(saveProfileFromForm()){$('#modalRoot').innerHTML='';render()}};if(a==='toggle-unit')el.onclick=()=>el.closest('.unit').classList.toggle('open');if(a==='open-topic')el.onclick=()=>{location.hash=`learn?topic=${el.dataset.id}`};if(a==='prev-topic'||a==='next-topic')el.onclick=()=>navigateTopic(el.dataset.id,a==='next-topic'?1:-1);if(a==='save-topic')el.onclick=()=>{state.notes[el.dataset.id]=$('#topicNotes').value;updateProgress(el.dataset.id,12,Number($('#confidenceRange').value));toast('Saved, mastery updated and review scheduled.');render()};if(a==='topic-practice')el.onclick=()=>{const t=topicById(el.dataset.id);startPractice(`${t.paperCode==='00'?1:2}-${t.unit}`,10,1.2,'all');location.hash='practice'};if(a==='ask-topic-ai')el.onclick=()=>{const t=topicById(el.dataset.id);if(!state.settings.aiValidated){toast('Validate an API key in Settings first.');routeTo('settings')}else{state.chats.push({role:'user',content:`Teach me ${t.name} from Unit ${t.unit} (${t.unitName}) from zero, within the official syllabus. Use examples and finish with three recall questions.`,date:new Date().toISOString()});saveState();routeTo('tutor')}};if(a==='ask-question-ai')el.onclick=()=>askQuestionAI(el.dataset.id,el.dataset.selected,el.dataset.mode||'explain-official');if(a==='preview-question-sheet')el.onclick=()=>{const q=DATA.questions.find(x=>x.id===el.dataset.id)||(ALL_YEAR_MAP[questionBrowser?.year]?.find(x=>x.id===el.dataset.id));if(q)showQuestionSheetPreviewModal(q)};if(a==='qb-prev')el.onclick=()=>{questionBrowser.index=Math.max(0,questionBrowser.index-1);questionBrowser.reveal=false;render()};if(a==='qb-next')el.onclick=()=>{questionBrowser.index=Math.min(browserPool().length-1,questionBrowser.index+1);questionBrowser.reveal=false;render()};if(a==='qb-reveal')el.onclick=()=>{questionBrowser.reveal=!questionBrowser.reveal;render()};if(a==='browse-year')el.onclick=async()=>{questionBrowser.year=Number(el.dataset.year);questionBrowser.index=0;questionBrowser.reveal=false;await ensureBrowserYear();routeTo('questions')};if(a==='start-browser-year')el.onclick=()=>{const pool=browserPool().filter(q=>q.scored!==false&&!q.dropped);if(!pool.length){toast('No scoreable questions match these filters.');return}startTest('official-pyq',pool,Math.round(pool.length*72));routeTo('practice')};if(a==='start-practice')el.onclick=()=>startPractice($('#practiceScope').value,Number($('#practiceCount').value),Number($('#practiceTime').value),$('#practiceDifficulty').value);if(a==='start-mock')el.onclick=async()=>{try{toast('Loading the offline mock bank…');startTest('mock',await buildFullMock(),180*60)}catch(e){toast(e.message)}};if(a==='answer')el.onclick=()=>{const q=testSession.questions[testSession.index];testSession.answers[q.id]=Number(el.dataset.value);render()};if(a==='test-prev')el.onclick=()=>{testSession.index=Math.max(0,testSession.index-1);render()};if(a==='test-next')el.onclick=()=>{testSession.index=Math.min(testSession.questions.length-1,testSession.index+1);render()};if(a==='jump-question')el.onclick=()=>{testSession.index=Number(el.dataset.index);render()};if(a==='toggle-review')el.onclick=()=>{const id=testSession.questions[testSession.index].id;testSession.review.has(id)?testSession.review.delete(id):testSession.review.add(id);render()};if(a==='submit-test')el.onclick=()=>{if(confirm(`Submit now? ${Object.keys(testSession.answers).length}/${testSession.questions.length} answered.`))submitTest(false)};if(a==='exit-test')el.onclick=()=>{if(confirm('Exit this test? Current answers will be discarded.')){clearInterval(timerHandle);testSession=null;render()}};if(a==='finish-test')el.onclick=()=>{testSession=null;routeTo('analytics')};if(a==='show-revision-answer')el.onclick=()=>{$('#revisionAnswer').hidden=false};if(a==='rate-revision')el.onclick=()=>rateRevision(el.dataset.kind,el.dataset.id,el.dataset.rating);if(a==='toggle-mistake')el.onclick=()=>{const m=state.mistakes.find(x=>x.questionId===el.dataset.id);if(m)m.resolved=!m.resolved;saveState();render()};if(a==='clear-resolved')el.onclick=()=>{state.mistakes=state.mistakes.filter(m=>!m.resolved);saveState();render()};if(a==='regenerate-plan')el.onclick=()=>{delete state.tasks[taskKey()];saveState();toast('Today’s plan regenerated.');render()};if(a==='mark-missed')el.onclick=()=>{state.profile.hoursPerDay=Math.max(.5,state.profile.hoursPerDay-.5);delete state.tasks[taskKey()];saveState();toast('Capacity reduced by 30 minutes/day and plan recalculated.');render()};if(a==='send-chat')el.onclick=()=>sendChat($('#chatInput').value);if(a==='clear-chat')el.onclick=()=>{state.chats=[];saveState();render()};if(a==='voice-input')el.onclick=startVoiceInput;if(a==='validate-ai')el.onclick=validateAIKey;if(a==='forget-ai')el.onclick=forgetAI;if(a==='save-profile')el.onclick=()=>{if(saveProfileFromForm())render()};if(a==='export-data')el.onclick=exportData;if(a==='install-app')el.onclick=installApp;if(a==='reset-data')el.onclick=resetData;if(a==='discover-models')el.onclick=async()=>{const key=getAIKey()||$('#apiKey')?.value?.trim();if(!key){toast('Enter an API key first.');return}const p=$('#aiProvider').value;const btn=el;btn.disabled=true;btn.textContent='Discovering…';try{const d=await discoverModelsForProvider(p,key);await saveDiscoveredModels(p,d);toast('Discovered '+d.length+' available models.');render()}catch(e){toast('Discovery failed: '+e.message);btn.disabled=false;btn.textContent='Discover models'}}});
 $$('[data-prompt]').forEach(b=>b.onclick=()=>{const i=$('#chatInput');i.value=b.dataset.prompt;i.focus()});
 const qbYear=$('#qbYear');if(qbYear)qbYear.onchange=async()=>{questionBrowser.year=Number(qbYear.value);questionBrowser.index=0;questionBrowser.reveal=false;await ensureBrowserYear();render()};
 const qbPaper=$('#qbPaper');if(qbPaper)qbPaper.onchange=()=>{questionBrowser.paper=qbPaper.value;questionBrowser.index=0;questionBrowser.reveal=false;render()};
 const qbStatus=$('#qbStatus');if(qbStatus)qbStatus.onchange=()=>{questionBrowser.status=qbStatus.value;questionBrowser.index=0;questionBrowser.reveal=false;render()};
 const qbVisual=$('#qbVisual');if(qbVisual)qbVisual.onchange=()=>{questionBrowser.visual=qbVisual.value;questionBrowser.index=0;questionBrowser.reveal=false;render()};
 const qbQuery=$('#qbQuery');if(qbQuery)qbQuery.oninput=()=>{questionBrowser.query=qbQuery.value;questionBrowser.index=0;questionBrowser.reveal=false;render()};
 const cr=$('#confidenceRange');if(cr)cr.oninput=()=>$('#confidenceValue').textContent=`${cr.value}%`;
 const imp=$('#importFile');if(imp)imp.onchange=e=>importData(e.target.files[0]);
 const theme=$('#themeSelect');if(theme)theme.onchange=()=>{state.settings.theme=theme.value;saveState();render()};
 const chat=$('#chatInput');if(chat)chat.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat(chat.value)}};
 const log=$('#chatLog');if(log)log.scrollTop=log.scrollHeight;
 const aiProvider=$('#aiProvider');if(aiProvider){const curP=aiProvider.value;aiProvider.onchange=()=>{const np=aiProvider.value;if(np!==curP){const om=state.settings.aiModel;if(om&&!state.settings.aiModelPerProvider[curP])saveCurrentModelForProvider(curP,om);state.settings.aiProvider=np;const sm=getCurrentModelForProvider(np)||getProviderDefaultModel(np);state.settings.aiModel=sm;const cf=$('#customModelField');const bf=$('#aiBaseUrlField');if(cf)cf.style.display=(np==='custom')?'':'none';if(bf)bf.style.display=(np==='custom')?'':'none';const cvf=$('#customVisionSettings');if(cvf)cvf.style.display=(np==='custom')?'':'none';saveState();render()}}}
 const aiModel=$('#aiModel');if(aiModel)aiModel.onchange=()=>{const val=aiModel.value;const p=$('#aiProvider').value;const cf=$('#customModelField');if(val==='__custom__'){if(cf)cf.style.display=''}else{if(cf)cf.style.display='none';saveCurrentModelForProvider(p,val);state.settings.aiModel=val}saveState();render()}
 const aiCC=$('#aiCustomModelId');if(aiCC)aiCC.oninput=()=>{state.settings.aiCustomModelId=aiCC.value.trim();const p=$('#aiProvider').value;if(p==='custom')state.settings.aiModel=aiCC.value.trim();saveState()}
 const aiBU=$('#aiBaseUrl');if(aiBU)aiBU.oninput=()=>{state.settings.aiBaseUrl=aiBU.value.trim();saveState()}
  const customVis=$('#customModelVisionSupport');if(customVis)customVis.onchange=()=>{state.settings.customModelVisionSupport=customVis.checked;saveState();render()}
  const customFmt=$('#customModelImageFormat');if(customFmt)customFmt.onchange=()=>{state.settings.customModelImageFormat=customFmt.value;saveState()}
 const aiRM=$('#aiReasoningMode');if(aiRM)aiRM.onchange=()=>{state.settings.aiReasoningMode=aiRM.value;saveState()}
}
function navigateTopic(id,dir){const ts=allTopics(),i=ts.findIndex(t=>t.id===id),n=ts[(i+dir+ts.length)%ts.length];location.hash=`learn?topic=${n.id}`}
function startVoiceInput(){const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){toast('Voice recognition is not supported by this browser.');return}const r=new R();r.lang=state.profile.language==='Malayalam'?'ml-IN':'en-IN';r.onresult=e=>{$('#chatInput').value=e.results[0][0].transcript};r.onerror=e=>toast(`Voice input error: ${e.error}`);r.start()}
function forgetAI(){sessionStorage.removeItem(AI_KEY_SESSION);localStorage.removeItem(AI_KEY_SESSION);state.settings.aiValidated=false;state.settings.rememberKey=false;if(window.NETCRACKER_DISCOVERED_MODELS)window.NETCRACKER_DISCOVERED_MODELS={};saveState();toast('API key removed from this device.');render()}
function exportData(){const blob=new Blob([JSON.stringify({app:'NETCracker AI',exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`netcracker-backup-${todayISO()}.json`;a.click();URL.revokeObjectURL(a.href)}
async function importData(file){if(!file)return;try{const d=JSON.parse(await file.text());if(!d.state)throw new Error('Not a NETCracker backup');state=deepMerge(defaultState(),d.state);saveState();toast('Backup imported.');render()}catch(e){toast(`Import failed: ${e.message}`)}}
function resetData(){if(!confirm('Erase all local profile, progress, attempts, notes and chats? This cannot be undone without a backup.'))return;localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(AI_KEY_SESSION);sessionStorage.removeItem(AI_KEY_SESSION);state=defaultState();saveState();render()}
async function installApp(){if(deferredInstall){deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$('#installBtn').hidden=true}else toast('Use your browser menu → Add to Home screen / Install app. The site must be served over HTTPS or localhost.')}

window.addEventListener('hashchange',render);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('#installBtn').hidden=false});
window.addEventListener('appinstalled',()=>toast('NETCracker AI installed.'));
window.addEventListener('online',()=>{$('#offlineBadge').textContent=localStorage.getItem(ARCHIVE_CACHE_KEY)==='1'?'Online · full archive cached':'Online · offline shell ready'});
window.addEventListener('offline',()=>{$('#offlineBadge').textContent=localStorage.getItem(ARCHIVE_CACHE_KEY)==='1'?'Offline · full archive cached':'Offline shell ready'});
$('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');
$('#themeBtn').onclick=()=>{state.settings.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';saveState();render()};
$('#installBtn').onclick=installApp;
$('.brand').onclick=()=>routeTo('dashboard');
document.addEventListener?.('click',async event=>{const button=event.target.closest?.('[data-action^="start-verified-"]');if(!button)return;const year=Number(button.dataset.action.replace('start-verified-',''));try{toast(`Loading ${year} archive…`);const questions=(await loadYear(year)).filter(q=>q.scored!==false&&!q.dropped);startTest('official-pyq',questions,Math.round(questions.length*72));routeTo('practice')}catch(e){toast(e.message)}});
document.addEventListener?.('click',event=>{const closeBtn=event.target.closest?.('[data-action="close-modal"]');if(closeBtn){const root=$('#modalRoot');if(root)root.innerHTML=''}});
document.addEventListener?.('click',event=>{const btn=event.target.closest?.('[data-action="open-source-viewer"]');if(!btn||!btn.dataset.vectors)return;try{const vectors=btn.dataset.vectors;const id='svm'+(Date.now());let zoom=1;$('#modalRoot').innerHTML=`<div class="modal-backdrop" id="sourceViewerModal"><div class="modal wide source-modal"><div class="row between"><h2>Original source reconstruction</h2><div class="row wrap" style="gap:6px"><button class="button ghost compact" id="svmZo">−</button><span id="svmZl">100%</span><button class="button ghost compact" id="svmZi">+</button><button class="button ghost compact" id="svmRs">⊡</button><button class="button ghost compact" id="svmFw">⇔</button><button class="icon-button" data-action="close-modal">×`+`</button></div></div><div style="background:#f5f5f0;border-radius:8px;margin-top:12px;overflow:auto;max-height:70vh;padding:16px"><div id="svmContent" style="transform-origin:0 0;transition:transform .15s">${vectors}</div></div><p class="small muted" style="margin-top:8px">High-contrast neutral background for readability. Use zoom controls or scroll.</p></div></div>`;bindView();const zl=$('#svmZl');const zc=$('#svmContent');$('#svmZo').onclick=()=>{zoom=Math.max(.25,zoom-.25);zl.textContent=Math.round(zoom*100)+'%';zc.style.transform='scale('+zoom+')'};$('#svmZi').onclick=()=>{zoom=Math.min(4,zoom+.25);zl.textContent=Math.round(zoom*100)+'%';zc.style.transform='scale('+zoom+')'};$('#svmRs').onclick=()=>{zoom=1;zl.textContent='100%';zc.style.transform='scale(1)'};$('#svmFw').onclick=()=>{const mw=$('#sourceViewerModal').querySelector('.source-modal')?.offsetWidth||800;const cw=zc.scrollWidth||800;zoom=Math.max(.25,Math.min(1.5,(mw-64)/cw));zl.textContent=Math.round(zoom*100)+'%';zc.style.transform='scale('+zoom+')'}}catch(e){console.warn('Source viewer error:',e)}});
if('serviceWorker' in navigator&&location.protocol!=='file:'){
 navigator.serviceWorker.addEventListener('message',event=>{const b=$('#offlineBadge');if(!b)return;if(event.data?.type==='ARCHIVE_CACHE_PROGRESS')b.textContent=`Caching archive ${event.data.done}/${event.data.total}`;if(event.data?.type==='ARCHIVE_CACHE_READY'){localStorage.setItem(ARCHIVE_CACHE_KEY,'1');b.textContent=navigator.onLine?'Online · full archive cached':'Offline · full archive cached'}});
 navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(reg=>reg.active?.postMessage({type:'CACHE_ARCHIVE'})).catch(console.warn);
}
window.getModelCapability = getModelCapability;
window.getCompatibleVisionModels = getCompatibleVisionModels;
window.decideVisualAIRequest = decideVisualAIRequest;
window.renderQuestionSheetToPNG = renderQuestionSheetToPNG;
window.buildAskAIVisualPrompt = buildAskAIVisualPrompt;
window.askAIButtonHTML = askAIButtonHTML;
window.askQuestionAI = askQuestionAI;
window.callAI = callAI;
window.executeAskAIVisual = executeAskAIVisual;
window.runVisualCapabilityTest = runVisualCapabilityTest;
window.showVisualConsentModal = showVisualConsentModal;
window.showModelSwitchModal = showModelSwitchModal;
window.resolveQuestionPresentation = resolveQuestionPresentation;
window.hasCompleteNativeOptions = hasCompleteNativeOptions;
window.hasNativeQuestion = hasNativeQuestion;
window.nativeQuestion = nativeQuestion;
window.questionDisplay = questionDisplay;
window.loadYear = loadYear;
window.startTest = startTest;
window.routeTo = routeTo;

updateChrome();render();
const recoveryYears=[...new Set(state.mistakes.map(m=>Number(m.year)).filter(y=>CERTIFIED_INTERACTIVE_YEARS.has(y)))];
if(recoveryYears.length)loadYears(recoveryYears).then(()=>render()).catch(console.warn);
})();
