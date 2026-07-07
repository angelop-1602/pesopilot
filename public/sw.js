const CACHE_VERSION = "pesopilot-v3"
const APP_SHELL = [
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return
  }

  if (shouldBypassServiceWorker(url)) {
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request))
    return
  }

  if (isAppShellAsset(url)) {
    event.respondWith(cacheFirst(request))
  }
})

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION)

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return (await cache.match(request)) ?? Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION)
  const cached = await cache.match(request)

  if (cached) {
    return cached
  }

  const response = await fetch(request)

  if (response.ok) {
    cache.put(request, response.clone())
  }

  return response
}

function shouldBypassServiceWorker(url) {
  return (
    url.pathname === "/sw.js" ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/__nextjs") ||
    url.pathname.includes(".hot-update.") ||
    url.pathname.endsWith(".map")
  )
}

function isAppShellAsset(url) {
  return (
    url.pathname === "/manifest.webmanifest" ||
    url.pathname.startsWith("/icons/")
  )
}
