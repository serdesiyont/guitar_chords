// Self-check: `node src/lib/strums.test.ts`
import assert from 'node:assert/strict'
import { PATTERNS, countLabel, gradeStrums, strokeNotes, strumScore } from './strums.ts'

for (const p of PATTERNS) {
  assert.match(p.strokes, /^[DU-]+$/, p.id)
  assert.equal(p.strokes.length % p.perBeat, 0, p.id)
}
const folk = PATTERNS.find((p) => p.id === 'folk')!
assert.deepEqual([...folk.strokes].map((_, i) => countLabel(folk, i)), ['1', '&', '2', '&', '3', '&', '4', '&'])
assert.equal(countLabel(PATTERNS.find((p) => p.id === 'chikchika')!, 5), '6')
const G = [43, 47, 50, 55, 59, 67]
assert.deepEqual(strokeNotes(G, 'D'), G)
assert.deepEqual(strokeNotes(G, 'U'), [67, 59, 55])
assert.deepEqual(strokeNotes(G, '-'), [])
// D-U- at 0, .25, .5, .75 s: on-time down, late up (out of tolerance), extra on the last rest.
const marks = gradeStrums('D-U-', [0, 0.25, 0.5, 0.75], [0.03, 0.62, 0.74], 0.1)
assert.deepEqual(marks, ['hit', null, 'miss', 'extra'])
assert.equal(strumScore(marks), 33)
console.log('strums ok')
