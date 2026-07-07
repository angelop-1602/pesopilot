"use client"

const DATA_CHANGE_EVENT = "pesopilot:data-change"

export function notifyDataChanged() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(DATA_CHANGE_EVENT))
}

export function subscribeToDataChanges(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {}
  }

  window.addEventListener(DATA_CHANGE_EVENT, callback)

  return () => window.removeEventListener(DATA_CHANGE_EVENT, callback)
}
