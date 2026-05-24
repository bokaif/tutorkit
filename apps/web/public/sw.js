/* TutorKit service worker
 *
 * Minimal "app shell" SW so Chromium fires `beforeinstallprompt`:
 *   1. stale-while-revalidate for same-origin GETs
 *   2. network-only fallback for everything else
 * Firestore handles its own offline persistence via IndexedDB.
 */

const VERSION = "tutorkit-v1"
const CACHE = `tutorkit-${VERSION}`
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => undefined))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Skip Next.js dev / HMR endpoints so we don't break the dev server.
  if (
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.startsWith("/_next/static/webpack")
  ) {
    return
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match(request, { ignoreSearch: false })
      const networkPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            cache.put(request, response.clone()).catch(() => undefined)
          }
          return response
        })
        .catch(() => cached ?? Response.error())
      return cached ?? networkPromise
    })()
  )
})
