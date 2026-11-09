// Self-check: `node src/lib/scales.test.ts`
import assert from 'node:assert/strict'
import { SCALES, scaleFrets, scaleMidi } from './scales.ts'

const TUNING = [40, 45, 50, 55, 59, 64]
const by = (id: string) => SCALES.find((s) => s.id === id)!

// Every scale starts on the root, ascends, and has as many degree labels as notes.
for (const s of SCALES) {
  assert.equal(s.steps[0], 0, s.id)
  assert.ok(s.steps.every((x, i) => i === 0 || x > s.steps[i - 1]), s.id)
  assert.equal(s.degrees.split(' ').length, s.steps.length, s.id)
}
// E minor on the low E string: E F# G A B C D E → frets 0 2 3 5 7 8 10 12.
assert.deepEqual(scaleFrets(TUNING, 4, by('minor'))[0], [0, 2, 3, 5, 7, 8, 10, 12])
// C Tizita major on the A string: C D E G A → A(0) C(3) D(5) E(7) G(10) A(12).
assert.deepEqual(scaleFrets(TUNING, 0, by('tizita-major'))[1], [0, 3, 5, 7, 10, 12])
assert.deepEqual(scaleMidi(48, by('ambassel')), [48, 49, 53, 55, 56, 60])
console.log('scales ok')
