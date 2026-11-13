// Cross-origin isolation for hosts that cannot send headers (GitHub Pages).
//
// The app draws on several threads only when the page is cross-origin isolated, which
// needs two response headers. This worker adds them to every response of the app's own
// site. index.html registers it only when the page is not isolated already, and reloads
// once so the page is served through it. Requests to other sites (the API, fonts) pass
// through untouched.
'use strict';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  // A cache-only request from another context cannot be fetched again here.
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;

  event.respondWith(
    fetch(req).then((res) => {
      if (res.status === 0) return res; // opaque: headers cannot be changed
      const headers = new Headers(res.headers);
      headers.set('Cross-Origin-Opener-Policy', 'same-origin');
      headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
      headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    })
  );
});
