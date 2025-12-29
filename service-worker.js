// ----- PWA CACHE SETUP -----
const CACHE_NAME = "standout-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/js.png",
  "/Complete.mp3",
  "/Achievements.mp3",
  "/m1.mp3",
  "/m2.mp3",
  "/m3.mp3",
  "/m4.mp3",
  "/m5.mp3",
  "/m6.mp3",
  "/service-worker.js",
  "/manifest.js"
];

// Install event - cache important assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Intercept fetch (offline support)
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => {
      return (
        res ||
        fetch(event.request).catch(() => {
          // Optional fallback
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        })
      );
    })
  );
});

// ----- FIREBASE (FCM) SETUP -----
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDUh518DMZJojohVb3zhnIcf2_QWe_R-ow",
  authDomain: "notiq-d168b.firebaseapp.com",
  projectId: "notiq-d168b",
  storageBucket: "notiq-d168b.firebasestorage.app",
  messagingSenderId: "706368072132",
  appId: "1:706368072132:web:8d9c61d6c2c55c02a85c91"
});

const messaging = firebase.messaging();

// Background FCM handler
messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: payload.notification.icon || "js.png"
  });
});

