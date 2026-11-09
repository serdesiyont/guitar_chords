export type Scale = { id: string; name: string; group: 'Diatonic' | 'Ethiopian qenet'; steps: number[]; degrees: string; note?: string }

// Semitones above the root. Qenet spellings follow the common modern (Kebede / Abate) set.
export const SCALES: Scale[] = [
  { id: 'major', name: 'Major (Ionian)', group: 'Diatonic', steps: [0, 2, 4, 5, 7, 9, 11], degrees: '1 2 3 4 5 6 7' },
  { id: 'minor', name: 'Natural minor (Aeolian)', group: 'Diatonic', steps: [0, 2, 3, 5, 7, 8, 10], degrees: '1 2 ♭3 4 5 ♭6 ♭7' },
  { id: 'dorian', name: 'Dorian', group: 'Diatonic', steps: [0, 2, 3, 5, 7, 9, 10], degrees: '1 2 ♭3 4 5 6 ♭7' },
  { id: 'phrygian', name: 'Phrygian', group: 'Diatonic', steps: [0, 1, 3, 5, 7, 8, 10], degrees: '1 ♭2 ♭3 4 5 ♭6 ♭7' },
  { id: 'lydian', name: 'Lydian', group: 'Diatonic', steps: [0, 2, 4, 6, 7, 9, 11], degrees: '1 2 3 ♯4 5 6 7' },
  { id: 'mixolydian', name: 'Mixolydian', group: 'Diatonic', steps: [0, 2, 4, 5, 7, 9, 10], degrees: '1 2 3 4 5 6 ♭7' },
  { id: 'locrian', name: 'Locrian', group: 'Diatonic', steps: [0, 1, 3, 5, 6, 8, 10], degrees: '1 ♭2 ♭3 4 ♭5 ♭6 ♭7' },
  { id: 'tizita-major', name: 'Tizita major', group: 'Ethiopian qenet', steps: [0, 2, 4, 7, 9], degrees: '1 2 3 5 6', note: 'Same notes as the major pentatonic. The sound of longing and memory.' },
  { id: 'tizita-minor', name: 'Tizita minor', group: 'Ethiopian qenet', steps: [0, 2, 3, 7, 8], degrees: '1 2 ♭3 5 ♭6' },
  { id: 'bati-major', name: 'Bati major', group: 'Ethiopian qenet', steps: [0, 4, 5, 7, 11], degrees: '1 3 4 5 7' },
  { id: 'bati-minor', name: 'Bati minor', group: 'Ethiopian qenet', steps: [0, 3, 5, 7, 10], degrees: '1 ♭3 4 5 ♭7', note: 'Same notes as the minor pentatonic.' },
  { id: 'ambassel', name: 'Ambassel', group: 'Ethiopian qenet', steps: [0, 1, 5, 7, 8], degrees: '1 ♭2 4 5 ♭6' },
  { id: 'anchihoye', name: 'Anchihoye', group: 'Ethiopian qenet', steps: [0, 1, 5, 6, 9], degrees: '1 ♭2 4 ♭5 6' },
]

/** MIDI notes for one octave up plus the top root, for playback. */
export const scaleMidi = (rootMidi: number, s: Scale) => [...s.steps.map((x) => rootMidi + x), rootMidi + 12]

/** Per string (low→high), the frets 0..maxFret whose note is in the scale. */
export const scaleFrets = (tuning: number[], root: number, s: Scale, maxFret = 12) =>
  tuning.map((open) => Array.from({ length: maxFret + 1 }, (_, f) => f).filter((f) => s.steps.includes((((open + f - root) % 12) + 12) % 12)))
