import { Check, Mic, Play, Plus, SkipForward, Square, Trash2, Volume2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { startMetronome } from '@/lib/audio'
import { BEGINNER, BY_ID, CHORDS, KEYS, PRESETS, templateFor } from '@/lib/chords'
import { judge } from '@/lib/detect'
import { go, usePlay } from '@/lib/hooks'
import { useChordListener, useMic } from '@/lib/mic'
import { useStore, type Progression } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ChordDiagram } from './ChordDiagram'
import { ChordName } from './ChordName'
import { MicGate } from './MicGate'

type Mic = ReturnType<typeof useMic>
const HOLD = 7 // listener frames (~0.55 s) a chord must ring to count
const STRUM_RING = { offsets: [0, 0.03, 0.06, 0.09, 0.12, 0.15] }
const pickOther = (ids: string[], not?: string) => {
  const pool = ids.length > 1 ? ids.filter((i) => i !== not) : ids
  return pool[Math.floor(Math.random() * pool.length)]
}

export function Practice({ route }: { route: string[] }) {
  const mode = route[1] === 'progression' ? 'progression' : 'chord'
  const mic = useMic()
  return (
    <section aria-labelledby="practice-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="practice-title" className="font-display text-4xl font-bold sm:text-5xl">Practice</h1>
          <p className="mt-1 text-ink-2">{mode === 'chord' ? 'Play the chord shown. Hold it until it’s stamped.' : 'Change chords in time. Every change is graded by ear.'}</p>
        </div>
        <ToggleGroup type="single" variant="outline" value={mode} onValueChange={(v) => v && go('practice', v)} aria-label="Practice mode">
          <ToggleGroupItem value="chord" className="h-11 px-4 md:h-10">One chord</ToggleGroupItem>
          <ToggleGroupItem value="progression" className="h-11 px-4 md:h-10">Progression</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="mt-6">{mode === 'chord' ? <ChordDrill initial={route[2]} mic={mic} /> : <Progressions initial={route[2]} mic={mic} />}</div>
    </section>
  )
}

/* ───────────── one chord ───────────── */

