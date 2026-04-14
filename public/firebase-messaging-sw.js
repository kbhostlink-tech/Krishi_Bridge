/* eslint-disable no-restricted-globals */
/**
 * Firebase Cloud Messaging Service Worker
 *
 * Handles background push notifications when the app is not in the foreground.
 * The Firebase config is injected via query params when registering the SW.
 */

// Firebase SDK compat for service workers (loaded from CDN)
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

// Initialize Firebase with config from env (injected at registration time)
// Default no-op config — will be overwritten by postMessage from the client
let firebaseConfig = {};

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "FIREBASE_CONFIG") {
    firebaseConfig = event.data.config;
    firebase.initializeApp(firebaseConfig);
    firebase.messaging();
  }
});

// Handle background messages
try {
  if (firebase.apps.length === 0) {
    // Fallback: initialize with empty config (will be re-initialized via message)
    firebase.initializeApp({ apiKey: "placeholder", projectId: "placeholder", messagingSenderId: "0", appId: "0" });
  }

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification || {};
    const data = payload.data || {};

    if (!title) return;

    const options = {
      body: body || "",
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      tag: data.event || "agriexchange",
      data: {
        url: data.link || "/dashboard",
        ...data,
      },
      requireInteraction: true,
      actions: [{ action: "open", title: "View" }],
    };

    self.registration.showNotification(title, options);
  });
} catch (e) {
  // Firebase not configured — service worker still works for other purposes
}

// Handle notification click — navigate to the relevant page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if one is open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
