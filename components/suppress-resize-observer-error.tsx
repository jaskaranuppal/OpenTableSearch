"use client"

import { useEffect } from "react"

/**
 * Suppresses the benign "ResizeObserver loop completed with undelivered
 * notifications" browser warning. This is not a real error — it fires when a
 * ResizeObserver callback triggers another resize within the same frame, which
 * commonly happens with layout-measuring UI (dropdowns, InstantSearch widgets,
 * responsive containers). The browser recovers automatically on the next frame,
 * but Next.js's dev error overlay surfaces it noisily.
 *
 * See: https://github.com/WICG/resize-observer/issues/38
 */
export function SuppressResizeObserverError() {
  useEffect(() => {
    const RESIZE_OBSERVER_MESSAGES = [
      "ResizeObserver loop completed with undelivered notifications.",
      "ResizeObserver loop limit exceeded",
    ]

    const isResizeObserverError = (message: unknown) =>
      typeof message === "string" &&
      RESIZE_OBSERVER_MESSAGES.some((m) => message.includes(m))

    const onError = (event: ErrorEvent) => {
      if (isResizeObserverError(event.message)) {
        event.stopImmediatePropagation()
        event.preventDefault()
      }
    }

    // The Next.js dev overlay also listens for unhandled errors; capturing here
    // (in the capture phase) stops the benign message before it reaches it.
    window.addEventListener("error", onError, true)

    return () => {
      window.removeEventListener("error", onError, true)
    }
  }, [])

  return null
}