function ChordDrill({ initial, mic }: { initial?: string; mic: Mic }) {
  const { settings, favorites, recordAttempt } = useStore()
  const [pool, setPool] = useState('beginner')
  const ids = useMemo(() => {
    if (pool === 'favorites' && favorites.length) return favorites
    if (pool === 'basic') return CHORDS.filter((c) => c.suffix === '' || c.suffix === 'm').map((c) => c.id)
    if (pool === 'all') return CHORDS.map((c) => c.id)
    return BEGINNER
  }, [pool, favorites])
  const [target, setTarget] = useState(() => (initial && BY_ID.has(initial) ? initial : pickOther(BEGINNER)))
  const chord = BY_ID.get(target)!
  const tpl = useMemo(() => templateFor(chord), [chord])
  const L = useChordListener(mic.analyser, settings.sensitivity)
  const [hold, setHold] = useState(0)
  const [done, setDone] = useState<{ ms: number; key: number } | null>(null)
  const [tally, setTally] = useState({ hits: 0, tries: 0 })
  const started = useRef(performance.now())
  const { ring, play } = usePlay()

  useEffect(() => {
    if (initial && BY_ID.has(initial)) setTarget(initial)
  }, [initial])

  const next = (hit: boolean) => {
    if (!hit) recordAttempt(target, false)
    setTally((t) => ({ hits: t.hits + Number(hit), tries: t.tries + 1 }))
    setTarget(pickOther(ids, target))
    setDone(null)
    setHold(0)
  }

  // Restart the clock when the target changes or listening begins.
  useEffect(() => {
    started.current = performance.now()
  }, [target, mic.analyser])

  const verdict = L.active ? judge(L.chroma, tpl, settings.strictness) : null
  useEffect(() => {
    if (done || !mic.analyser) return
    setHold((h) => (verdict?.hit ? h + 1 : Math.max(0, h - 2)))
  }, [L])

  useEffect(() => {
    if (hold < HOLD || done) return
    const ms = performance.now() - started.current
    recordAttempt(target, true, ms)
    setDone({ ms, key: Date.now() })
  }, [hold, done, target, recordAttempt])

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => next(true), 1700)
    return () => clearTimeout(t)
  }, [done])

  const top = L.matches[0]
  const hearing = !L.active ? null : verdict?.hit ? target : top && top.score > 0.75 ? top.name : null

  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
      <div className="relative overflow-hidden rounded-xl border border-rule bg-card shadow-envelope">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
          <Select value={pool} onValueChange={setPool}>
            <SelectTrigger className="h-9 w-auto min-w-44 bg-card" aria-label="Chords to practise">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">First chords</SelectItem>
              <SelectItem value="favorites" disabled={!favorites.length}>
                Saved chords{favorites.length ? ` (${favorites.length})` : ''}
              </SelectItem>
              <SelectItem value="basic">All major &amp; minor</SelectItem>
              <SelectItem value="all">Every chord</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-ink-2">
            This session <span className="font-semibold text-ink">{tally.hits}/{tally.tries}</span>
          </p>
        </div>
        <div className="perf mx-5 mt-4" />
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 pt-6 pb-4 sm:gap-6 sm:px-8">
          <div>
            <ChordName id={target} className="text-display sm:text-display-lg" />
          </div>
          <div className="w-32 sm:w-52">
            <ChordDiagram voicing={chord.voicings[0]} name={target} leftHanded={settings.leftHanded} ring={done ? { key: done.key, ...STRUM_RING } : ring} />
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5 sm:px-8 sm:pb-7">
          <Button variant="outline" onClick={() => play(chord.voicings[0])}>
            <Volume2 /> Hear it
          </Button>
          <Button variant="outline" onClick={() => next(false)}>
            <SkipForward /> Skip
          </Button>
        </div>
        {done && (
          <div className="pointer-events-none absolute top-16 right-5 sm:top-20 sm:right-8" role="status">
            <div className="stamp-in rounded-[4px] border-[3px] border-hit px-3 py-1 text-center text-hit">
              <p className="font-display text-3xl leading-none font-bold uppercase">Clean</p>
              <p className="font-display text-sm font-semibold">{(done.ms / 1000).toFixed(1)} s</p>
            </div>
          </div>
        )}
      </div>

      <MicGate status={mic.status} onStart={mic.start} title="Let it hear you" body="Turn on the mic and play the chord. Hold it while it rings and it’ll be marked clean.">
        <div className="flex flex-col justify-between rounded-xl border border-rule bg-card p-5 shadow-envelope sm:p-6" aria-live="polite">
          <div>
            <div className="flex min-h-20 items-center">
              {hearing ? (
                <ChordName id={hearing} className={cn('text-6xl', hearing === target ? 'text-hit' : 'text-ink')} />
              ) : (
                <p className="font-display text-2xl font-semibold text-ink-2">{L.active ? 'Not sure yet…' : 'Waiting for sound'}</p>
              )}
            </div>
            <p className="min-h-5 text-sm text-ink-2">
              {done ? 'Nice. Next chord coming up.' : hearing && hearing !== target ? `That sounds like ${hearing}. Check each string rings clearly.` : verdict?.hit ? 'That’s it, keep it ringing…' : ''}
            </p>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Hold</span>
              <span className="text-ink-2">{done ? 'Done' : `${Math.round((Math.min(hold, HOLD) / HOLD) * 100)}%`}</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Hold progress" aria-valuemin={0} aria-valuemax={HOLD} aria-valuenow={Math.min(hold, HOLD)}>
              <div className={cn('h-full rounded-full transition-[width] duration-100', done ? 'bg-hit' : 'bg-ink')} style={{ width: `${(Math.min(hold, HOLD) / HOLD) * 100}%` }} />
            </div>
          </div>
        </div>
      </MicGate>

      <div className="lg:col-span-2">
        <Stats />
      </div>
    </div>
  )
}

