import { midiToFreq } from './detect'

let ctx: AudioContext | null = null
let master: GainNode | null = null

export function audio() {
  if (!ctx) {
    ctx = new AudioContext({ latencyHint: 'interactive' })
    // A little low-mid body so the plucks sound like a box, not a wire.
    const body = ctx.createBiquadFilter()
    body.type = 'peaking'
    body.frequency.value = 220
    body.Q.value = 0.9
    body.gain.value = 5
    master = ctx.createGain()
    master.gain.value = 0.8
    master.connect(body).connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function setVolume(v: number) {
  audio()
  master!.gain.value = v
}

const cache = new Map<number, { buf: AudioBuffer; rate: number }>()

/** Karplus–Strong pluck. Integer delay line, fractional part fixed via playbackRate. */
function pluck(midi: number) {
  const hit = cache.get(midi)
  if (hit) return hit
  const c = audio()
  const sr = c.sampleRate
  const f = midiToFreq(midi)
  const n = Math.max(2, Math.round(sr / f - 0.5))
  const len = Math.floor(sr * 3)
  const buf = c.createBuffer(1, len, sr)
  const d = buf.getChannelData(0)
  // Softened noise burst = a thumb/pick rather than a hard click.
  let prev = 0
  for (let i = 0; i < n; i++) {
    const r = Math.random() * 2 - 1
    d[i] = (r + prev) * 0.5
    prev = r
  }
  // Low strings ring longer; high strings lose brightness faster.
  const decay = 0.9985 - (midi - 40) * 0.00004
  for (let i = n; i < len; i++) d[i] = decay * 0.5 * (d[i - n] + d[i - n - 1 < 0 ? 0 : i - n - 1])
  const entry = { buf, rate: f / (sr / (n + 0.5)) }
  cache.set(midi, entry)
  return entry
}

export type StrumStyle = 'strum' | 'arpeggio'

/** Play MIDI notes low→high. Returns the per-note start offsets (s) for syncing visuals. */
export function playNotes(midis: number[], style: StrumStyle = 'strum') {
  const c = audio()
  const gap = style === 'strum' ? 0.028 : 0.16
  const t0 = c.currentTime + 0.02
  return midis.map((m, i) => {
    const { buf, rate } = pluck(m)
    const src = c.createBufferSource()
    src.buffer = buf
    src.playbackRate.value = rate
    const g = c.createGain()
    const t = t0 + i * gap
    g.gain.setValueAtTime(0.32, t)
    g.gain.setTargetAtTime(0, t + 2.2, 0.25)
    src.connect(g).connect(master!)
    src.start(t)
    src.stop(t + 3)
    return i * gap
  })
}

function click(time: number, accent: boolean) {
  const c = audio()
  const o = c.createOscillator()
  const g = c.createGain()
  o.frequency.value = accent ? 1760 : 1180
  g.gain.setValueAtTime(0.0001, time)
  g.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.3, time + 0.002)
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)
  o.connect(g).connect(master!)
  o.start(time)
  o.stop(time + 0.06)
}

/** Audio-clock metronome with lookahead; onBeat fires (roughly) when each beat sounds. */
export function startMetronome(bpm: number, beatsPerBar: number, onBeat: (beat: number) => void, clickOn = true) {
  const c = audio()
  let next = c.currentTime + 0.15
  let beat = 0
  let stopped = false
  const timers = new Set<number>()
  const tick = () => {
    while (next < c.currentTime + 0.12) {
      if (clickOn) click(next, beat % beatsPerBar === 0)
      const b = beat
      const id = window.setTimeout(() => {
        timers.delete(id)
        if (!stopped) onBeat(b)
      }, Math.max(0, (next - c.currentTime) * 1000))
      timers.add(id)
      next += 60 / bpm
      beat++
    }
  }
  tick()
  const iv = window.setInterval(tick, 25)
  return () => {
    stopped = true
    clearInterval(iv)
    timers.forEach(clearTimeout)
  }
}
