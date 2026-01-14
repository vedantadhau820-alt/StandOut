const CACHE_NAME = "standout-v2.1.1";

const APP_SHELL = [
  "/",                  // IMPORTANT
  "/index.html",
  "/manifest.json",
  "/JS/cards.js",
  "/JS/app.js",

  // CSS
  "/CSS/base.css",
  "/CSS/buttons.css",
  "/CSS/components.css",
  "/CSS/features.css",
  "/CSS/effects.css",
  "/CSS/timer.css",
  "/CSS/account.css",

  

  // Assets
  "/icon.jpeg",
  "/Music/Complete.mp3",
  "/Music/Achievements.mp3",
  "/Music/m1.mp3",
  "/Music/m2.mp3",
  "/Music/m3.mp3",
  "/Music/m4.mp3",
  "/Music/m5.mp3",
  "/Music/m6.mp3",
  
  "/Images/s1.jpg",
  "/Images/s2.jpg",
  "/Images/a1.jpg",
  "/Images/a2.jpg",
  "/Images/a3.jpg",
  "/Images/b1.jpg",
  "/Images/b2.jpg",
  "/Images/b3.jpg",
  "/Images/b4.jpg",
  "/Images/b5.jpg",
  "/Images/c1.jpg",
  "/Images/c2.jpg",
  "/Images/c3.jpg",
  "/Images/c4.jpg",
  "/Images/c5.jpg",
  "/Images/d1.jpg",
  "/Images/d2.jpg",
  "/Images/d3.jpg",
  "/Images/d4.jpg",
  "/Images/d5.jpg",
  "/Images/d6.jpg",
  "/Images/d7.jpg",
  "/Images/e1.jpg",
  "/Images/e2.jpg",
  "/Images/e3.jpg",
  "/Images/e4.jpg",
  "/Images/e5.jpg",
  "/Images/e6.jpg",
  "/Images/e7.jpg",
  "/Images/e8.jpg",
];

/* ===========================
   INSTALL → CACHE APP SHELL
=========================== */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
/* ===========================
   ACTIVATE → CLEAN OLD CACHES
=========================== */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/* ===========================
   FETCH → CACHE STRATEGY
=========================== */
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).catch(() =>
        caches.match("/index.html")
      );
    })
  );
});






