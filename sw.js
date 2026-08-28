const CACHE_NAME = "star-striker-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./js/data.js",
  "./js/engine.js",
  "./js/aim.js",
  "./js/dribble.js",
  "./js/casino.js",
  "./js/career.js",
  "./js/match.js",
  "./js/ui.js",
  "./js/main.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event)=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=> cache.addAll(ASSETS)).then(()=> self.skipWaiting())
  );
});

self.addEventListener("activate", (event)=>{
  event.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=> k!==CACHE_NAME).map(k=> caches.delete(k)))
    ).then(()=> self.clients.claim())
  );
});

// network-first for our own app files, so a new deploy is picked up on the
// next load instead of being stuck behind a stale cache; falls back to the
// cache only when offline.
self.addEventListener("fetch", (event)=>{
  if(event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).then(resp=>{
      if(resp.ok && resp.type==="basic"){
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache=> cache.put(event.request, copy));
      }
      return resp;
    }).catch(()=> caches.match(event.request))
  );
});
