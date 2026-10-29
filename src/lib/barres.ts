export type Bar = { fret: number; finger: number; strings: number[] }

/**
 * A bar is one finger laid flat across 2+ strings at the same fret. Derived from the finger
 * numbers rather than the data's barre list, which misses small barres (C9 at 7fr has finger 4
 * across B and high E) and lumps different fingers on one fret together (C6 x13333 is finger 3
 * across D-G-B plus finger 4 on high E). A bar can't lie across a string that is muted, open or
 * fretted lower (C6 1x3231: the index frets both E strings with the A muted), so it splits there.
 */
export function barsOf(frets: number[], fingers: number[]): Bar[] {
  const bars: Bar[] = []
  const pairs = new Set(frets.flatMap((f, s) => (f > 0 && fingers[s] > 0 ? [`${f}:${fingers[s]}`] : [])))
  for (const [fret, finger] of [...pairs].map((k) => k.split(':').map(Number))) {
    let run: number[] = []
    for (let s = 0; s <= frets.length; s++) {
      if (s < frets.length && frets[s] >= fret) {
        if (frets[s] === fret && fingers[s] === finger) run.push(s)
        continue
      }
      if (run.length > 1) bars.push({ fret, finger, strings: run })
      run = []
    }
  }
  return bars
}
