const CACHE_NAME = "standout-cache-v7";

const urlsToCache = [
  "/",
  "/index.html",
  "/documentation.html",
  "/manifest.json",
  "/icon.jpeg",
  "/Complete.mp3",
  "/Achievements.mp3"
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
  const request = event.request;

  // ✅ Runtime cache all images automatically
  if (request.destination === "image" || request.destination === "audio") { 
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

  // Default behavior for everything else
  event.respondWith(
    caches.match(request).then(res => res || fetch(request))
  );
});