function Stats() {
  const { stats, streak, days } = useStore()
  const rows = Object.entries(stats).sort((a, b) => b[1].attempts - a[1].attempts).slice(0, 10)
  const total = Object.values(stats).reduce((n, s) => n + s.attempts, 0)
  return (
    <div className="rounded-xl border border-rule bg-card p-5 shadow-envelope sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-bold">Your progress</h2>
        <p className="text-sm text-ink-2">
          <span className="font-semibold text-ink">{streak ? `${streak}-day streak` : 'No streak yet'}</span> · {days.length} days practised · {total} attempts
        </p>
      </div>
      {rows.length ? (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-rule text-left text-ink-2">
              <th className="py-2 font-medium">Chord</th>
              <th className="py-2 text-right font-medium">Tries</th>
              <th className="py-2 text-right font-medium">Clean</th>
              <th className="py-2 text-right font-medium">Fastest</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([id, s]) => (
              <tr key={id} className="border-b border-rule/60 last:border-0">
                <td className="py-2">
                  <button className="cursor-pointer underline-offset-4 hover:underline" onClick={() => go('practice', 'chord', id)}>
                    <ChordName id={id} className="text-xl" />
                  </button>
                </td>
                <td className="py-2 text-right">{s.attempts}</td>
                <td className="py-2 text-right font-semibold">{Math.round((s.hits / s.attempts) * 100)}%</td>
                <td className="py-2 text-right">{s.bestMs ? `${(s.bestMs / 1000).toFixed(1)} s` : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-3 text-sm text-ink-2">Play your first chord and your accuracy and times will be kept here, on this device.</p>
      )}
    </div>
  )
}

/* ───────────── progressions ───────────── */

type Phase = 'idle' | 'count' | 'play' | 'done'

function Progressions({ initial, mic }: { initial?: string; mic: Mic }) {
  const store = useStore()
  const { settings, setSettings } = store
  const all: Progression[] = [...PRESETS, ...store.progressions]
  const prog = all.find((p) => p.id === initial) ?? all[0]
  const templates = useMemo(() => prog.chords.map((id) => templateFor(BY_ID.get(id)!)), [prog])
  const L = useChordListener(mic.analyser, settings.sensitivity)

  const [phase, setPhase] = useState<Phase>('idle')
  const [idx, setIdx] = useState(0)
  const [beat, setBeat] = useState(0)
  const [count, setCount] = useState(4)
  const [results, setResults] = useState<(boolean | null)[]>([])
  const frames = useRef<number[]>([])
  const idxRef = useRef(0)
  const stopRef = useRef<(() => void) | null>(null)
  const tempo = settings.runMode === 'tempo'

  const finish = (res: (boolean | null)[]) => {
    stopRef.current?.()
    stopRef.current = null
    setPhase('done')
    const graded = res.map(Boolean)
    const pct = Math.round((graded.filter(Boolean).length / graded.length) * 100)
    graded.forEach((hit, i) => store.recordAttempt(prog.chords[i], hit))
    store.recordRun(prog.id, pct)
  }

  const start = () => {
    if (!mic.analyser) return void mic.start()
    const n = prog.chords.length
    frames.current = new Array(n).fill(0)
    idxRef.current = 0
    setIdx(0)
    setBeat(0)
    setResults(new Array(n).fill(null))
    if (!tempo) return setPhase('play')
    setPhase('count')
    setCount(4)
    const bpc = settings.beatsPerChord
    const local: (boolean | null)[] = new Array(n).fill(null)
    stopRef.current = startMetronome(settings.bpm, 4, (b) => {
      if (b < 4) return setCount(4 - b)
      const k = b - 4
      const i = Math.floor(k / bpc)
      if (i !== idxRef.current || k === 0) {
        if (k > 0) local[idxRef.current] = frames.current[idxRef.current] >= 3
        setResults([...local])
        if (i >= n) return finish(local)
        idxRef.current = i
        setIdx(i)
      }
      setPhase('play')
      setBeat(k % bpc)
    }, settings.click)
  }

  const stop = () => {
    stopRef.current?.()
    stopRef.current = null
    setPhase('idle')
  }
  useEffect(() => stop, [])
  // Changing progression mid-run ends the run.
  useEffect(() => stop(), [prog.id])

  // Grade by ear.
  useEffect(() => {
    if (phase !== 'play' || !L.active) return
    const i = idxRef.current
    if (!judge(L.chroma, templates[i], settings.strictness).hit) return
    frames.current[i]++
    if (!tempo && frames.current[i] >= HOLD - 2) {
      const res = results.map((r, j) => (j === i ? true : r))
      setResults(res)
      if (i + 1 >= prog.chords.length) return finish(res)
      idxRef.current = i + 1
      setIdx(i + 1)
    }
  }, [L])

  const skip = () => {
    const i = idxRef.current
    const res = results.map((r, j) => (j === i ? false : r))
    setResults(res)
    if (i + 1 >= prog.chords.length) return finish(res)
    idxRef.current = i + 1
    setIdx(i + 1)
  }

  const running = phase === 'count' || phase === 'play'
  const cur = prog.chords[idx]
  const nextId = prog.chords[idx + 1]
  const clean = results.filter(Boolean).length

  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
      <aside className="order-2 flex flex-col gap-4 lg:order-1">
        <div className="rounded-xl border border-rule bg-card p-2 shadow-envelope">
          <h2 className="px-3 pt-2 pb-1 text-sm font-medium text-ink-2">Progressions</h2>
          <ul>
            {all.map((p) => (
              <li key={p.id} className="flex items-center">
                <button
                  className={cn('flex-1 cursor-pointer rounded-lg px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring', p.id === prog.id ? 'bg-ink text-paper' : 'hover:bg-muted')}
                  aria-pressed={p.id === prog.id}
                  onClick={() => go('practice', 'progression', p.id)}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{p.name}</span>
                    {store.bests[p.id] != null && <span className={cn('text-xs', p.id === prog.id ? 'text-paper/75' : 'text-ink-2')}>best {store.bests[p.id]}%</span>}
                  </span>
                  <span className={cn('mt-0.5 block truncate font-display text-base font-semibold', p.id === prog.id ? 'text-paper/80' : 'text-ink-2')}>{p.chords.join(' · ')}</span>
                </button>
                {!PRESETS.includes(p) && (
                  <Button variant="ghost" size="icon-lg" aria-label={`Delete ${p.name}`} onClick={() => { store.deleteProgression(p.id); toast(`Deleted “${p.name}”`) }}>
                    <Trash2 />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
        <Builder />
      </aside>

      <div className="order-1 flex flex-col gap-4 lg:order-2">
        <div className="rounded-xl border border-rule bg-card p-5 shadow-envelope sm:p-6">
          <p className="mb-4 font-display text-2xl font-bold">{prog.name}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <ToggleGroup type="single" variant="outline" value={settings.runMode} onValueChange={(v) => v && setSettings({ runMode: v as 'tempo' | 'wait' })} disabled={running} aria-label="Run mode">
              <ToggleGroupItem value="tempo" className="h-11 px-3 md:h-9">On the beat</ToggleGroupItem>
              <ToggleGroupItem value="wait" className="h-11 px-3 md:h-9">Wait for me</ToggleGroupItem>
            </ToggleGroup>
            {tempo && (
              <>
                <div className="flex min-w-48 flex-1 items-center gap-3">
                  <Label htmlFor="bpm" className="w-20 shrink-0 font-display text-lg font-bold">{settings.bpm} bpm</Label>
                  <Slider id="bpm" min={40} max={160} step={2} value={[settings.bpm]} onValueChange={([v]) => setSettings({ bpm: v })} disabled={running} aria-label="Tempo" />
                </div>
                <ToggleGroup type="single" variant="outline" value={String(settings.beatsPerChord)} onValueChange={(v) => v && setSettings({ beatsPerChord: +v })} disabled={running} aria-label="Beats per chord">
                  {[2, 4, 8].map((b) => (
                    <ToggleGroupItem key={b} value={String(b)} className="h-11 px-3 md:h-9">{b} beats</ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <Label className="gap-2 text-sm font-medium">
                  <Switch checked={settings.click} onCheckedChange={(c) => setSettings({ click: c })} disabled={running} /> Click
                </Label>
              </>
            )}
          </div>
        </div>

        <MicGate status={mic.status} onStart={mic.start} title="Play along, get graded" body="Turn on the mic, then press start. Each chord change is checked by ear.">
          <div className="rounded-xl border border-rule bg-card shadow-envelope" aria-live="polite">
            <ol className="no-scrollbar flex gap-1.5 overflow-x-auto p-4" aria-label="Chords in this progression">
              {prog.chords.map((c, i) => (
                <li key={i} className={cn('flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 transition-colors', running && i === idx ? 'border-ink bg-ink text-paper' : 'border-rule')}>
                  <ChordName id={c} className="text-lg" />
                  {results[i] === true && <Check className="size-4 text-hit" aria-label="clean" />}
                  {results[i] === false && <X className="size-4 text-miss" aria-label="missed" />}
                </li>
              ))}
            </ol>
            <div className="perf mx-4" />

            <div className="grid min-h-80 items-center gap-6 px-5 py-6 sm:grid-cols-[1fr_auto] sm:px-8">
              {phase === 'count' ? (
                <div className="text-center sm:col-span-2">
                  <p className="text-sm font-medium text-ink-2">Get ready, first chord is {prog.chords[0]}</p>
                  <p key={count} className="stamp-in font-display text-display-lg leading-none font-bold">{count}</p>
                </div>
              ) : phase === 'done' ? (
                <div className="text-center sm:col-span-2">
                  <p className="font-display text-display leading-none font-bold">{clean}/{prog.chords.length}</p>
                  <p className="mt-2 text-lg font-medium">clean changes{store.bests[prog.id] != null && ` · best ${store.bests[prog.id]}%`}</p>
                  <p className="mt-1 text-ink-2">{clean === prog.chords.length ? 'Every change landed. Try it a few bpm faster.' : 'Missed changes are marked above. Slow down and go again.'}</p>
                </div>
              ) : (
                <>
                  <div>
                    <ChordName id={cur} className="text-display sm:text-display-lg" />
                    {running && tempo && (
                      <div className="mt-3 flex gap-2" aria-label={`Beat ${beat + 1} of ${settings.beatsPerChord}`}>
                        {Array.from({ length: settings.beatsPerChord }, (_, b) => (
                          <span key={b} className={cn('size-3.5 rounded-full border-2 border-ink transition-colors duration-75', b <= beat ? 'bg-ink' : 'bg-transparent')} />
                        ))}
                      </div>
                    )}
                    {running && (
                      <p className="mt-4 text-sm text-ink-2">
                        {L.active && L.matches[0]?.score > 0.75 ? <>Hearing <span className="font-semibold text-ink">{L.matches[0].name}</span></> : 'Listening…'}
                        {nextId && <> · next <span className="font-semibold text-ink">{nextId}</span></>}
                      </p>
                    )}
                  </div>
                  <div className="mx-auto w-40 sm:w-48">
                    <ChordDiagram voicing={BY_ID.get(cur)!.voicings[0]} name={cur} leftHanded={settings.leftHanded} />
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-rule p-4">
              {running ? (
                <>
                  <Button size="lg" className="h-12 flex-1 text-base sm:flex-none sm:px-8" onClick={stop}>
                    <Square className="fill-current" /> Stop
                  </Button>
                  {!tempo && (
                    <Button size="lg" variant="outline" className="h-12 text-base" onClick={skip}>
                      <SkipForward /> Skip chord
                    </Button>
                  )}
                </>
              ) : (
                <Button size="lg" className="h-12 flex-1 text-base sm:flex-none sm:px-8" onClick={start}>
                  {mic.analyser ? <Play className="fill-current" /> : <Mic />} {phase === 'done' ? 'Run again' : 'Start'}
                </Button>
              )}
            </div>
          </div>
        </MicGate>
      </div>
    </div>
  )
}

const SUFFIXES = [...new Set(CHORDS.map((c) => c.suffix))]

function Builder() {
  const { saveProgression } = useStore()
  const [root, setRoot] = useState('C')
  const [suffix, setSuffix] = useState('')
  const [chords, setChords] = useState<string[]>([])
  const [name, setName] = useState('')
  const id = root + suffix
  const exists = BY_ID.has(id)

  const save = () => {
    const p = { id: `custom-${Date.now()}`, name: name.trim() || chords.join(' '), chords }
    saveProgression(p)
    setChords([])
    setName('')
    toast(`Saved “${p.name}”`)
    go('practice', 'progression', p.id)
  }

  return (
    <div className="rounded-xl border border-rule bg-card p-5 shadow-envelope">
      <h2 className="font-display text-xl font-bold">Build your own</h2>
      <div className="mt-3 flex gap-2">
        <Select value={root} onValueChange={setRoot}>
          <SelectTrigger className="w-20 bg-card" aria-label="Root"><SelectValue /></SelectTrigger>
          <SelectContent>{KEYS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={suffix || 'maj'} onValueChange={(v) => setSuffix(v === 'maj' ? '' : v)}>
          <SelectTrigger className="flex-1 bg-card" aria-label="Chord type"><SelectValue /></SelectTrigger>
          <SelectContent>{SUFFIXES.map((s) => <SelectItem key={s || 'maj'} value={s || 'maj'}>{s || 'major'}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="icon-lg" aria-label={`Add ${id}`} disabled={!exists || chords.length >= 16} onClick={() => setChords([...chords, id])}>
          <Plus />
        </Button>
      </div>
      <div className="mt-3 flex min-h-10 flex-wrap gap-1.5">
        {chords.length ? (
          chords.map((c, i) => (
            <button key={i} className="flex cursor-pointer items-center gap-1 rounded-md border border-rule px-2 py-0.5 hover:border-miss" aria-label={`Remove ${c}`} onClick={() => setChords(chords.filter((_, j) => j !== i))}>
              <ChordName id={c} className="text-lg" /> <X className="size-3.5 text-ink-2" />
            </button>
          ))
        ) : (
          <p className="text-sm text-ink-2">Add at least two chords.</p>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" aria-label="Progression name" maxLength={40} className="bg-card" />
        <Button disabled={chords.length < 2} onClick={save}>Save</Button>
      </div>
    </div>
  )
}
