const CACHE_NAME = "standout-v2.91-update-indicator-race-fix";

// Resolve app assets against the service worker's registration scope. This
// supports both a domain-root deployment and a project subfolder deployment.
const APP_SCOPE_URL = self.registration.scope;
const APP_SCOPE_PATH = new URL(APP_SCOPE_URL).pathname;
const resolveAppURL = path => new URL(path.replace(/^\/+/, ""), APP_SCOPE_URL).href;
const resolveAppPath = pathname => pathname.startsWith(APP_SCOPE_PATH)
  ? "/" + pathname.slice(APP_SCOPE_PATH.length)
  : pathname;

const FONT_AWESOME_CACHE =
  "standout-fontawesome-v2";

const BACKGROUND_CACHE =
  "standout-background-v3";

const WELCOME_CACHE =
  "standout-welcome-v3";


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
  "/CSS/index-embedded.css",
  "/CSS/documentation-embedded.css",
  "/CSS/standout-guide-embedded.css",
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
  "/JS/features/cards/catalogue-data.js",
  "/JS/app-part1.js",
  "/JS/app-part2.js",
  "/JS/app-part3.js",
  "/JS/features/background/background.js",
  "/JS/features/badges/badges.js",
  "/JS/features/achievements/achievements.js",
  "/JS/features/cards/catalogue.js",
  "/JS/features/cards/custom-cards.js",
  "/JS/features/cards/marketplace.js",
  "/JS/features/momentum/momentum.js",
  "/JS/features/sound/sound.js",
  "/JS/features/welcome-intro.js",
  "/JS/features/monthly-drop.js",
  "/JS/features/daily-challenge/daily-challenge.js",
  "/JS/season.js",
  "/JS/features/monthly-resolution/monthly-resolution.js",
  "/JS/features/season/season-core.js",
  "/JS/features/season/season-state.js",
  "/JS/features/season/season-progression.js",
  "/JS/features/season/season-ui.js",
  "/JS/features/mastery/mastery.js",
  "/JS/drop-info.js",

  // Modular foundation and extracted features
  "/JS/core/service-worker-registration.js",
  "/JS/core/event-delegation.js",
  "/JS/core/bootstrap.js",
  "/JS/core/storage.js",
  "/JS/core/events.js",
  "/JS/core/dom.js",
  "/JS/features/missions/history.js",
  "/JS/features/missions/completion.js",
  "/JS/features/missions/progression.js",
  "/JS/features/missions/scheduler.js",
  "/JS/features/goals/goals.js",
  "/JS/features/countdowns/countdowns.js",
  "/JS/features/skills.js",
  "/JS/features/app-shell.js",
  "/JS/features/startup.js",
  "/JS/features/legacy-compatibility.js",
  "/JS/features/app-part3-compatibility.js",
  "/JS/features/navigation.js",
  "/JS/features/timer.js",
  "/JS/features/modals.js",
  "/JS/features/music.js",
  "/JS/features/monthly-report.js",
  "/JS/features/cheats.js",
  "/JS/features/data/persistence.js",
  "/JS/features/data/reset.js",
  "/JS/features/data/reset-ui.js",
  "/JS/features/data/daily-cycle.js",
  "/JS/features/data/backup.js",
  "/JS/features/data/restore.js",
  "/JS/features/economy/points.js",
  "/JS/features/missions/management.js",
  "/JS/features/notifications/notifications.js",

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
  "/Music/DailyChallenge.mp3",

  // Video
  "/AchievedGoal.mp4",

  // Badges
  "/badges/aug-2026.png",
  "/badges/sep-2026.png",
  "/badges/oct-2026.png",
  "/badges/nov-2026.png",

  // Assets
  "/assets/cards/season-01-ascension",
  "/assets/cards/season-01-beyond-limits"
];


/* ===========================
   INSTALL → CACHE APP SHELL
=========================== */

