'use strict';
const CACHE='netcracker-text-vector-v4';
const SHELL=[
  './','./index.html','./styles.css','./app.js','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png',
  './data/bundle.js','./data/pyq-index.js','./data/pyq-index.json','./data/lessons.js','./data/question-schema.json'
];
async function archiveFiles(){const response=await fetch('./data/pyq-index.json',{cache:'no-store'});if(!response.ok)throw new Error('Question archive index unavailable');const index=await response.json();return Object.values(index.years||{}).map(meta=>'./'+String(meta.file||'').replace(/^\.\//,''));}
async function cacheArchive(){
  const cache=await caches.open(CACHE);let done=0;const ARCHIVE=await archiveFiles();
  for(const url of ARCHIVE){
    if(!(await cache.match(url)))await cache.add(url);
    done++;
    const clients=await self.clients.matchAll({includeUncontrolled:true});
    clients.forEach(client=>client.postMessage({type:'ARCHIVE_CACHE_PROGRESS',done,total:ARCHIVE.length}));
  }
  const clients=await self.clients.matchAll({includeUncontrolled:true});
  clients.forEach(client=>client.postMessage({type:'ARCHIVE_CACHE_READY'}));
}
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='CACHE_ARCHIVE')event.waitUntil(cacheArchive().catch(()=>{}))});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response?.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response}).catch(()=>event.request.mode==='navigate'?caches.match('./index.html'):Response.error())));
});
