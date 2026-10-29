import { ArrowDown, ArrowUp, Check, MicOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { playNotes, setVolume } from '@/lib/audio'
import { STRINGS, TUNING } from '@/lib/chords'
import { freqToMidi } from '@/lib/detect'
import { useMic, usePitch } from '@/lib/mic'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { MicGate } from './MicGate'

const IN_TUNE = 5 // cents

export function Tuner() {
  const { settings } = useStore()
  const mic = useMic()
  const { hz } = usePitch(mic.analyser, settings.sensitivity)
  const [lock, setLock] = useState<number | null>(null)
  const [midi, setMidi] = useState<number | null>(null)
  const [live, setLive] = useState(false)
  const recent = useRef<number[]>([])

  // Median of the last 5 readings: steady needle, still quick to follow a turning peg.
  useEffect(() => {
    if (hz == null) return setLive(false)
    const r = recent.current
    r.push(freqToMidi(hz))
    if (r.length > 5) r.shift()
    setMidi([...r].sort((a, b) => a - b)[r.length >> 1])
    setLive(true)
  }, [hz])

  const s = midi == null ? null : (lock ?? TUNING.reduce((best, t, i) => (Math.abs(midi - t) < Math.abs(midi - TUNING[best]) ? i : best), 0))
  const cents = s == null || midi == null ? 0 : (midi - TUNING[s]) * 100
  const far = Math.abs(cents) > 100
  const ok = !far && Math.abs(cents) <= IN_TUNE

  const pick = (i: number) => {
    setLock(lock === i ? null : i)
    setVolume(settings.volume)
    playNotes([TUNING[i]])
  }

  return (
    <section aria-labelledby="tuner-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="tuner-title" className="font-display text-4xl font-bold sm:text-5xl">Tuner</h1>
          <p className="mt-1 text-ink-2">Pluck one string at a time. Standard tuning, E A D G B E.</p>
        </div>
        {mic.status === 'on' && (
          <Button variant="outline" onClick={mic.stop}>
            <MicOff /> Stop
          </Button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-6 gap-1.5 sm:gap-3" role="group" aria-label="Strings. Tap to hear a reference note and lock the tuner to it.">
        {STRINGS.map((st, i) => {
          const active = s === i && live
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              aria-pressed={lock === i}
              aria-label={`${st.name}${st.octave} string${lock === i ? ', locked' : ''}`}
              className={cn(
                'relative cursor-pointer overflow-hidden rounded-lg border bg-card pt-5 pb-2 text-center shadow-envelope transition-[transform,box-shadow,border-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:pt-6 sm:pb-3',
                lock === i ? 'border-ink' : 'border-rule',
                active && '-translate-y-1 shadow-lift',
              )}
            >
              <svg className="absolute inset-x-0 top-1.5 h-3 w-full" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden>
                <line x1="14" x2="100" y1="6" y2="6" stroke={`var(--string-${i})`} strokeWidth={[3.7, 2.95, 2.25, 1.7, 1.12, 0.85][i] * 0.9} vectorEffect="non-scaling-stroke" />
              </svg>
              <span className="absolute top-[7px] left-[8%] size-2.5 rounded-full" style={{ background: `var(--string-${i})` }} />
              <span className="block font-display text-2xl font-bold sm:text-4xl">
                {st.name}
                <span className="text-[0.55em] font-semibold">{st.octave}</span>
              </span>
              <span className="mt-0.5 block font-display text-xs font-semibold text-ink-2 sm:text-sm">{st.gauge}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-ink-2">{lock == null ? 'Auto: finds the nearest string. Tap a string to hear it and lock.' : 'Locked to one string. Tap it again for auto.'}</p>

      <div className="mt-5">
        <MicGate status={mic.status} onStart={mic.start} title="Tune up before you play" body="Chord detection is far more reliable on a guitar that’s in tune. Pluck a string and follow the needle.">
          <div className="rounded-xl border border-rule bg-card px-5 py-8 shadow-envelope sm:px-10 sm:py-12" aria-live="polite">
            <div className={cn('text-center transition-opacity duration-500', !live && 'opacity-40')}>
              <p className="font-display text-display leading-none font-bold sm:text-display-lg">
                {s == null ? '–' : STRINGS[s].name}
                {s != null && <span className="text-[0.45em] font-semibold">{STRINGS[s].octave}</span>}
              </p>
              <p className={cn('mt-3 flex min-h-7 items-center justify-center gap-1.5 text-lg font-semibold', ok ? 'text-hit' : 'text-ink')}>
                {s == null ? (
                  <span className="font-medium text-ink-2">Pluck a string</span>
                ) : far ? (
                  <span>{cents < 0 ? 'Way flat, tighten' : 'Way sharp, loosen'}</span>
                ) : ok ? (
                  <>
                    <Check className="size-5" /> In tune
                  </>
                ) : cents < 0 ? (
                  <>
                    <ArrowUp className="size-5" /> Tune up {Math.round(-cents)}¢
                  </>
                ) : (
                  <>
                    <ArrowDown className="size-5" /> Tune down {Math.round(cents)}¢
                  </>
                )}
              </p>
            </div>

            <Meter cents={cents} color={s == null ? 'var(--ink)' : `var(--string-${s})`} ok={ok} on={s != null} />
          </div>
        </MicGate>
      </div>
    </section>
  )
}

function Meter({ cents, color, ok, on }: { cents: number; color: string; ok: boolean; on: boolean }) {
  const pos = 50 + Math.max(-50, Math.min(50, cents))
  return (
    <div className="mx-auto mt-8 max-w-xl" aria-hidden>
      <div className="relative h-16">
        <div className={cn('absolute inset-y-0 left-1/2 w-[10%] -translate-x-1/2 rounded-md transition-colors', ok ? 'bg-hit/15' : 'bg-muted')} />
        {Array.from({ length: 11 }, (_, i) => (
          <div key={i} className={cn('absolute bottom-0 w-px bg-ink-2/50', i === 5 ? 'h-full bg-ink' : i % 5 === 0 ? 'h-1/2' : 'h-1/3')} style={{ left: `${i * 10}%` }} />
        ))}
        {on && (
          <div className="absolute inset-y-[-6px] w-1 -translate-x-1/2 rounded-full transition-[left] duration-150 ease-out" style={{ left: `${pos}%`, background: ok ? 'var(--hit)' : color }} />
        )}
      </div>
      <div className="mt-2 grid grid-cols-3 font-display text-sm font-semibold text-ink-2">
        <span>−50¢ flat</span>
        <span className="text-center">0</span>
        <span className="text-right">sharp +50¢</span>
      </div>
    </div>
  )
}