self.addEventListener("install", event => {
  console.log("🟡 SW installing…");

  event.waitUntil((async () => {
    const appCache = await caches.open(CACHE_NAME);
    const fontAwesomeCache = await caches.open(FONT_AWESOME_CACHE);
    const welcomeCache = await caches.open(WELCOME_CACHE);
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const total = APP_SHELL.length + FONT_AWESOME_FILES.length + WELCOME_ASSETS.length;
    let completed = 0;

    const broadcast = message => {
      for (const client of clients) client.postMessage(message);
    };
    const reportProgress = () => {
      completed += 1;
      broadcast({
        type: "STANDOUT_UPDATE_PROGRESS",
        completed,
        total,
        percent: Math.round((completed / total) * 100)
      });
    };

    broadcast({ type: "STANDOUT_UPDATE_START", total });

    // Cache each shell asset independently so one optional/missing asset does
    // not prevent the rest of the application from being updated.
    await Promise.all(APP_SHELL.map(async path => {
      try {
        const assetURL = resolveAppURL(path);
        const response = await fetch(assetURL, { cache: "no-cache" });
        if (response.ok) await appCache.put(assetURL, response.clone());
        else console.warn("⚠️ Shell file unavailable:", path, response.status);
      } catch (error) {
        console.warn("⚠️ Shell cache failed:", path, error);
      } finally {
        reportProgress();
      }
    }));

    // Third-party fonts are part of the same visible download progress.
    for (const url of FONT_AWESOME_FILES) {
      try {
        const response = await fetch(url, { mode: "cors", cache: "no-cache" });
        if (response.ok) await fontAwesomeCache.put(url, response.clone());
        else console.warn("⚠️ Font Awesome file unavailable:", url, response.status);
      } catch (error) {
        console.warn("⚠️ Could not cache Font Awesome:", url, error);
      } finally {
        reportProgress();
      }
    }

    // Cache welcome assets individually to keep progress measurable.
    for (const path of WELCOME_ASSETS) {
      try {
        const assetURL = resolveAppURL(path);
        const response = await fetch(assetURL, { cache: "no-cache" });
        if (response.ok) await welcomeCache.put(assetURL, response.clone());
        else console.warn("⚠️ Welcome asset unavailable:", path, response.status);
      } catch (error) {
        console.warn("⚠️ Welcome asset cache failed:", path, error);
      } finally {
        reportProgress();
      }
    }

    broadcast({ type: "STANDOUT_UPDATE_READY", percent: 100 });
    console.log("✅ StandOut update assets processed; activating new worker.");

    // Give controlled pages a moment to paint the completed progress state,
    // then activate automatically. The page reloads on controllerchange.
    await new Promise(resolve => setTimeout(resolve, 400));
    await self.skipWaiting();
  })());
});

/* ===========================
   MESSAGE
=========================== */
self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});


/* ===========================
   ACTIVATE → CLEAN OLD CACHES
=========================== */

self.addEventListener("activate", event => {
  console.log("🟢 SW activating");

  event.waitUntil((async () => {
    const keys = await caches.keys();
    const hadPreviousStandOutCache = keys.some(key =>
      key.startsWith("standout-v") && key !== CACHE_NAME
    );

    await Promise.all(keys.map(key => {
      if (
        key === CACHE_NAME ||
        key === FONT_AWESOME_CACHE ||
        key === BACKGROUND_CACHE ||
        key === WELCOME_CACHE
      ) return Promise.resolve();
      return caches.delete(key);
    }));

    cacheBackgroundAssets().catch(error => {
      console.warn("Background asset caching failed:", error);
    });

    // Claim first so the new worker controls existing StandOut tabs.
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

    for (const client of windows) {
      if (!client.url || !client.url.startsWith(APP_SCOPE_URL)) continue;
      client.postMessage({ type: "SW_UPDATED", cacheName: CACHE_NAME });

      // Migration bridge: older app shells did not auto-reload on controllerchange.
      // Navigate only when a previous StandOut cache proves this is an update,
      // not the first-ever installation.
      if (hadPreviousStandOutCache && typeof client.navigate === "function") {
        try {
          await client.navigate(client.url);
        } catch (error) {
          console.warn("Could not reload an updated StandOut tab:", error);
        }
      }
    }
  })());
});


/* =========================================================
   FETCH → CACHE STRATEGY
========================================================= */

self.addEventListener(
  "fetch",
  event => {

    const url =
      event.request.url;

    const pathname =
      resolveAppPath(new URL(url).pathname);


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
                resolveAppURL("/index.html")
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

      const assetURL = resolveAppURL(url);
      const existing =
        await cache.match(
          assetURL
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
          assetURL
        );


      if (
        response.ok
      ) {

        await cache.put(
          assetURL,
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
