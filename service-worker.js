const CACHE_NAME = "standout-v2.5 beta ";
//const MEDIA_CACHE = "standout-media";
// NEVER versioned

const FONT_AWESOME_CACHE =
  "standout-fontawesome-v1";

const BACKGROUND_CACHE =
  "standout-background-v14";

const WELCOME_CACHE =
  "standout-welcome-v5";


const WELCOME_ASSETS = [
  "/welcome.mp4"
];


const FONT_AWESOME_FILES = [
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/webfonts/fa-solid-900.woff2",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/webfonts/fa-regular-400.woff2",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/webfonts/fa-brands-400.woff2"
];


const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/documentation.html",
  "/standout-guide.html",
  "/drop-info.html",

  // well-known
  "/.well-known/assetlinks.json",

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
  "/CSS/welcome.css",
  "/CSS/daily-challenge.css",
  "/CSS/season.css",
  "/CSS/mastery.css",
  "/CSS/drop-info.css",

  // JS
  "/JS/cards.js",
  "/JS/app.js",
  "/JS/background.js",
  "/JS/badges.js",
  "/JS/custom-cards.js",
  "/JS/momentum.js",
  "/JS/sound.js",
  "/JS/welcome.js",
  "/JS/daily-challenge.js",
  "/JS/season.js",
  "/JS/mastery.js",
  "/JS/drop-info.js",

  "/icon.jpeg"
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
  "/Images/Endgame_Cap.gif",
  "/Images/Endgame_Thor.gif",

  // Sounds
  "/Music/Complete.mp3",
  "/Music/Achievements.mp3",
  "/Music/m1.mp3",
  "/Music/m2.mp3",
  "/Music/m3.mp3",
  "/Music/m4.mp3",
  "/Music/m5.mp3",
  "/Music/m6.mp3",
  "/Music/CardMint.mp3",

  // Video
  "/AchievedGoal.mp4",

  // Badges
  "/badges/aug-2026.png",
  "/badges/sep-2026.png",

  // Assets
  "/assets/cards/season-01-ascension",
  "/assets/cards/season-01-beyond-limits"
];


/* ===========================
   INSTALL → CACHE APP SHELL
=========================== */

self.addEventListener(
  "install",
  event => {

    console.log(
      "🟡 SW installing..."
    );

    event.waitUntil(

      (async () => {

        /* =====================================================
           APP SHELL
        ===================================================== */

        const appCache =
          await caches.open(
            CACHE_NAME
          );

        /*
         * Cache files individually.
         *
         * IMPORTANT:
         * If one file is missing, the Service Worker
         * installation will NOT fail.
         */

        await Promise.all(

          APP_SHELL.map(
            async url => {

              try {

                const response =
                  await fetch(
                    url,
                    {
                      cache: "no-cache"
                    }
                  );

                if (response.ok) {

                  await appCache.put(
                    url,
                    response.clone()
                  );

                  console.log(
                    "✅ Shell cached:",
                    url
                  );

                } else {

                  console.warn(
                    "⚠️ Shell file unavailable:",
                    url,
                    response.status
                  );

                }

              } catch (error) {

                console.warn(
                  "⚠️ Shell cache failed:",
                  url,
                  error
                );

              }

            }
          )

        );

        console.log(
          "✅ App shell caching finished"
        );


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


        /* =====================================================
           WELCOME VIDEO
        ===================================================== */

        const welcomeCache =
          await caches.open(
            WELCOME_CACHE
          );


        try {

          await welcomeCache.addAll(
            WELCOME_ASSETS
          );

          console.log(
            "✅ Welcome video cached"
          );

        } catch (error) {

          console.warn(
            "⚠️ Welcome video cache failed:",
            error
          );

        }

      })()

    );


    self.skipWaiting();

  }
);


/* ===========================
   MESSAGE
=========================== */

self.addEventListener(
  "message",
  event => {

    if (
      event.data === "SKIP_WAITING"
    ) {

      self.skipWaiting();

    }

  }
);


/* ===========================
   ACTIVATE → CLEAN OLD CACHES
=========================== */

self.addEventListener(
  "activate",
  event => {

    console.log(
      "🟢 SW activating"
    );

    event.waitUntil(

      (async () => {

        const keys =
          await caches.keys();


        await Promise.all(

          keys.map(
            k => {

              if (
                k === CACHE_NAME ||
                k === FONT_AWESOME_CACHE ||
                k === BACKGROUND_CACHE ||
                k === WELCOME_CACHE
              ) {

                return Promise.resolve();

              }


              return caches.delete(k);

            }
          )

        );


        cacheBackgroundAssets()
          .catch(
            error => {

              console.warn(
                "Background asset caching failed:",
                error
              );

            }
          );


        /* =====================================================
           NOTIFY CLIENTS
        ===================================================== */

        const clients =
          await self.clients.matchAll({
            includeUncontrolled: true
          });


        clients.forEach(
          client => {

            client.postMessage({
              type: "SW_UPDATED"
            });

          }
        );

      })()

    );


    self.clients.claim();

  }
);


/* =========================================================
   FETCH → CACHE STRATEGY
========================================================= */

self.addEventListener(
  "fetch",
  event => {

    const url =
      event.request.url;

    const pathname =
      new URL(url).pathname;


    /* =====================================================
       FONT AWESOME
       BACKGROUND
       WELCOME VIDEO
    ===================================================== */

    if (
      FONT_AWESOME_FILES.includes(url) ||
      BACKGROUND_ASSETS.includes(pathname) ||
      WELCOME_ASSETS.includes(pathname)
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
       APP REQUESTS

       1. Use cached version first.
       2. If not cached, try network.
       3. Cache successful same-origin GET requests.
       4. If offline navigation fails, return index.html.
    ===================================================== */

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


          /*
           * Runtime-cache successful
           * same-origin GET requests.
           */

          if (
            event.request.method === "GET" &&
            new URL(
              event.request.url
            ).origin === self.location.origin &&
            response.ok
          ) {

            const runtimeCache =
              await caches.open(
                CACHE_NAME
              );


            await runtimeCache.put(
              event.request,
              response.clone()
            );

          }


          return response;

        } catch (error) {

          /*
           * Only navigation requests should
           * fall back to index.html.
           */

          if (
            event.request.mode === "navigate"
          ) {

            const offlinePage =
              await caches.match(
                "/index.html"
              );


            if (offlinePage) {

              return offlinePage;

            }

          }


          throw error;

        }

      })()

    );

  }
);


/* =========================================================
   CACHE BACKGROUND ASSETS
========================================================= */

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
        await cache.match(
          url
        );


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
