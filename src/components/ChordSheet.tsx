import { ChevronLeft, ChevronRight, Play, Star, Target, Waves } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { BY_ID, longName, noteName, STRINGS, voicingLabel } from '@/lib/chords'
import { go, useMedia, usePlay } from '@/lib/hooks'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ChordDiagram } from './ChordDiagram'
import { ChordName } from './ChordName'

export function ChordSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const desktop = useMedia('(min-width: 768px)')
  const chord = id ? BY_ID.get(id) : undefined
  return (
    <Sheet open={!!chord} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side={desktop ? 'right' : 'bottom'}
        className={cn('gap-0 overflow-y-auto bg-paper', desktop ? 'w-full sm:max-w-md' : 'max-h-[92dvh] rounded-t-2xl')}
      >
        {chord && <Detail key={chord.id} id={chord.id} />}
      </SheetContent>
    </Sheet>
  )
}

function Detail({ id }: { id: string }) {
  const chord = BY_ID.get(id)!
  const { settings, favorites, toggleFavorite, stats } = useStore()
  const [vi, setVi] = useState(0)
  const { ring, play } = usePlay()
  const v = chord.voicings[vi]
  const fav = favorites.includes(id)
  const st = stats[id]
  const n = chord.voicings.length

  return (
    <>
      <SheetHeader className="px-5 pt-6 pb-2">
        <SheetTitle asChild>
          <h2>
            <ChordName id={id} className="text-6xl" />
          </h2>
        </SheetTitle>
        <SheetDescription className="text-base text-ink-2 first-letter:uppercase">{longName(id)}</SheetDescription>
      </SheetHeader>

      <div className="px-5">
        <div className="overflow-hidden rounded-xl border border-rule bg-card shadow-envelope">
          <div className="flex items-center justify-between px-3 pt-3">
            <Button variant="ghost" size="icon-lg" aria-label="Previous voicing" disabled={vi === 0} onClick={() => setVi(vi - 1)}>
              <ChevronLeft />
            </Button>
            <p className="text-sm font-medium" aria-live="polite">
              {voicingLabel(v)} <span className="text-ink-2">· {vi + 1} of {n}</span>
            </p>
            <Button variant="ghost" size="icon-lg" aria-label="Next voicing" disabled={vi === n - 1} onClick={() => setVi(vi + 1)}>
              <ChevronRight />
            </Button>
          </div>
          <div className="perf tear mt-2" />
          <button
            className="mx-auto block w-full max-w-[17rem] cursor-pointer px-6 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            onClick={() => play(v)}
            aria-label={`Play ${id}`}
          >
            <ChordDiagram voicing={v} name={id} leftHanded={settings.leftHanded} ring={ring} />
          </button>
          <ul className="flex flex-wrap justify-center gap-1.5 px-4 pb-4" aria-label="Notes, low to high">
            {v.frets.map((f, s) =>
              f < 0 ? null : (
                <li key={s} className="rounded-md bg-paper px-2 py-0.5 font-display text-sm font-semibold" style={{ boxShadow: 'inset 0 -2px 0 var(--ink)' }}>
                  {noteName(v.midi[v.frets.slice(0, s).filter((x) => x >= 0).length])}
                  <span className="sr-only"> on the {STRINGS[s].name}{STRINGS[s].octave} string</span>
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button size="lg" className="h-12 text-base" onClick={() => play(v, 'strum')}>
            <Play /> Strum
          </Button>
          <Button size="lg" variant="outline" className="h-12 text-base" onClick={() => play(v, 'arpeggio')}>
            <Waves /> Arpeggio
          </Button>
          <Button size="lg" variant="outline" className="h-12 text-base" onClick={() => go('practice', 'chord', id)}>
            <Target /> Practice
          </Button>
          <Button size="lg" variant="outline" className="h-12 text-base" aria-pressed={fav} onClick={() => toggleFavorite(id)}>
            <Star className={cn(fav && 'fill-ink')} /> {fav ? 'Saved' : 'Save'}
          </Button>
        </div>

        <p className="mt-5 mb-8 text-sm text-ink-2">
          {st
            ? `Practised ${st.attempts}× · ${Math.round((st.hits / st.attempts) * 100)}% clean${st.bestMs ? ` · best ${(st.bestMs / 1000).toFixed(1)} s` : ''}`
            : 'Not practised yet. Tap the diagram to hear it, then try it in Practice.'}
        </p>
      </div>
    </>
  )
}
