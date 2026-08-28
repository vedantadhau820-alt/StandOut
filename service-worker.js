const CACHE_NAME = "standout-v2.3 beta 11";
//const MEDIA_CACHE = "standout-media";  
// NEVER versioned

const FONT_AWESOME_CACHE =
  "standout-fontawesome-v1";

const BACKGROUND_CACHE =
  "standout-background-v2";

const FONT_AWESOME_FILES = [
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/webfonts/fa-solid-900.woff2",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/webfonts/fa-regular-400.woff2",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/webfonts/fa-brands-400.woff2"
];

const APP_SHELL = [
  "/",                  // IMPORTANT
  "/index.html",
  "/manifest.json",

  "/widget.js",
  "/widget.html",

  // CSS
  "/CSS/base.css",
  "/CSS/buttons.css",
  "/CSS/components.css",
  "/CSS/features.css",
  "/CSS/effects.css",
  "/CSS/timer.css",
  "/CSS/account.css",
  "/CSS/badges.css",
  "/CSS/momentum.css",
  "/CSS/monthly-report.css",

  //JS
  "/JS/cards.js",
  "/JS/app.js",
  "/JS/background.js",
  "/JS/badges.js",
  "/JS/custom-cards.js",
  "/JS/momentum.js",
  "/JS/sound.js",
  "/icon.jpeg",
  



];



const BACKGROUND_ASSETS = [

  
  // Images
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
  
  "/Images/w4.jpg",

  // Sounds
  "/Music/Complete.mp3",
  "/Music/Achievements.mp3",
  "/Music/m1.mp3",
  "/Music/m2.mp3",
  "/Music/m3.mp3",
  "/Music/m4.mp3",
  "/Music/m5.mp3",
  "/Music/m6.mp3",
  "/Music/MintCard.mp3",

  // Video
  "/AchievedGoal.mp4",

  // Font Awesome
  //...FONT_AWESOME_FILES

  //bagdes
  "/badges/aug-2026.png",
  "/badges/sep-2026.png",
];

/* ===========================
   INSTALL → CACHE APP SHELL
=========================== */
self.addEventListener("install", event => {

  console.log("🟡 SW installing...");

  event.waitUntil(
    (async () => {

      /* =====================================================
         APP SHELL
      ===================================================== */

      const appCache =
        await caches.open(CACHE_NAME);

      try {

        await appCache.addAll(
          APP_SHELL
        );

        console.log(
          "✅ App shell cached"
        );

      } catch (err) {

        console.error(
          "❌ App shell cache failed:",
          err
        );

        throw err;

      }


      /* =====================================================
         FONT AWESOME
      ===================================================== */

      const fontAwesomeCache =
        await caches.open(
          FONT_AWESOME_CACHE
        );

      for (
        const url of FONT_AWESOME_FILES
      ) {

        try {

          const response =
            await fetch(
              url,
              {
                mode: "cors"
              }
            );

          if (
            response.ok
          ) {

            await fontAwesomeCache.put(
              url,
              response
            );

            console.log(
              "✅ Font Awesome cached:",
              url
            );

          }

        } catch (error) {

          console.warn(
            "⚠️ Could not cache Font Awesome:",
            url,
            error
          );

        }

      }

    })()
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
  console.log("🟢 SW activating");

  event.waitUntil(
    (async () => {
      // clean old caches
      const keys = await caches.keys();
      await Promise.all(
        keys.map(k => {

          if (
            k === CACHE_NAME ||
            k === FONT_AWESOME_CACHE ||
            k === BACKGROUND_CACHE
          ) {
            return Promise.resolve();
          }

          return caches.delete(k);

        })
      );

      cacheBackgroundAssets().catch(error => {

        console.warn(
          "Background asset caching failed:",
          error
        );

      });

      // notify ALL clients
      const clients = await self.clients.matchAll({
        includeUncontrolled: true
      });

      clients.forEach(client => {
        client.postMessage({ type: "SW_UPDATED" });
      });
    })()
  );

  self.clients.claim();
});

/* ===========================
   FETCH → CACHE STRATEGY
=========================== */
self.addEventListener("fetch", event => {

  const url =
    event.request.url;


  /* =====================================================
     FONT AWESOME / BACKGROUND ASSETS
  ===================================================== */

  if (
    FONT_AWESOME_FILES.includes(url) ||
    BACKGROUND_ASSETS.includes(
      new URL(
        event.request.url
      ).pathname
    )
  ) {

    event.respondWith(

      (async () => {

        const cached =
          await caches.match(
            event.request
          );

        if (cached) {

          return cached;

        }


        try {

          const response =
            await fetch(
              event.request
            );

          return response;

        } catch (error) {

          console.warn(
            "Offline asset unavailable:",
            event.request.url
          );

          throw error;

        }

      })()

    );

    return;

  }


  /* =====================================================
     EXISTING APP SHELL LOGIC
  ===================================================== */

  event.respondWith(

    caches.match(
      event.request
    ).then(cached => {

      if (cached) {
        return cached;
      }

      return fetch(
        event.request
      ).catch(() =>
        caches.match(
          "/index.html"
        )
      );

    })

  );

});


async function cacheBackgroundAssets() {

  const cache =
    await caches.open(
      BACKGROUND_CACHE
    );

  for (
    const url of BACKGROUND_ASSETS
  ) {

    try {

      const existing =
        await cache.match(url);

      if (existing) {

        console.log(
          "Already cached:",
          url
        );

        continue;

      }

      const response =
        await fetch(
          url
        );

      if (
        response.ok
      ) {

        await cache.put(
          url,
          response.clone()
        );

        console.log(
          "✅ Background cached:",
          url
        );

      }

    } catch (error) {

      console.warn(
        "⚠️ Background cache failed:",
        url,
        error
      );

    }

  }

}

