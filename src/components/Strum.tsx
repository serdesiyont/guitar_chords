import { Check, Play, Plus, Square, Target, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { click, playNotes, setVolume, startMetronome } from '@/lib/audio'
import { BEGINNER, BY_ID } from '@/lib/chords'
import { go } from '@/lib/hooks'
import { PATTERNS, countLabel, strokeNotes, type Pattern, type StrumMark } from '@/lib/strums'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ChordName } from './ChordName'
import { chip, chipOff, chipOn } from './Library'

const GROUP_NOTE = {
  International: 'Common patterns from folk, pop, rock and reggae.',
  Ethiopian: 'Guitar adaptations of kebero drum grooves. Learn them by ear from recordings too: the accents and swing matter more than the exact strokes.',
}

export function Strum() {
  const { settings } = useStore()
  const [id, setId] = useState('folk')
  const [chord, setChord] = useState('G')
  const [bpm, setBpm] = useState(80)
  const [slot, setSlot] = useState<number | null>(null)
  const [clickOn, setClickOn] = useState(true)
  const stopRef = useRef<(() => void) | null>(null)
  const p = PATTERNS.find((x) => x.id === id)!
  const running = slot !== null

  const stop = () => {
    stopRef.current?.()
    stopRef.current = null
    setSlot(null)
  }
  useEffect(() => () => stopRef.current?.(), [])

  const start = () => {
    setVolume(settings.volume)
    const midi = BY_ID.get(chord)!.voicings[0].midi
    const n = p.strokes.length
    setSlot(0)
    // One metronome tick per slot; the click sounds on each counted beat, accented at the top of the pattern.
    stopRef.current = startMetronome(bpm * p.perBeat, p.perBeat, (b) => setSlot(b % n), false, (b, t) => {
      if (clickOn && b % p.perBeat === 0) click(t, b % n === 0)
      const notes = strokeNotes(midi, p.strokes[b % n])
      if (notes.length) playNotes(notes, 'strum', t)
    })
  }

  const pick = (fn: () => void) => {
    stop()
    fn()
  }

  return (
    <section aria-labelledby="strum-title">
      <h1 id="strum-title" className="font-display text-4xl font-bold sm:text-5xl">Strumming</h1>
      <p className="mt-1 text-ink-2">Pick a pattern and a chord, press play, and strum along. ↓ is a down strum, ↑ is up, a gap means keep the hand moving but miss the strings.</p>

      <div className="mt-5 space-y-3">
        {(['International', 'Ethiopian'] as const).map((g) => (
          <div key={g} className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4" role="group" aria-label={`${g} patterns`}>
            <span className="w-24 shrink-0 text-sm font-medium text-ink-2">{g}</span>
            {PATTERNS.filter((x) => x.group === g).map((x) => (
              <button key={x.id} className={cn(chip, id === x.id ? chipOn : chipOff)} aria-pressed={id === x.id} onClick={() => pick(() => (setId(x.id), setBpm(x.bpm)))}>
                {x.name}
              </button>
            ))}
          </div>
        ))}
        <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4" role="group" aria-label="Chord">
          <span className="w-24 shrink-0 text-sm font-medium text-ink-2">Chord</span>
          {BEGINNER.map((c) => (
            <button key={c} className={cn(chip, 'min-w-11', chord === c ? chipOn : chipOff)} aria-pressed={chord === c} onClick={() => pick(() => setChord(c))}>
              <ChordName id={c} className="text-base" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-rule bg-card shadow-envelope">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-5">
          <div>
            <h2 className="font-display text-3xl font-bold">{p.name}</h2>
            <p className="mt-0.5 text-sm font-medium text-ink-2">{p.meter} · {p.group}</p>
          </div>
          <div className="flex gap-2">
            <Button size="lg" variant="outline" className="h-12 text-base" onClick={() => go('practice', 'strum', p.id)}>
              <Target /> Practice
            </Button>
            <Button size="lg" className="h-12 text-base" onClick={running ? stop : start}>
              {running ? <><Square /> Stop</> : <><Play /> Play</>}
            </Button>
          </div>
        </div>
        <p className="px-4 pt-2 text-sm text-ink-2 sm:px-5">{p.note ?? GROUP_NOTE[p.group]}</p>
        {p.note && <p className="px-4 pt-1 text-sm text-ink-2 sm:px-5">{GROUP_NOTE[p.group]}</p>}
        <div className="perf tear mt-3" />

        <PatternRow p={p} active={slot} className="py-6" />

        <div className="flex items-center gap-3 border-t border-rule px-4 py-4 sm:px-5">
          <Label htmlFor="strum-bpm" className="w-20 shrink-0 font-display text-lg font-bold">{bpm} bpm</Label>
          <Slider id="strum-bpm" min={30} max={160} step={2} value={[bpm]} onValueChange={([v]) => setBpm(v)} disabled={running} aria-label="Tempo" />
          <Label className="shrink-0 gap-2 text-sm font-medium">
            <Switch checked={clickOn} onCheckedChange={setClickOn} disabled={running} /> Click
          </Label>
        </div>
      </div>

      <Metronome />
    </section>
  )
}

// beats per bar × ticks per beat; 6/8 counts two dotted-quarter beats with soft eighth ticks between.
const METERS = [
  { id: '2/4', beats: 2, sub: 1 },
  { id: '3/4', beats: 3, sub: 1 },
  { id: '4/4', beats: 4, sub: 1 },
  { id: '6/8', beats: 2, sub: 3 },
]

function Metronome() {
  const { settings } = useStore()
  const [bpm, setBpm] = useState(80)
  const [meterId, setMeterId] = useState('4/4')
  const [on, setOn] = useState(false)
  const [tick, setTick] = useState<number | null>(null)
  const m = METERS.find((x) => x.id === meterId)!
  const ticks = m.beats * m.sub

  // Restarts on any change, so tempo and meter can be moved while it plays.
  useEffect(() => {
    if (!on) return
    setVolume(settings.volume)
    return startMetronome(bpm * m.sub, ticks, (b) => setTick(b % ticks), false, (b, t) => click(t, b % ticks === 0, b % m.sub !== 0))
  }, [on, bpm, m, ticks, settings.volume])

  return (
    <div className="mt-6 rounded-xl border border-rule bg-card p-4 shadow-envelope sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl font-bold">Metronome</h2>
        <Button size="lg" className="h-12 text-base" onClick={() => setOn(!on)}>
          {on ? <><Square /> Stop</> : <><Play /> Start</>}
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex gap-1.5" role="group" aria-label="Time signature">
          {METERS.map((x) => (
            <button key={x.id} className={cn(chip, 'min-w-14 font-display text-base font-semibold', meterId === x.id ? chipOn : chipOff)} aria-pressed={meterId === x.id} onClick={() => setMeterId(x.id)}>
              {x.id}
            </button>
          ))}
        </div>
        <div className="flex min-w-48 flex-1 items-center gap-3">
          <Label htmlFor="metro-bpm" className="w-20 shrink-0 font-display text-lg font-bold">{bpm} bpm</Label>
          <Slider id="metro-bpm" min={30} max={220} step={1} value={[bpm]} onValueChange={([v]) => setBpm(v)} aria-label="Metronome tempo" />
        </div>
      </div>
      <div className="mt-5 flex justify-center gap-2" aria-hidden>
        {Array.from({ length: ticks }, (_, i) => (
          <span
            key={i}
            className={cn(
              'rounded-full border-2 border-ink transition-colors duration-75',
              i % m.sub === 0 ? 'size-5' : 'size-3 self-center',
              i > 0 && i % m.sub === 0 && m.sub > 1 && 'ml-3',
              on && tick === i ? 'bg-ink' : 'bg-transparent',
            )}
          />
        ))}
      </div>
    </div>
  )
}

const MARK = { hit: Check, miss: X, extra: Plus }
const MARK_LABEL = { hit: 'on time', miss: 'missed', extra: 'extra strum' }

/** One bar of arrows with counts. `marks` adds a graded icon under each slot. */
export function PatternRow({ p, active, marks, className }: { p: Pattern; active?: number | null; marks?: StrumMark[]; className?: string }) {
  const say = (s: string) => (s === 'D' ? 'down' : s === 'U' ? 'up' : 'rest')
  return (
    <ol className={cn('flex flex-wrap justify-center gap-1 px-2 sm:gap-1.5', className)} aria-label={`Pattern: ${[...p.strokes].map((s, i) => say(s) + (marks?.[i] ? ` ${MARK_LABEL[marks[i]]}` : '')).join(', ')}`}>
      {[...p.strokes].map((s, i) => {
        const m = marks?.[i]
        const Icon = m && MARK[m]
        return (
          <li
            key={i}
            aria-hidden
            className={cn(
              'flex w-9 flex-col items-center rounded-lg border-2 py-2 transition-colors sm:w-14',
              active === i ? 'border-ink bg-ink text-paper' : 'border-transparent',
              i % p.perBeat === 0 && i > 0 && 'ml-2',
            )}
          >
            <span className={cn('font-display text-3xl leading-none font-bold sm:text-4xl', s === '-' && 'opacity-25')}>{s === 'D' ? '↓' : s === 'U' ? '↑' : '·'}</span>
            <span className={cn('mt-1 font-display text-base font-semibold', i % p.perBeat ? 'opacity-60' : '')}>{countLabel(p, i)}</span>
            {marks && <span className="mt-1 grid h-5 place-items-center">{Icon && <Icon className={cn('size-5', m === 'hit' ? 'text-hit' : 'text-miss')} strokeWidth={2.6} />}</span>}
          </li>
        )
      })}
    </ol>
  )
}
