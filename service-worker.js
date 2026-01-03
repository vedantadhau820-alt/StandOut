const CACHE_NAME = "standout-cache-v4";

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

// INSTALL
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

// FETCH (OFFLINE SAFE)
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => {
      return (
        res ||
        fetch(event.request).catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        })
      );
    })
  );
});

/* 🔕 Firebase ONLY for notifications */
importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDUh518DMZJojohVb3zhnIcf2_QWe_R-ow",
  authDomain: "notiq-d168b.firebaseapp.com",
  projectId: "notiq-d168b",
  storageBucket: "notiq-d168b.firebasestorage.app",
  messagingSenderId: "706368072132",
  appId: "1:706368072132:web:8d9c61d6c2c55c02a85c91"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: payload.notification.icon || "/icon.jpeg"
  });
});

