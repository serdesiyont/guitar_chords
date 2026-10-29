import { Play, Search, Star } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CHORDS, FAMILIES, KEYS, voicingLabel, type Chord, type Family } from '@/lib/chords'
import { go, usePlay } from '@/lib/hooks'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ChordDiagram } from './ChordDiagram'
import { ChordName } from './ChordName'
import { ChordSheet } from './ChordSheet'

const chip = 'h-11 md:h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring'
const chipOn = 'border-ink bg-ink text-paper'
const chipOff = 'border-rule bg-card text-ink hover:border-ink-2'

export function Library({ openId }: { openId: string | null }) {
  const { favorites } = useStore()
  const [q, setQ] = useState('')
  const [key, setKey] = useState<string>('all')
  const [family, setFamily] = useState<Family | 'all'>('all')
  const [openOnly, setOpenOnly] = useState(false)
  const [favOnly, setFavOnly] = useState(false)
  const query = useDeferredValue(q.trim().toLowerCase().replace(/\s+/g, ''))

  const list = useMemo(
    () =>
      CHORDS.filter(
        (c) =>
          (!query || c.id.toLowerCase().startsWith(query)) &&
          (key === 'all' || c.key === key) &&
          (family === 'all' || c.family === family) &&
          (!openOnly || c.open) &&
          (!favOnly || favorites.includes(c.id)),
      ),
    [query, key, family, openOnly, favOnly, favorites],
  )

  return (
    <section aria-labelledby="lib-title">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 id="lib-title" className="font-display text-4xl font-bold sm:text-5xl">Chords</h1>
          <p className="mt-1 text-ink-2">Tap a chord to hear it. Standard tuning, E A D G B E.</p>
        </div>
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, e.g. Am7" aria-label="Search chords" className="h-11 bg-card pl-9 text-base" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4" role="group" aria-label="Root note">
          {['all', ...KEYS].map((k) => (
            <button key={k} className={cn(chip, 'min-w-11 font-display text-base font-semibold', key === k ? chipOn : chipOff)} aria-pressed={key === k} onClick={() => setKey(k)}>
              {k === 'all' ? 'All keys' : k}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Chord type">
            {FAMILIES.map((f) => (
              <button key={f.id} className={cn(chip, family === f.id ? chipOn : chipOff)} aria-pressed={family === f.id} onClick={() => setFamily(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-5">
            <Label className="gap-2 text-sm font-medium">
              <Switch checked={openOnly} onCheckedChange={setOpenOnly} /> Open shapes only
            </Label>
            <Label className="gap-2 text-sm font-medium">
              <Switch checked={favOnly} onCheckedChange={setFavOnly} /> Saved
            </Label>
          </div>
        </div>
      </div>

      <p className="mt-6 mb-3 text-sm text-ink-2" aria-live="polite">
        {list.length} {list.length === 1 ? 'chord' : 'chords'}
      </p>

      {list.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((c) => (
            <li key={c.id}>
              <ChordCard chord={c} fav={favorites.includes(c.id)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-rule px-6 py-14 text-center">
          <p className="font-display text-2xl font-bold">No chords match</p>
          <p className="mt-1 text-ink-2">{favOnly && !favorites.length ? 'Save chords with the star in a chord’s detail view.' : 'Try another key or clear a filter.'}</p>
        </div>
      )}

      <ChordSheet id={openId} onClose={() => go('chords')} />
    </section>
  )
}

function ChordCard({ chord, fav }: { chord: Chord; fav: boolean }) {
  const { settings } = useStore()
  const { ring, play } = usePlay()
  const v = chord.voicings[0]
  return (
    <article className="group relative overflow-hidden rounded-lg border border-rule bg-card shadow-envelope transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
      <button className="absolute inset-0 z-0 cursor-pointer rounded-lg outline-none" aria-label={`Open ${chord.id}`} onClick={() => go('chords', chord.id)} />
      <div className="pointer-events-none flex items-start justify-between gap-2 px-3 pt-3">
        <ChordName id={chord.id} className="text-chord" />
        <span className="mt-1 flex items-center gap-1.5 text-ink">
          {fav && <Star className="size-3.5 fill-ink" aria-label="Saved" />}
          <span className="stamp">{voicingLabel(v)}</span>
        </span>
      </div>
      <div className="perf tear mt-2.5" />
      <div className="pointer-events-none px-4 pt-2">
        <ChordDiagram voicing={v} name={chord.id} leftHanded={settings.leftHanded} ring={ring} showNames={false} />
      </div>
      <p className="pointer-events-none border-t border-rule px-3 py-2.5 font-display text-sm font-semibold tracking-[0.18em] text-ink-2" aria-hidden>
        {v.frets.map((f) => (f < 0 ? 'x' : f === 0 ? 0 : f + v.baseFret - 1)).join(' ')}
      </p>
      <button
        className="absolute right-1 bottom-0.5 z-10 flex size-10 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-ink hover:text-paper outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Play ${chord.id}`}
        onClick={() => play(v)}
      >
        <Play className="size-4 fill-current" />
      </button>
    </article>
  )
}
