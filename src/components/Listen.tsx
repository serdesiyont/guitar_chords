import { MicOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { BY_ID } from '@/lib/chords'
import { LISTEN_TEMPLATES, NOTE_NAMES } from '@/lib/detect'
import { go } from '@/lib/hooks'
import { useChordListener, useMic } from '@/lib/mic'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ChordDiagram } from './ChordDiagram'
import { ChordName } from './ChordName'
import { LevelMeter, MicGate } from './MicGate'

const confidence = (s: number) => (s > 0.93 ? 'Clear' : s > 0.85 ? 'Likely' : 'Unsure')

export function Listen() {
  const { settings, setSettings } = useStore()
  const mic = useMic()
  const L = useChordListener(mic.analyser, settings.sensitivity)
  const [heard, setHeard] = useState<{ name: string; score: number } | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const streak = useRef({ name: '', n: 0 })

  // Only announce a chord once it has been the top match for 3 frames in a row (~250 ms).
  useEffect(() => {
    const top = L.matches[0]
    if (!L.active || !top || top.score < 0.8) {
      streak.current = { name: '', n: 0 }
      return
    }
    const s = streak.current
    s.n = s.name === top.name ? s.n + 1 : 1
    s.name = top.name
    if (s.n === 3) {
      setHeard(top)
      setHistory((h) => (h[0] === top.name ? h : [top.name, ...h].slice(0, 12)))
    } else if (s.n > 3 && heard?.name === top.name) setHeard(top)
  }, [L, heard?.name])

  const chord = heard ? BY_ID.get(heard.name) : undefined
  const alts = L.active && heard ? L.matches.filter((m) => m.name !== heard.name && m.score > 0.8).slice(0, 3) : []
  const tones = new Set(LISTEN_TEMPLATES.find((t) => t.name === heard?.name)?.pcs)

  return (
    <section aria-labelledby="listen-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="listen-title" className="font-display text-4xl font-bold sm:text-5xl">Listen</h1>
          <p className="mt-1 text-ink-2">Strum a chord and let it ring. Works best one chord at a time.</p>
        </div>
        {mic.status === 'on' && (
          <Button variant="outline" onClick={mic.stop}>
            <MicOff /> Stop
          </Button>
        )}
      </div>

      <div className="mt-6">
        <MicGate status={mic.status} onStart={mic.start} title="Play a chord, see its name" body="Your mic picks up the notes ringing and matches them against major, minor, seventh, sus and diminished chords.">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-xl border border-rule bg-card p-5 shadow-envelope sm:p-7" aria-live="polite">
              <p className={cn('min-h-5 text-right text-sm font-semibold', !L.active && 'text-ink-2')}>
                {heard && `${confidence(heard.score)} · ${Math.round(heard.score * 100)}%`}
              </p>
              <div className={cn('mt-1 flex items-center transition-opacity duration-500', heard ? 'min-h-36 sm:min-h-44' : 'py-2', !L.active && heard && 'opacity-45')}>
                {heard ? (
                  <ChordName id={heard.name} className="text-display sm:text-display-lg" />
                ) : (
                  <p className="font-display text-4xl font-semibold text-ink-2">{L.active ? 'Listening…' : 'Strum a chord'}</p>
                )}
              </div>
              {heard && <p className="min-h-6 text-sm text-ink-2">{alts.length ? `Could also be ${alts.map((a) => a.name).join(', ')}` : ''}</p>}

              <div className="mt-6">
                <div className="flex h-24 items-end gap-1 border-b-2 border-ink pb-px" aria-hidden>
                  {L.chroma.map((v, pc) => (
                    <div key={pc} className="flex h-full flex-1">
                      <div className={cn('mt-auto w-full rounded-t-sm transition-[height] duration-100', tones.has(pc) ? 'bg-ink' : 'bg-ink-2/45')} style={{ height: `${Math.max(4, v * 88)}px` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 flex gap-1" aria-hidden>
                  {NOTE_NAMES.map((n, pc) => (
                    <div key={pc} className="flex-1 text-center">
                      <span className={cn('font-display text-xs font-semibold', tones.has(pc) ? 'text-ink' : 'text-ink-2')}>{n}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-2">Notes heard right now. Dark bars are the chord’s notes.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {chord && (
              <div className="rounded-xl border border-rule bg-card p-5 shadow-envelope">
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Common shape</p>
                      <Button variant="link" className="h-auto p-0" onClick={() => go('chords', chord.id)}>
                        Open {chord.id}
                      </Button>
                    </div>
                    <div className="mx-auto mt-2 max-w-48">
                      <ChordDiagram voicing={chord.voicings[0]} name={chord.id} leftHanded={settings.leftHanded} />
                    </div>
                  </>
              </div>
              )}

              <div className="rounded-xl border border-rule bg-card p-5 shadow-envelope">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Mic level</span>
                  <span className="text-ink-2">Tick = listening threshold</span>
                </div>
                <LevelMeter className="mt-3" level={L.level} sensitivity={settings.sensitivity} />
                <label className="mt-5 block text-sm font-medium" htmlFor="sens">Sensitivity</label>
                <Slider id="sens" className="mt-3" min={0} max={1} step={0.05} value={[settings.sensitivity]} onValueChange={([v]) => setSettings({ sensitivity: v })} aria-label="Mic sensitivity" />
                <p className="mt-2 text-xs text-ink-2">Raise it if quiet strums are missed. Lower it if room noise triggers chords.</p>
              </div>
            </div>
          </div>

          {history.length > 0 && (
            <div className="mt-4">
              <h2 className="text-sm font-medium">Recently heard</h2>
              <ol className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
                {history.map((h, i) => (
                  <li key={i + h} className={cn('shrink-0 rounded-lg border border-rule bg-card px-3 py-1.5 shadow-envelope', i === 0 && 'border-ink')}>
                    <ChordName id={h} className="text-xl" />
                  </li>
                ))}
              </ol>
            </div>
          )}
        </MicGate>
      </div>
    </section>
  )
}

