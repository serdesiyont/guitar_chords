import { Check, Mic, Play, RotateCcw, Square, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { audio, click, startMetronome } from '@/lib/audio'
import { NOTE_NAMES, freqToMidi } from '@/lib/detect'
import { useMic, useOnsets, usePitch } from '@/lib/mic'
import { SCALES, scaleMidi } from '@/lib/scales'
import { useStore } from '@/lib/store'
import { PATTERNS, gradeStrums, strumScore, type StrumMark } from '@/lib/strums'
import { cn } from '@/lib/utils'
import { MicGate } from './MicGate'
import { PatternRow } from './Strum'

type Mic = ReturnType<typeof useMic>
const card = 'rounded-xl border border-rule bg-card shadow-envelope'

/* ───────────── scale ───────────── */

const STEADY = 3 // pitch readings (~150 ms) a note must hold to count

export function ScaleDrill({ initial, initialRoot, mic }: { initial?: string; initialRoot?: string; mic: Mic }) {
  const { settings, bests, recordRun } = useStore()
  const [id, setId] = useState(SCALES.some((s) => s.id === initial) ? initial! : 'major')
  const [root, setRoot] = useState(Math.max(0, NOTE_NAMES.indexOf(initialRoot ?? 'C')))
  const [idx, setIdx] = useState(0)
  const [missed, setMissed] = useState<number[]>([])
  const scale = SCALES.find((s) => s.id === id)!
  const up = scaleMidi(root, scale).map((m) => m % 12)
  const seq = [...up, ...up.slice(0, -1).reverse()]
  const key = `scale:${id}:${root}`
  const done = idx >= seq.length

  const pitch = usePitch(mic.analyser, settings.sensitivity)
  const heard = pitch.hz == null ? null : ((Math.round(freqToMidi(pitch.hz)) % 12) + 12) % 12
  const steady = useRef({ pc: -1, n: 0 })

  // Act once per steady note: the right one advances, a wrong one marks this step (the last note still ringing is ignored).
  useEffect(() => {
    const r = steady.current
    if (heard == null) return void (r.n = 0)
    r.n = heard === r.pc ? r.n + 1 : 1
    r.pc = heard
    if (r.n !== STEADY || done) return
    if (heard === seq[idx]) setIdx(idx + 1)
    else if (heard !== seq[idx - 1] && !missed.includes(idx)) setMissed([...missed, idx])
  }, [pitch])

  useEffect(() => {
    if (done) recordRun(key, Math.round((100 * (seq.length - missed.length)) / seq.length))
  }, [done])

  const restart = () => {
    setIdx(0)
    setMissed([])
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={cn(card, 'flex flex-wrap items-center gap-3 p-4 sm:p-5')}>
        <Select value={id} onValueChange={(v) => (setId(v), restart())}>
          <SelectTrigger className="h-11 min-w-56 bg-card md:h-9" aria-label="Scale">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['Diatonic', 'Ethiopian qenet'] as const).map((g) => (
              <SelectGroup key={g}>
                <SelectLabel>{g}</SelectLabel>
                {SCALES.filter((s) => s.group === g).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(root)} onValueChange={(v) => (setRoot(+v), restart())}>
          <SelectTrigger className="h-11 w-24 bg-card md:h-9" aria-label="Root note">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTE_NAMES.map((n, i) => <SelectItem key={n} value={String(i)}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-sm text-ink-2">Up and back down, one note at a time, any octave.{bests[key] != null && <> Best <span className="font-semibold text-ink">{bests[key]}%</span></>}</p>
      </div>

      <MicGate status={mic.status} onStart={mic.start} title="Play the scale, note by note" body="Turn on the mic and pick each note cleanly. The next note lights up once the last one is heard.">
        <div className={card} aria-live="polite">
          <ol className="no-scrollbar flex gap-1.5 overflow-x-auto p-4" aria-label="Notes in this run">
            {seq.map((pc, i) => (
              <li key={i} className={cn('flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 font-display text-lg font-semibold transition-colors', i === idx ? 'border-ink bg-ink text-paper' : 'border-rule', i > idx && 'text-ink-2')}>
                {NOTE_NAMES[pc]}
                {i < idx && (missed.includes(i) ? <X className="size-4 text-miss" aria-label="wrong note first" /> : <Check className="size-4 text-hit" aria-label="clean" />)}
              </li>
            ))}
          </ol>
          <div className="perf mx-4" />
          <div className="grid min-h-72 place-items-center px-5 py-6 text-center">
            {done ? (
              <div>
                <p className="font-display text-display leading-none font-bold">{seq.length - missed.length}/{seq.length}</p>
                <p className="mt-2 text-lg font-medium">clean notes{bests[key] != null && ` · best ${bests[key]}%`}</p>
                <p className="mt-1 text-ink-2">{missed.length ? 'Notes with a wrong note first are marked above.' : 'Every note clean. Try it from another root.'}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-ink-2">{idx < up.length ? 'Going up' : 'Coming down'} · note {idx + 1} of {seq.length}</p>
                <p className="font-display text-display leading-none font-bold sm:text-display-lg">{NOTE_NAMES[seq[idx]]}</p>
                <p className="mt-3 text-sm text-ink-2">{heard == null ? 'Listening…' : <>Hearing <span className={cn('font-semibold', heard === seq[idx] ? 'text-hit' : 'text-ink')}>{NOTE_NAMES[heard]}</span></>}</p>
              </div>
            )}
          </div>
          <div className="border-t border-rule p-4">
            <Button size="lg" variant={done ? 'default' : 'outline'} className="h-12 text-base" onClick={restart}>
              <RotateCcw /> {done ? 'Run again' : 'Start over'}
            </Button>
          </div>
        </div>
      </MicGate>
    </div>
  )
}

/* ───────────── strum ───────────── */

const ROUNDS = 4
// ponytail: fixed mic input latency guess, added to the browser's output latency. Make it a setting if timing reads late on some devices.
const INPUT_LATENCY = 0.02

export function StrumDrill({ initial, mic }: { initial?: string; mic: Mic }) {
  const { settings, bests, recordRun } = useStore()
  const [id, setId] = useState(PATTERNS.some((p) => p.id === initial) ? initial! : 'folk')
  const p = PATTERNS.find((x) => x.id === id)!
  const [bpm, setBpm] = useState(p.bpm)
  const [keepClick, setKeepClick] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'count' | 'play' | 'done'>('idle')
  const [count, setCount] = useState(0)
  const [slot, setSlot] = useState(0)
  const [marks, setMarks] = useState<StrumMark[]>([])
  const onsets = useRef<number[]>([])
  const times = useRef<number[]>([])
  const stopRef = useRef<(() => void) | null>(null)
  const n = p.strokes.length
  const key = `strum:${id}`
  const running = phase === 'count' || phase === 'play'

  useOnsets(mic.analyser, settings.sensitivity, (t) => onsets.current.push(t))
  useEffect(() => () => stopRef.current?.(), [])

  const stop = () => {
    stopRef.current?.()
    stopRef.current = null
    setPhase('idle')
  }

  const start = () => {
    if (!mic.analyser) return void mic.start()
    const total = n * ROUNDS
    const lag = (audio().outputLatency || 0) + INPUT_LATENCY
    const tol = Math.min(0.1, (60 / bpm / p.perBeat) * 0.45)
    onsets.current = []
    times.current = []
    setMarks([])
    setPhase('count')
    setCount(n / p.perBeat)
    // One tick per slot; the first pass through the pattern is a clicked count-in.
    stopRef.current = startMetronome(
      bpm * p.perBeat,
      p.perBeat,
      (b) => {
        if (b < n) return void (b % p.perBeat === 0 && setCount((n - b) / p.perBeat))
        const k = b - n
        if (k < total) return (setPhase('play'), setSlot(k))
        stopRef.current?.()
        stopRef.current = null
        const m = gradeStrums(p.strokes, times.current, onsets.current, tol)
        setMarks(m)
        setPhase('done')
        recordRun(key, strumScore(m))
      },
      false,
      (b, t) => {
        const k = b - n
        if (b % p.perBeat === 0 && (k < 0 || (keepClick && k < total))) click(t, b % n === 0)
        if (k >= 0 && k < total) times.current[k] = t + lag
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={cn(card, 'flex flex-wrap items-center gap-x-6 gap-y-4 p-4 sm:p-5')}>
        <Select value={id} onValueChange={(v) => (stop(), setId(v), setBpm(PATTERNS.find((x) => x.id === v)!.bpm), setMarks([]))} disabled={running}>
          <SelectTrigger className="h-11 min-w-52 bg-card md:h-9" aria-label="Strumming pattern">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['International', 'Ethiopian'] as const).map((g) => (
              <SelectGroup key={g}>
                <SelectLabel>{g}</SelectLabel>
                {PATTERNS.filter((x) => x.group === g).map((x) => <SelectItem key={x.id} value={x.id}>{x.name} · {x.meter}</SelectItem>)}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <div className="flex min-w-48 flex-1 items-center gap-3">
          <Label htmlFor="drill-bpm" className="w-20 shrink-0 font-display text-lg font-bold">{bpm} bpm</Label>
          <Slider id="drill-bpm" min={30} max={160} step={2} value={[bpm]} onValueChange={([v]) => setBpm(v)} disabled={running} aria-label="Tempo" />
        </div>
        <Label className="gap-2 text-sm font-medium">
          <Switch checked={keepClick} onCheckedChange={setKeepClick} disabled={running} /> Keep the click (headphones)
        </Label>
      </div>

      <MicGate status={mic.status} onStart={mic.start} title="Strum in time, get graded" body="Turn on the mic, then press start. After a one-bar count-in, every strum is checked against the beat.">
        <div className={card} aria-live="polite">
          <div className="grid min-h-72 place-items-center gap-4 px-3 py-6 text-center">
            {phase === 'count' ? (
              <div>
                <p className="text-sm font-medium text-ink-2">Get ready, strum any chord or muted strings</p>
                <p key={count} className="stamp-in font-display text-display-lg leading-none font-bold">{count}</p>
              </div>
            ) : phase === 'done' ? (
              <div className="w-full">
                <p className="font-display text-display leading-none font-bold">{strumScore(marks)}%</p>
                <p className="mt-2 text-lg font-medium">in time{bests[key] != null && ` · best ${bests[key]}%`}</p>
                <div className="mt-5 space-y-2">
                  {Array.from({ length: ROUNDS }, (_, r) => <PatternRow key={r} p={p} marks={marks.slice(r * n, r * n + n)} />)}
                </div>
                <p className="mt-4 text-sm text-ink-2">✓ on time · ✕ missed · + strum on a rest</p>
              </div>
            ) : (
              <div className="w-full">
                <p className="text-sm font-medium text-ink-2">{running ? `Round ${Math.floor(slot / n) + 1} of ${ROUNDS}` : `${ROUNDS} rounds after a one-bar count-in`}</p>
                <PatternRow p={p} active={running ? slot % n : null} className="mt-4" />
              </div>
            )}
          </div>
          <p className="px-4 pb-3 text-xs text-ink-2">Grades timing only: the mic can’t tell a down strum from an up strum. The click is off during the run so the mic doesn’t mistake it for you.</p>
          <div className="border-t border-rule p-4">
            {running ? (
              <Button size="lg" className="h-12 text-base sm:px-8" onClick={stop}>
                <Square className="fill-current" /> Stop
              </Button>
            ) : (
              <Button size="lg" className="h-12 text-base sm:px-8" onClick={start}>
                {mic.analyser ? <Play className="fill-current" /> : <Mic />} {phase === 'done' ? 'Run again' : 'Start'}
              </Button>
            )}
          </div>
        </div>
      </MicGate>
    </div>
  )
}
