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
  "/e1.jpg",
  "/e2.jpg",
  "/e3.jpg",
  "/e4.jpg",
  "/e5.jpg",
  "/e6.jpg",
  "/e7.jpg",
  "/e8.jpg",
  "/d1.jpg",
  "/d2.jpg",
  "/d3.jpg",
  "/d4.jpg",
  "/d5.jpg",
  "/d6.jpg",
  "/d7.jpg",
  "/c1.jpg",
  "/c2.jpg",
  "/c3.jpg",
  "/c4.jpg",
  "/c5.jpg",
  "/b1.jpg",
  "/b2.jpg",
  "/b3.jpg",
  "/b4.jpg",
  "/b5.jpg",
  "/a1.jpg",
  "/a2.jpg",
  "/a3.jpg",
  "/s1.jpg",
  "/s2.jpg",
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
