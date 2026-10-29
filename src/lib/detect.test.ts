// Self-check: `node src/lib/detect.test.ts`
import assert from 'node:assert/strict'
import { chroma, detectPitch, judge, midiToFreq, rank } from './detect.ts'

const SR = 48000, FFT = 16384

// Fake magnitude spectrum: each note gets a few harmonics with leakage into neighbours.
function spectrum(midis: number[]) {
  const mags = new Float32Array(FFT / 2)
  for (const m of midis) {
    for (let h = 1; h <= 4; h++) {
      const bin = (midiToFreq(m) * h) / (SR / FFT)
      const i = Math.round(bin)
      const amp = 1 / h
      mags[i] += amp
      mags[i - 1] += amp * 0.4
      mags[i + 1] += amp * 0.4
    }
  }
  return mags
}

const top = (midis: number[]) => rank(chroma(spectrum(midis), SR, FFT))[0].name

assert.equal(top([48, 52, 55, 60, 64]), 'C') // open C: C3 E3 G3 C4 E4
assert.equal(top([45, 52, 57, 60, 64]), 'Am') // open Am
assert.equal(top([43, 47, 50, 55, 59, 67]), 'G') // open G
assert.equal(top([40, 47, 52, 55, 59, 64]), 'Em') // open Em
assert.equal(top([50, 57, 62, 66]), 'D') // open D
assert.equal(top([40, 47, 50, 56, 59, 64]), 'E7') // open E7

const cMajor = { name: 'C', root: 0, pcs: [0, 4, 7] }
assert.ok(judge(chroma(spectrum([48, 52, 55, 60, 64]), SR, FFT), cMajor, 0.5).hit)
assert.ok(!judge(chroma(spectrum([50, 57, 62, 66]), SR, FFT), cMajor, 0.5).hit) // D is not C

for (const f of [82.41, 110, 196, 329.63]) {
  const buf = new Float32Array(4096)
  for (let i = 0; i < buf.length; i++) buf[i] = 0.3 * Math.sin((2 * Math.PI * f * i) / SR) + 0.1 * Math.sin((4 * Math.PI * f * i) / SR)
  const got = detectPitch(buf, SR)!
  assert.ok(Math.abs(got - f) < 0.5, `pitch ${f} → ${got}`)
}
assert.equal(detectPitch(new Float32Array(4096), SR), null)

console.log('detect: ok')
