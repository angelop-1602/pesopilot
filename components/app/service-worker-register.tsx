"use client"

import { useEffect } from "react"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return
    }

    if (process.env.NODE_ENV !== "production") {
      void clearLocalServiceWorkers()
      return
    }

    const register = async () => {
      try {
        let refreshing = false
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })

        await registration.update()

        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" })
        }

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing

          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              worker.postMessage({ type: "SKIP_WAITING" })
            }
          })
        })

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) {
            return
          }

          refreshing = true
          window.location.reload()
        })
      } catch (error) {
        console.warn("PesoPilot service worker registration failed.", error)
      }
    }

    void register()
  }, [])

  return null
}

async function clearLocalServiceWorkers() {
  const registrations = await navigator.serviceWorker.getRegistrations()

  await Promise.all(registrations.map((registration) => registration.unregister()))

  if (!("caches" in window)) {
    return
  }

  const keys = await caches.keys()

  await Promise.all(
    keys
      .filter((key) => key.startsWith("pesopilot-"))
      .map((key) => caches.delete(key))
  )
}
