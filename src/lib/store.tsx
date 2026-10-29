import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { StrumStyle } from './audio'

export type Settings = {
  leftHanded: boolean
  strum: StrumStyle
  volume: number
  sensitivity: number // mic gate, 0 = needs loud playing, 1 = picks up whispers
  strictness: number // practice judging, 0 = forgiving, 1 = strict
  bpm: number
  beatsPerChord: number
  click: boolean
  runMode: 'tempo' | 'wait'
}
export type ChordStat = { attempts: number; hits: number; bestMs?: number }
export type Progression = { id: string; name: string; chords: string[] }

const DEFAULTS = {
  settings: { leftHanded: false, strum: 'strum', volume: 0.8, sensitivity: 0.5, strictness: 0.4, bpm: 70, beatsPerChord: 4, click: true, runMode: 'tempo' } as Settings,
  favorites: [] as string[],
  stats: {} as Record<string, ChordStat>,
  days: [] as string[], // local YYYY-MM-DD dates with any practice
  progressions: [] as Progression[],
  bests: {} as Record<string, number>, // progression id → best % clean changes
}
type Data = typeof DEFAULTS
const KEY = 'chordbox:v1'

function load(): Data {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const d = JSON.parse(raw) as Partial<Data>
    return { ...DEFAULTS, ...d, settings: { ...DEFAULTS.settings, ...d.settings } }
  } catch {
    return DEFAULTS
  }
}

export const today = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Consecutive practice days ending today (or yesterday, so the streak survives until tonight). */
export function streak(days: string[]) {
  const set = new Set(days)
  const d = new Date()
  if (!set.has(today(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (set.has(today(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

function useData() {
  const [data, setData] = useState<Data>(load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch {
      // Private mode / full storage: the app still works, it just forgets.
    }
  }, [data])

  const patch = (fn: (d: Data) => Partial<Data>) => setData((d) => ({ ...d, ...fn(d) }))
  const markDay = (d: Data) => (d.days.includes(today()) ? d.days : [...d.days, today()].slice(-400))

  return {
    ...data,
    streak: streak(data.days),
    setSettings: (s: Partial<Settings>) => patch((d) => ({ settings: { ...d.settings, ...s } })),
    toggleFavorite: (id: string) =>
      patch((d) => ({ favorites: d.favorites.includes(id) ? d.favorites.filter((f) => f !== id) : [...d.favorites, id] })),
    recordAttempt: (id: string, hit: boolean, ms?: number) =>
      patch((d) => {
        const s = d.stats[id] ?? { attempts: 0, hits: 0 }
        const bestMs = hit && ms != null ? Math.min(ms, s.bestMs ?? Infinity) : s.bestMs
        return { stats: { ...d.stats, [id]: { attempts: s.attempts + 1, hits: s.hits + Number(hit), bestMs } }, days: markDay(d) }
      }),
    recordRun: (progId: string, pct: number) =>
      patch((d) => ({ bests: { ...d.bests, [progId]: Math.max(pct, d.bests[progId] ?? 0) }, days: markDay(d) })),
    saveProgression: (p: Progression) =>
      patch((d) => ({ progressions: [...d.progressions.filter((x) => x.id !== p.id), p] })),
    deleteProgression: (id: string) => patch((d) => ({ progressions: d.progressions.filter((x) => x.id !== id) })),
    resetProgress: () => patch(() => ({ stats: {}, days: [], bests: {} })),
  }
}

type Store = ReturnType<typeof useData>
const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={useData()}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}
