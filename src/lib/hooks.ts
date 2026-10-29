import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { playNotes, setVolume } from './audio'
import type { Voicing } from './chords'
import { useStore } from './store'

const onHash = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

/** `#/practice/Am` → ['practice', 'Am']. Hash routing keeps back/forward and links working on any static host. */
export function useRoute() {
  const hash = useSyncExternalStore(onHash, () => location.hash)
  return hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent)
}
export const go = (...parts: string[]) => {
  location.hash = '/' + parts.map(encodeURIComponent).join('/')
}

export function useMedia(query: string) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const m = matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => matchMedia(query).matches)
}

/** Plays a voicing with the user's sound settings and returns ring state for ChordDiagram. */
export function usePlay() {
  const { settings } = useStore()
  const [ring, setRing] = useState<{ key: number; offsets: number[] } | null>(null)
  useEffect(() => {
    if (!ring) return
    const t = setTimeout(() => setRing(null), 2500)
    return () => clearTimeout(t)
  }, [ring])
  const play = useCallback(
    (v: Voicing, style = settings.strum) => {
      setVolume(settings.volume)
      setRing({ key: Date.now(), offsets: playNotes(v.midi, style) })
    },
    [settings.strum, settings.volume],
  )
  return { ring, play }
}
