// Self-check: `node src/lib/barres.test.ts`
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { barsOf } from './barres.ts'

const bars = (frets: string, fingers: string) => barsOf([...frets].map((c) => (c === 'x' ? -1 : +c)), [...fingers].map(Number))

// Open F: index finger across all six strings.
assert.deepEqual(bars('133211', '134211'), [{ fret: 1, finger: 1, strings: [0, 4, 5] }])
// C6 x13333: finger 3 bars D-G-B, finger 4 is its own dot on high E.
assert.deepEqual(bars('x13333', '013334'), [{ fret: 3, finger: 3, strings: [2, 3, 4] }])
// C9 332333: two separate two-string bars, neither crossing the G string fretted at 2.
assert.deepEqual(bars('332333', '221334'), [
  { fret: 3, finger: 2, strings: [0, 1] },
  { fret: 3, finger: 3, strings: [3, 4] },
])
// C6 1x3231: index on both E strings with the A muted is two dots, not a bar over the A.
assert.deepEqual(bars('1x3231', '103241'), [])
// A barre the data doesn't list: finger 4 flat across B and high E.
assert.deepEqual(bars('xx1122', '001144'), [{ fret: 1, finger: 1, strings: [2, 3] }, { fret: 2, finger: 4, strings: [4, 5] }])
// Plain open chord: no bars.
assert.deepEqual(bars('x32010', '032010'), [])
// Partial barre on the top strings with a muted string below it still bars.
assert.deepEqual(bars('xx1112', '001112'), [{ fret: 1, finger: 1, strings: [2, 3, 4] }])

// Whole library: no bar may sit over a string that is open, muted, or fretted below it.
const db = JSON.parse(readFileSync(new URL('../../node_modules/@tombatossals/chords-db/lib/guitar.json', import.meta.url), 'utf8'))
const bad: string[] = []
let total = 0
for (const list of Object.values(db.chords) as { key: string; suffix: string; positions: { frets: number[]; fingers: number[] }[] }[][])
  for (const c of list)
    for (const p of c.positions)
      for (const b of barsOf(p.frets, p.fingers)) {
        total++
        for (let s = Math.min(...b.strings); s <= Math.max(...b.strings); s++)
          if (p.frets[s] < b.fret) bad.push(`${c.key}${c.suffix} ${p.frets.join(',')} fingers ${p.fingers.join('')}`)
      }
assert.equal(bad.length, 0, `bars crossing strings they can't press:\n${bad.slice(0, 10).join('\n')}`)
console.log(`barres: ok (${total} bars across the library)`)
