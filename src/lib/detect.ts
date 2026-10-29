// Pure DSP: chroma from a magnitude spectrum, chord template matching, pitch detection.
// No DOM / Web Audio here so it can be checked with `node src/lib/detect.test.ts`.

export const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

// Interval sets the listener tries to recognise. Kept small on purpose:
// every extra quality is another way for a clean triad to be misread.
export const LISTEN_QUALITIES: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dim: [0, 3, 6],
}

export type Template = { name: string; root: number; pcs: number[] }
export type Match = { name: string; score: number }

export const LISTEN_TEMPLATES: Template[] = NOTE_NAMES.flatMap((n, root) =>
  Object.entries(LISTEN_QUALITIES).map(([q, iv]) => ({
    name: n + q,
    root,
    pcs: iv.map((i) => (root + i) % 12),
  })),
)

export const freqToMidi = (f: number) => 69 + 12 * Math.log2(f / 440)
export const midiToFreq = (m: number) => 440 * 2 ** ((m - 69) / 12)

/**
 * 12-bin chroma from linear magnitudes. Only local spectral peaks count, with
 * parabolic interpolation, so window leakage doesn't smear low strings
 * (a semitone at 82 Hz is ~5 Hz, about two FFT bins).
 */
export function chroma(mags: ArrayLike<number>, sampleRate: number, fftSize: number): number[] {
  const out = new Array(12).fill(0)
  const binHz = sampleRate / fftSize
  const lo = Math.max(2, Math.ceil(75 / binHz))
  const hi = Math.min(mags.length - 2, Math.floor(1400 / binHz))
  let max = 0
  for (let i = lo; i < hi; i++) max = Math.max(max, mags[i])
  if (max <= 0) return out
  const floor = max * 0.04
  for (let i = lo; i < hi; i++) {
    const m = mags[i]
    if (m < floor || m <= mags[i - 1] || m < mags[i + 1]) continue
    const a = mags[i - 1], b = m, c = mags[i + 1]
    const d = a - 2 * b + c
    const p = d === 0 ? 0 : (0.5 * (a - c)) / d
    const midi = freqToMidi((i + p) * binHz)
    out[((Math.round(midi) % 12) + 12) % 12] += Math.sqrt(m)
  }
  const top = Math.max(...out)
  return top > 0 ? out.map((v) => v / top) : out
}

/** Cosine similarity of chroma against a template; root weighted slightly heavier. */
export function score(ch: number[], t: Template): number {
  let dot = 0, tt = 0, cc = 0
  for (let pc = 0; pc < 12; pc++) {
    const w = pc === t.root ? 1.25 : t.pcs.includes(pc) ? 1 : 0
    dot += ch[pc] * w
    tt += w * w
    cc += ch[pc] * ch[pc]
  }
  return cc && tt ? dot / Math.sqrt(cc * tt) : 0
}

export function rank(ch: number[], templates: Template[] = LISTEN_TEMPLATES): Match[] {
  return templates
    .map((t) => ({ name: t.name, score: score(ch, t) }))
    .sort((a, b) => b.score - a.score)
}

/**
 * Did the player sound the target? Forgiving by design: the target only has to
 * clear a threshold and be (nearly) the best explanation of what was heard.
 * strictness 0..1 is a user setting, rooms and guitars vary.
 */
export function judge(ch: number[], target: Template, strictness: number) {
  const s = score(ch, target)
  const rival = rank(ch).find((m) => m.name !== target.name)
  const need = 0.74 + 0.16 * strictness
  return { score: s, rival, hit: s >= need && s >= (rival?.score ?? 0) - 0.04 }
}

/**
 * Pitch via normalised square difference (McLeod). Returns Hz or null when the
 * signal is too quiet or not periodic enough.
 */
export function detectPitch(buf: Float32Array, sampleRate: number, minRms = 0.008): number | null {
  const n = buf.length
  let rms = 0
  for (let i = 0; i < n; i++) rms += buf[i] * buf[i]
  if (Math.sqrt(rms / n) < minRms) return null

  const minLag = Math.floor(sampleRate / 1100)
  const maxLag = Math.min(Math.ceil(sampleRate / 60), n >> 1)
  const nsdf = new Float32Array(maxLag + 2)
  for (let tau = minLag; tau <= maxLag + 1; tau++) {
    let acf = 0, m = 0
    for (let i = 0; i < n - tau; i++) {
      acf += buf[i] * buf[i + tau]
      m += buf[i] * buf[i] + buf[i + tau] * buf[i + tau]
    }
    nsdf[tau] = m ? (2 * acf) / m : 0
  }
  let best = -1, bestTau = -1
  for (let tau = minLag + 1; tau <= maxLag; tau++) {
    if (nsdf[tau] > nsdf[tau - 1] && nsdf[tau] >= nsdf[tau + 1] && nsdf[tau] > best) {
      best = nsdf[tau]
      bestTau = tau
    }
  }
  if (bestTau < 0 || best < 0.6) return null
  // First peak within 90% of the best avoids octave-down errors.
  for (let tau = minLag + 1; tau <= maxLag; tau++) {
    if (nsdf[tau] > nsdf[tau - 1] && nsdf[tau] >= nsdf[tau + 1] && nsdf[tau] >= best * 0.9) {
      bestTau = tau
      break
    }
  }
  const a = nsdf[bestTau - 1], b = nsdf[bestTau], c = nsdf[bestTau + 1]
  const d = a - 2 * b + c
  const p = d === 0 ? 0 : (0.5 * (a - c)) / d
  return sampleRate / (bestTau + p)
}
