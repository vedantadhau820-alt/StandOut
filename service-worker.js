const CACHE_NAME = "standout-cache-v5";

const urlsToCache = [
  "/",
  "/index.html",
  "/documentation.html",
  "/manifest.json",
  "/icon.jpeg",
  "/Complete.mp3",
  "/Achievements.mp3",
  "/m1.mp3",
  "/m2.mp3",
  "/m3.mp3",
  "/m4.mp3",
  "/m5.mp3",
  "/m6.mp3",
  "/Images",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});

