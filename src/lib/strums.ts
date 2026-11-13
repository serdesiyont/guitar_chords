export type Pattern = {
  id: string
  name: string
  group: 'International' | 'Ethiopian'
  meter: string
  perBeat: 2 | 3 // slots per counted beat: 2 = eighths in 4/4, 3 = eighths in 6/8 (beat = dotted quarter)
  strokes: string // one char per slot: D down, U up, - rest
  bpm: number // suggested starting tempo, in counted beats
  note?: string
}

export const PATTERNS: Pattern[] = [
  { id: 'downs', name: 'All downs', group: 'International', meter: '4/4', perBeat: 2, strokes: 'D-D-D-D-', bpm: 80, note: 'Start here. One down strum per beat, keep the wrist loose.' },
  { id: 'eighths', name: 'Down-up eighths', group: 'International', meter: '4/4', perBeat: 2, strokes: 'DUDUDUDU', bpm: 70 },
  { id: 'folk', name: 'Folk / pop', group: 'International', meter: '4/4', perBeat: 2, strokes: 'D-DU-UDU', bpm: 80, note: 'The campfire pattern. Keep the hand moving on the rests, just miss the strings.' },
  { id: 'rock', name: 'Rock push', group: 'International', meter: '4/4', perBeat: 2, strokes: 'D-DUDUDU', bpm: 90 },
  { id: 'reggae', name: 'Reggae offbeat', group: 'International', meter: '4/4', perBeat: 2, strokes: '-U-U-U-U', bpm: 75, note: 'Only the "and"s. Short, choppy upstrokes.' },
  { id: 'waltz', name: 'Waltz', group: 'International', meter: '3/4', perBeat: 2, strokes: 'D-DUDU', bpm: 90 },
  { id: 'chikchika', name: 'Chik-chika', group: 'Ethiopian', meter: '6/8', perBeat: 3, strokes: 'D-UD-U', bpm: 70, note: 'The driving 6/8 of Amharic dance songs. Lean on 1 and 4.' },
  { id: 'tizita', name: 'Tizita ballad', group: 'Ethiopian', meter: '6/8', perBeat: 3, strokes: 'D-UDUU', bpm: 45, note: 'Slow and rolling, for tizita and other ballads.' },
  { id: 'guragigna', name: 'Guragigna', group: 'Ethiopian', meter: '2/4', perBeat: 2, strokes: 'D-DUD-DU', bpm: 110, note: 'Fast and stamping, from Gurage dance music.' },
  { id: 'tigrigna', name: 'Tigrigna', group: 'Ethiopian', meter: '6/8', perBeat: 3, strokes: 'D--D-U', bpm: 60, note: 'A heavy, swaying 6/8 for the shoulder dance.' },
]

/** Count label for slot i: "1 & 2 &" in simple meter, "1 2 3 4 5 6" in 6/8. */
export const countLabel = (p: Pattern, i: number) => (p.perBeat === 3 ? String(i + 1) : i % 2 ? '&' : String(i / 2 + 1))

/** Notes a stroke sounds, in the order the pick hits them. Up strokes catch only the top three strings. */
export const strokeNotes = (midi: number[], stroke: string) => (stroke === 'D' ? midi : stroke === 'U' ? midi.slice(-3).reverse() : [])

export type StrumMark = 'hit' | 'miss' | 'extra' | null

/** Per slot: a stroke with an onset within tol is a hit, without one a miss; an onset on a rest is extra. Timing only, the mic can't tell down from up. */
export const gradeStrums = (strokes: string, times: number[], onsets: number[], tol: number): StrumMark[] =>
  times.map((t, i) => {
    const heard = onsets.some((o) => Math.abs(o - t) <= tol)
    return strokes[i % strokes.length] === '-' ? (heard ? 'extra' : null) : heard ? 'hit' : 'miss'
  })

/** Hits over everything that should or shouldn't have sounded, 0..100. */
export const strumScore = (marks: StrumMark[]) => {
  const hits = marks.filter((m) => m === 'hit').length
  const all = marks.filter(Boolean).length
  return all ? Math.round((100 * hits) / all) : 0
}
