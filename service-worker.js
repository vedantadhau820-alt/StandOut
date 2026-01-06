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
  "/Images/e1.jpg",
  "/Images/e2.jpg",
  "/Images/e3.jpg",
  "/Images/e4.jpg",
  "/Images/e5.jpg",
  "/Images/e6.jpg",
  "/Images/e7.jpg",
  "/Images/e8.jpg",
  "/Images/d1.jpg",
  "/Images/d2.jpg",
  "/Images/d3.jpg",
  "/Images/d4.jpg",
  "/Images/d5.jpg",
  "/Images/d6.jpg",
  "/Images/d7.jpg",
  "/Images/c1.jpg",
  "/Images/c2.jpg",
  "/Images/c3.jpg",
  "/Images/c4.jpg",
  "/Images/c5.jpg",
  "/Images/b1.jpg",
  "/Images/b2.jpg",
  "/Images/b3.jpg",
  "/Images/b4.jpg",
  "/Images/b5.jpg",
  "/Images/a1.jpg",
  "/Images/a2.jpg",
  "/Images/a3.jpg",
  "/Images/s1.jpg",
  "/Images/s2.jpg",
];

const CACHE_NAME = "standout-cache-v2";

self.addEventListener("install", event => {
  self.skipWaiting(); // 🔥 FORCE ACTIVATE
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // 🔥 TAKE CONTROL IMMEDIATELY
      caches.keys().then(keys =>
        Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
      )
    ])
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;

  // 🔥 ALWAYS FETCH LATEST JS
  if (req.destination === "script" || req.destination === "style") {
    event.respondWith(fetch(req));
    return;
  }

  // Other assets → cache-first
  event.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});



