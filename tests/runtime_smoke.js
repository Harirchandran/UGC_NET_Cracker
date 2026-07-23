const fs=require('fs'),vm=require('vm');
(async()=>{
function cls(){return {add(){},remove(){},toggle(){},contains(){return false}}}
const elements=new Map(),docHandlers={};
function el(){return {classList:cls(),style:{},dataset:{},hidden:false,value:'',checked:false,textContent:'',innerHTML:'',onclick:null,onchange:null,oninput:null,onkeydown:null,focus(){},appendChild(node){if(node.onload)node.onload()},insertAdjacentHTML(pos,x){this.innerHTML+=x},scrollTop:0,scrollHeight:0,closest(){return this},setAttribute(){},click(){if(this.onclick)return this.onclick()}}}
const docEl=el();docEl.dataset={};
const document={documentElement:docEl,head:el(),querySelector(sel){if(!elements.has(sel))elements.set(sel,el());return elements.get(sel)},querySelectorAll(){return []},createElement(){return el()},addEventListener(type,fn){docHandlers[type]=docHandlers[type]||[];docHandlers[type].push(fn)}};
const localStore=new Map(),sessionStore=new Map();const storage=m=>({getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)});
const location={hash:'',protocol:'http:'};const handlers={};
const window={document,location,addEventListener(type,fn){handlers[type]=fn},matchMedia(){return {matches:false}},crypto:global.crypto,URLSearchParams,NETCRACKER_DATA:null,NETCRACKER_PYQ_INDEX:null,NETCRACKER_LESSONS:null};
for(const y of Array.from({length:10},(_,i)=>2015+i))window[`NETCRACKER_INTERACTIVE_PYQS_${y}`]=null;
const context={window,document,location,navigator:{onLine:true},localStorage:storage(localStore),sessionStorage:storage(sessionStore),matchMedia:window.matchMedia,URLSearchParams,Date,Math,JSON,console,setTimeout(){return 0},clearTimeout(){},setInterval(){return 0},clearInterval(){},confirm(){return true},crypto:global.crypto,fetch:async()=>{throw new Error('not used')},Blob,URL};context.globalThis=context;vm.createContext(context);
// Simulate lazy runtime: index is loaded, year globals are available to the test loader but are not merged at startup.
for(const f of ['data/bundle.js','data/pyq-index.js',...Array.from({length:10},(_,i)=>`data/interactive-pyqs-${2024-i}.js`),'data/lessons.js','app.js'])vm.runInContext(fs.readFileSync(__dirname+'/../'+f,'utf8'),context,{filename:f});
let html=elements.get('#main').innerHTML;if(!html.includes('Welcome')||!html.includes('Today'))throw new Error('Dashboard did not render');
const years=Array.from({length:10},(_,i)=>2015+i);const total=years.reduce((n,y)=>n+window[`NETCRACKER_INTERACTIVE_PYQS_${y}`].questions.length,0);if(total!==1595)throw new Error(`Mapped corpus is ${total}, expected 1595`);
if(window.NETCRACKER_DATA.questions.length!==201)throw new Error('Year archives were eagerly merged at startup');
location.hash='#papers';handlers.hashchange();html=elements.get('#main').innerHTML;if(!html.includes('Previous-year interactive archive')||!html.includes('1595 locally stored questions'))throw new Error('Interactive archive did not render from index metadata');
if(!html.includes('start-verified-2015')||!html.includes('start-verified-2024'))throw new Error('Year start actions did not render');if(/<img\b/i.test(html))throw new Error('Archive rendered a raster image tag');
const button={dataset:{action:'start-verified-2022'}};for(const fn of (docHandlers.click||[]))await fn({target:{closest(){return button}}});await new Promise(resolve=>setTimeout(resolve,50));location.hash='#practice';handlers.hashchange();html=elements.get('#main').innerHTML;
if(!html.includes('Test position 1 of 149'))throw new Error('2022 scoreable interactive paper did not start');if(!html.includes('vector-sheet')||!html.includes('<svg'))throw new Error('Vector-backed question did not render');if(/<img\b|data:image|<image\b/i.test(html))throw new Error('Interactive question rendered raster content');
if(window.NETCRACKER_DATA.questions.filter(q=>q.isPyq&&q.year===2022).length!==149)throw new Error('Loaded year was not merged correctly');
// Question bank browser must lazy-load, show provenance, diagrams and answer reveal controls.
location.hash='#questions';handlers.hashchange();
await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));
html=elements.get('#main').innerHTML;
if(!html.includes('Question bank')||!html.includes('Official question')||!html.includes('Source page')||!html.includes('Archive ID'))throw new Error('Question browser provenance did not render');
if(!html.includes('Show answer')||!html.includes('Test this filtered set'))throw new Error('Question browser controls did not render');
if(/<img\b|data:image|<image\b/i.test(html))throw new Error('Question browser rendered raster content');
console.log(JSON.stringify({status:'Runtime smoke passed',mapped:total,lazyStartupQuestions:201,loaded2022:149,questionBrowser:true,renderedCharacters:html.length}));
})().catch(e=>{console.error(e);process.exit(1)});
