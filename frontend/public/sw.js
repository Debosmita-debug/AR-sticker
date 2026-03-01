// This service worker intentionally does nothing.
// It exists to replace a previously-registered (now stale) workbox service worker
// that was intercepting Cloudinary image/video fetches and causing ERR_FAILED errors.
// Once installed, it immediately activates and unregisters itself.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => {
  self.registration
    .unregister()
    .then(() => self.clients.matchAll())
    .then((clients) =>
      clients.forEach((client) => client.navigate(client.url))
    );
});
