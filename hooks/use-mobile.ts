import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

const getIsMobileSnapshot = () => {
  if (typeof window === "undefined") {
    return false
  }

  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

const getIsMobileServerSnapshot = () => false

const subscribeToMobileChanges = (onStoreChange: () => void) => {
  if (typeof window === "undefined") {
    return () => {}
  }

  const mql = window.matchMedia(MOBILE_MEDIA_QUERY)
  mql.addEventListener("change", onStoreChange)

  return () => mql.removeEventListener("change", onStoreChange)
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobileChanges,
    getIsMobileSnapshot,
    getIsMobileServerSnapshot
  )
}
