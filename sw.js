/**
 * Service Worker — SCI HSE Dashboard
 *
 * Strategy:
 *   - App shell (index.html, icons, manifest) → cache-first, so the app opens
 *     instantly even on a weak connection, then quietly refreshes in the background.
 *   - Google Apps Script API calls (script.google.com) → network-first, so data
 *     is always as fresh as possible when online, falling back to the last
 *     cached response only if the network is unreachable.
 *
 * Bump CACHE_VERSION whenever index.html/CSS/manifest/icons change, so old
 * clients pick up the new files instead of serving a stale cached shell.
 */

const CACHE_VERSION = 'hse-dashboard-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // addAll fails the whole install if even one URL 404s — use individual
      // adds so a missing/renamed icon doesn't block the whole install.
      return Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => console.warn('[sw] skip cache:', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // never intercept POST (form submits, saves)

  const url = new URL(req.url);
  const isApiCall = url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com';

  if (isApiCall) {
    event.respondWith(networkFirst(req));
  } else {
    event.respondWith(cacheFirst(req));
  }
});

async function cacheFirst(req){
  const cached = await caches.match(req);
  if (cached) {
    // Refresh the cache in the background so the next load has the latest file.
    fetchAndCache(req);
    return cached;
  }
  try {
    return await fetchAndCache(req);
  } catch (err) {
    // Last resort for a navigation request with nothing cached yet.
    if (req.mode === 'navigate') {
      const shell = await caches.match('./index.html');
      if (shell) return shell;
    }
    throw err;
  }
}

async function networkFirst(req){
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(CACHE_VERSION);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await caches.match(req);
    if (cached) return cached;
    throw err;
  }
}

async function fetchAndCache(req){
  const res = await fetch(req);
  if (res && res.ok) {
    const cache = await caches.open(CACHE_VERSION);
    cache.put(req, res.clone());
  }
  return res;
}
