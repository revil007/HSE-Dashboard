/**
 * Service Worker — SCI HSE Dashboard
 * Static app shell: cache-first + background refresh.
 * Google Apps Script API: NEVER cached here; index.html handles freshness/retry.
 * POST requests are never intercepted.
 */
const CACHE_VERSION='hse-dashboard-v2';
const APP_SHELL=[
 './','./index.html','./manifest.json',
 './icons/icon-16.png','./icons/icon-32.png','./icons/icon-48.png',
 './icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png',
 './icons/icon-192-maskable.png','./icons/icon-512-maskable.png',
 './icons/favicon.ico'
];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_VERSION).then(cache=>
  Promise.all(APP_SHELL.map(url=>cache.add(url).catch(err=>console.warn('[sw] skip cache:',url,err))))
 ).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(
  keys.filter(k=>k!==CACHE_VERSION).map(k=>caches.delete(k))
 )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.hostname==='script.google.com'||url.hostname==='script.googleusercontent.com'||url.pathname.includes('/macros/'))return;
 if(url.origin!==self.location.origin)return;
 event.respondWith(cacheFirst(req));
});
async function cacheFirst(req){
 const cached=await caches.match(req);
 if(cached){fetchAndCache(req).catch(()=>{});return cached;}
 try{return await fetchAndCache(req);}
 catch(err){
  if(req.mode==='navigate'){const shell=await caches.match('./index.html');if(shell)return shell;}
  throw err;
 }
}
async function fetchAndCache(req){
 const res=await fetch(req);
 if(res&&res.ok){const cache=await caches.open(CACHE_VERSION);await cache.put(req,res.clone());}
 return res;
}
