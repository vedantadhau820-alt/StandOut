const CACHE_NAME = "standout-v2.1.8";
const MEDIA_CACHE = "standout-media";     // NEVER versioned

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
   MEDIA FILES (STABLE)
   ➜ Add ONLY when NEW files appear
=========================== */
const MEDIA_FILES = [
  "/Music/Complete.mp3",
  "/Music/Achievements.mp3",
  "/Music/m1.mp3",
  "/Music/m2.mp3",
  "/Music/m3.mp3",
  "/Music/m4.mp3",
  "/Music/m5.mp3",
  "/Music/m6.mp3",

        
];

/* ===========================
   INSTALL
=========================== */
self.addEventListener("install", event => {
  console.log("🟡 SW installing");

  event.waitUntil(
    Promise.all([
      // Cache app shell (versioned)
      caches.open(CACHE_NAME).then(cache => {
        console.log("📦 Caching app shell");
        return cache.addAll(APP_SHELL);
      }),

      // Cache media ONCE (never deleted)
      caches.open(MEDIA_CACHE).then(cache => {
        console.log("🎵 Caching media files");
        return cache.addAll(MEDIA_FILES);
      })
    ])
  );

  self.skipWaiting();
});

/* ===========================
   ACTIVATE
=========================== */
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(k => k !== APP_CATCHE && caches.delete(k))
      );

      const clients = await self.clients.matchAll({
        includeUncontrolled: true
      });

      clients.forEach(client => {
        client.postMessage({ type: "SW_ACTIVATED" });
      });
    })()
  );

  self.clients.claim();
});
/* ===========================
   FETCH (CACHE FIRST)
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



