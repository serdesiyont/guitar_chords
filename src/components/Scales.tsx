import { Play } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { playNotes, setVolume } from '@/lib/audio'
import { STRINGS, TUNING } from '@/lib/chords'
import { NOTE_NAMES } from '@/lib/detect'
import { SCALES, scaleFrets, scaleMidi } from '@/lib/scales'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { chip, chipOff, chipOn } from './Library'

const FRETS = 12
const X0 = 30, DX = 46, Y0 = 18, DY = 26
const GAUGE_W = [3.7, 2.95, 2.25, 1.7, 1.12, 0.85]
const INLAYS = [3, 5, 7, 9]

export function Scales() {
  const { settings } = useStore()
  const [root, setRoot] = useState(0)
  const [id, setId] = useState('major')
  const scale = SCALES.find((s) => s.id === id)!
  const frets = scaleFrets(TUNING, root, scale, FRETS)
  const names = scale.steps.map((x) => NOTE_NAMES[(root + x) % 12])
  const title = `${NOTE_NAMES[root]} ${scale.name}`

  const play = () => {
    const up = scaleMidi(40 + ((root - 4 + 12) % 12), scale) // lowest root on the low E string
    setVolume(settings.volume)
    playNotes([...up, ...up.slice(0, -1).reverse()], 'arpeggio')
  }

  // Low E at the bottom, like tab. Left-handed mirrors the neck so the nut sits on the right.
  const wire = (f: number) => (settings.leftHanded ? X0 + (FRETS - f) * DX : X0 + f * DX)
  const x = (f: number) => (f === 0 ? wire(0) + (settings.leftHanded ? 14 : -14) : (wire(f - 1) + wire(f)) / 2)
  const y = (s: number) => Y0 + (5 - s) * DY
  const W = X0 * 2 + FRETS * DX
  const H = Y0 * 2 + 5 * DY + 18

  return (
    <section aria-labelledby="scales-title">
      <h1 id="scales-title" className="font-display text-4xl font-bold sm:text-5xl">Scales</h1>
      <p className="mt-1 text-ink-2">Every note of the scale across the first 12 frets. Filled dots are the root. Tap a note to hear it.</p>

      <div className="mt-5 space-y-3">
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4" role="group" aria-label="Root note">
          {NOTE_NAMES.map((n, i) => (
            <button key={n} className={cn(chip, 'min-w-11 font-display text-base font-semibold', root === i ? chipOn : chipOff)} aria-pressed={root === i} onClick={() => setRoot(i)}>
              {n}
            </button>
          ))}
        </div>
        {(['Diatonic', 'Ethiopian qenet'] as const).map((g) => (
          <div key={g} className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4" role="group" aria-label={`${g} scales`}>
            <span className="w-24 shrink-0 text-sm font-medium text-ink-2">{g}</span>
            {SCALES.filter((s) => s.group === g).map((s) => (
              <button key={s.id} className={cn(chip, id === s.id ? chipOn : chipOff)} aria-pressed={id === s.id} onClick={() => setId(s.id)}>
                {s.name}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-rule bg-card shadow-envelope">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-5">
          <div>
            <h2 className="font-display text-3xl font-bold">{title}</h2>
            <p className="mt-0.5 font-display text-base font-semibold tracking-[0.12em] text-ink-2">
              {names.join('  ')} <span className="sr-only">, degrees</span>
              <span className="ml-3 font-medium tracking-[0.08em]">{scale.degrees}</span>
            </p>
          </div>
          <Button size="lg" className="h-12 text-base" onClick={play}>
            <Play /> Play scale
          </Button>
        </div>
        {scale.note && <p className="px-4 pt-2 text-sm text-ink-2 sm:px-5">{scale.note}</p>}
        <div className="perf tear mt-3" />
        <div className="no-scrollbar overflow-x-auto px-2 py-3">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title} on the fretboard, notes ${names.join(', ')}`} className="block w-full min-w-[640px] select-none">
            {INLAYS.map((f) => <circle key={f} cx={x(f)} cy={Y0 + 2.5 * DY} r={5} className="fill-rule" />)}
            <circle cx={x(12)} cy={Y0 + 1.5 * DY} r={5} className="fill-rule" />
            <circle cx={x(12)} cy={Y0 + 3.5 * DY} r={5} className="fill-rule" />
            {Array.from({ length: FRETS + 1 }, (_, f) => (
              <line key={f} x1={wire(f)} x2={wire(f)} y1={Y0} y2={Y0 + 5 * DY} className={f === 0 ? 'stroke-ink' : 'stroke-rule'} strokeWidth={f === 0 ? 4 : 1.25} />
            ))}
            {STRINGS.map((_, s) => (
              <line key={s} x1={wire(0)} x2={wire(FRETS)} y1={y(s)} y2={y(s)} stroke={`var(--string-${s})`} strokeWidth={GAUGE_W[s]} />
            ))}
            {frets.map((fs, s) =>
              fs.map((f) => {
                const pc = (TUNING[s] + f) % 12
                const isRoot = pc === root
                const hear = () => {
                  setVolume(settings.volume)
                  playNotes([TUNING[s] + f])
                }
                return (
                  <g
                    key={`${s}-${f}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Play ${NOTE_NAMES[pc]}, ${STRINGS[s].name}${STRINGS[s].octave} string, ${f === 0 ? 'open' : `fret ${f}`}`}
                    className="group cursor-pointer outline-none"
                    onClick={hear}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), hear())}
                  >
                    <circle cx={x(f)} cy={y(s)} r={14} className="fill-transparent stroke-ink opacity-0 group-hover:opacity-30 group-focus-visible:opacity-100" strokeWidth={2} />
                    <circle cx={x(f)} cy={y(s)} r={10} className={isRoot ? 'fill-ink' : 'fill-card stroke-ink'} strokeWidth={1.6} />
                    <text x={x(f)} y={y(s) + 3.8} textAnchor="middle" className={cn('font-display text-[11px] font-bold', isRoot ? 'fill-paper' : 'fill-ink')}>
                      {NOTE_NAMES[pc]}
                    </text>
                  </g>
                )
              }),
            )}
            {[3, 5, 7, 9, 12].map((f) => (
              <text key={f} x={x(f)} y={H - 4} textAnchor="middle" className="fill-ink-2 font-display text-[12px] font-semibold">
                {f}
              </text>
            ))}
          </svg>
        </div>
      </div>
    </section>
  )
}
