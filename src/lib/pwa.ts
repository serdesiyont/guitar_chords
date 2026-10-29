import { useSyncExternalStore } from 'react'
import { toast } from 'sonner'

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let deferred: InstallPrompt | null = null
let installed = matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
let offlineReady = !!navigator.serviceWorker?.controller
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())

// Registered at import time: Chrome can fire this before React has mounted.
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e as InstallPrompt
  emit()
})
addEventListener('appinstalled', () => {
  installed = true
  deferred = null
  emit()
})

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  const firstInstall = !navigator.serviceWorker.controller
  navigator.serviceWorker
    .register('./sw.js')
    .then((reg) => {
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing
        sw?.addEventListener('statechange', () => {
          if (sw.state !== 'activated') return
          offlineReady = true
          emit()
          if (firstInstall) toast('Ready to use offline')
          else toast('Chordhub was updated', { duration: Infinity, action: { label: 'Reload', onClick: () => location.reload() } })
        })
      })
      // An installed app rarely navigates, so look for a new version whenever it comes back to the foreground.
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && void reg.update().catch(() => {}))
    })
    .catch(() => {
      // No service worker (private mode, file://): the app still works online.
    })
}

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export type InstallState = 'installed' | 'ready' | 'ios' | 'unavailable'
const snapshot = (): InstallState => (installed ? 'installed' : deferred ? 'ready' : isIos ? 'ios' : 'unavailable')
const subscribe = (cb: () => void) => {
  subs.add(cb)
  return () => void subs.delete(cb)
}

export function usePwa() {
  const state = useSyncExternalStore(subscribe, snapshot)
  const offline = useSyncExternalStore(subscribe, () => offlineReady)
  const install = async () => {
    const d = deferred
    if (!d) return
    deferred = null // a prompt can only be shown once
    emit()
    await d.prompt()
  }
  return { state, offline, install }
}
