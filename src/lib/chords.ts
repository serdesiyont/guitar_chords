import db from '@tombatossals/chords-db/lib/guitar.json'
import { NOTE_NAMES, type Template } from './detect'

export const TUNING = [40, 45, 50, 55, 59, 64] // E2 A2 D3 G3 B3 E4, low → high
export const STRINGS = [
  { name: 'E', octave: 2, gauge: '.053' },
  { name: 'A', octave: 2, gauge: '.042' },
  { name: 'D', octave: 3, gauge: '.032' },
  { name: 'G', octave: 3, gauge: '.024' },
  { name: 'B', octave: 3, gauge: '.016' },
  { name: 'E', octave: 4, gauge: '.012' },
]

export type Voicing = {
  frets: number[] // per string low→high: -1 muted, 0 open, n = fret relative to baseFret
  fingers: number[]
  baseFret: number
  barres: number[]
  midi: number[]
}

export type Family = 'major' | 'minor' | 'seventh' | 'color' | 'other'

export type Chord = {
  id: string // display name, e.g. "Am7", also the stable storage key
  key: string
  root: number
  suffix: string
  family: Family
  voicings: Voicing[]
  open: boolean // first voicing is an open-position, no-barre shape
}

// [db suffix, display suffix, family], in library order. Anything not listed is left out.
// An array, not an object: objects put integer-like keys ('7', '9', '6') first.
const SUFFIXES: [string, string, Family][] = [
  ['major', '', 'major'],
  ['minor', 'm', 'minor'],
  ['7', '7', 'seventh'],
  ['maj7', 'maj7', 'seventh'],
  ['m7', 'm7', 'seventh'],
  ['9', '9', 'seventh'],
  ['m7b5', 'm7b5', 'seventh'],
  ['sus2', 'sus2', 'color'],
  ['sus4', 'sus4', 'color'],
  ['7sus4', '7sus4', 'color'],
  ['add9', 'add9', 'color'],
  ['6', '6', 'color'],
  ['m6', 'm6', 'color'],
  ['dim', 'dim', 'other'],
  ['dim7', 'dim7', 'other'],
  ['aug', 'aug', 'other'],
]
const ORDER = SUFFIXES.map((s) => s[1])

export const FAMILIES: { id: Family | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'major', label: 'Major' },
  { id: 'minor', label: 'Minor' },
  { id: 'seventh', label: '7ths' },
  { id: 'color', label: 'Sus & add' },
  { id: 'other', label: 'Dim & aug' },
]

export const KEYS = NOTE_NAMES

type DbPos = { frets: number[]; fingers: number[]; baseFret: number; barres: number[]; midi: number[] }
type DbChord = { key: string; suffix: string; positions: DbPos[] }

const isOpen = (v: Voicing) => v.baseFret === 1 && v.barres.length === 0 && v.frets.includes(0)

export const CHORDS: Chord[] = Object.values((db as unknown as { chords: Record<string, DbChord[]> }).chords)
  .flat()
  .flatMap((c) => {
    const s = SUFFIXES.find((x) => x[0] === c.suffix)
    if (!s) return []
    const voicings = c.positions.map(({ frets, fingers, baseFret, barres, midi }) => ({ frets, fingers, baseFret, barres, midi }))
    // Put an open shape first when one exists, it's what a beginner should see.
    voicings.sort((a, b) => Number(isOpen(b)) - Number(isOpen(a)))
    const root = NOTE_NAMES.indexOf(c.key)
    return [{ id: c.key + s[1], key: c.key, root, suffix: s[1], family: s[2], voicings, open: isOpen(voicings[0]) }]
  })
  .sort((a, b) => a.root - b.root || ORDER.indexOf(a.suffix) - ORDER.indexOf(b.suffix))

export const BY_ID = new Map(CHORDS.map((c) => [c.id, c]))

/** The handful every first lesson starts with. */
export const BEGINNER = ['C', 'G', 'D', 'A', 'E', 'Am', 'Em', 'Dm', 'E7', 'A7', 'D7', 'G7', 'Cadd9', 'Asus2', 'Dsus4']
  .filter((id) => BY_ID.has(id))

export const noteName = (midi: number) => NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1)

export const templateFor = (c: Chord, v: Voicing = c.voicings[0]): Template => ({
  name: c.id,
  root: c.root,
  pcs: [...new Set(v.midi.map((m) => m % 12))],
})

export const splitName = (id: string) => {
  const key = /^[A-G][#b]?/.exec(id)?.[0] ?? id
  return [key, id.slice(key.length)] as const
}

const QUALITY_NAMES: Record<string, string> = {
  '': 'major', m: 'minor', '7': 'dominant seventh', maj7: 'major seventh', m7: 'minor seventh', '9': 'dominant ninth',
  m7b5: 'half-diminished', sus2: 'suspended second', sus4: 'suspended fourth', '7sus4': 'seventh, suspended fourth',
  add9: 'added ninth', '6': 'major sixth', m6: 'minor sixth', dim: 'diminished', dim7: 'diminished seventh', aug: 'augmented',
}
export const longName = (id: string) => {
  const [k, s] = splitName(id)
  return `${k} ${QUALITY_NAMES[s] ?? s}`
}

export const voicingLabel = (v: Voicing) =>
  isOpen(v) ? 'Open' : v.barres.length ? `Barre · ${v.baseFret}fr` : v.baseFret > 1 ? `${v.baseFret}fr` : 'Closed'

export const PRESETS: { id: string; name: string; chords: string[] }[] = [
  { id: 'gcd', name: 'Three-chord campfire', chords: ['G', 'C', 'D', 'G'] },
  { id: 'fifties', name: '50s doo-wop', chords: ['G', 'Em', 'C', 'D'] },
  { id: 'axis', name: 'Pop axis', chords: ['C', 'G', 'Am', 'F'] },
  { id: 'minor-axis', name: 'Minor axis', chords: ['Am', 'F', 'C', 'G'] },
  { id: 'folk-d', name: 'Folk in D', chords: ['D', 'A', 'Bm', 'G'] },
  { id: 'em-drive', name: 'Em drive', chords: ['Em', 'C', 'G', 'D'] },
  { id: 'a-d-e', name: 'Rock in A', chords: ['A', 'D', 'E', 'A'] },
  { id: 'blues-a', name: '12-bar blues in A', chords: ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7'] },
]
