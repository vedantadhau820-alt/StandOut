const CACHE_NAME = "standout-v1";

const APP_SHELL = [
  "/",                  // IMPORTANT
  "/index.html",
  "/manifest.json",

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
  "/Achievements.mp3"
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
  const request = event.request;

  // Cache images & audio dynamically
  if (
    request.destination === "image" ||
    request.destination === "audio"
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;

          return fetch(request).then(response => {
            cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // App shell fallback
  event.respondWith(
    caches.match(request).then(res => {
      return res || fetch(request);
    })
  );
});

