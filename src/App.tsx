import { Ear, Gauge, LayoutGrid, SlidersHorizontal, Target } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Library } from '@/components/Library'
import { Listen } from '@/components/Listen'
import { Practice } from '@/components/Practice'
import { SettingsSheet } from '@/components/Settings'
import { Tuner } from '@/components/Tuner'
import { useRoute } from '@/lib/hooks'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const NAV = [
  { id: 'chords', label: 'Chords', icon: LayoutGrid },
  { id: 'listen', label: 'Listen', icon: Ear },
  { id: 'practice', label: 'Practice', icon: Target },
  { id: 'tuner', label: 'Tuner', icon: Gauge },
]

// Brand mark: a string set, six lines at real gauge weights in ball-end colours.
function Mark() {
  return (
    <svg viewBox="0 0 26 24" className="h-6 w-auto" aria-hidden>
      {[3.4, 2.7, 2.1, 1.6, 1.1, 0.8].map((w, i) => (
        <line key={i} x1={3 + i * 4} x2={3 + i * 4} y1={2} y2={22} stroke={`var(--string-${i})`} strokeWidth={w} strokeLinecap="round" />
      ))}
    </svg>
  )
}

export default function App() {
  const route = useRoute()
  const page = NAV.some((n) => n.id === route[0]) ? route[0] : 'chords'
  const { streak } = useStore()
  const [settings, setSettings] = useState(false)

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/92 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 md:h-16">
          <a href="#/chords" className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Mark />
            <span className="font-display text-2xl font-bold tracking-tight">Chordbox</span>
          </a>
          <nav aria-label="Main" className="hidden h-full items-stretch gap-1 md:flex">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#/${n.id}`}
                aria-current={page === n.id ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-2 px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  page === n.id ? 'text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t after:bg-ink' : 'text-ink-2 hover:text-ink',
                )}
              >
                <n.icon className="size-4" /> {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {streak > 0 && (
              <span className="rounded-full border border-rule bg-card px-3 py-1 text-sm font-medium" title="Days in a row with practice">
                {streak}-day streak
              </span>
            )}
            <Button variant="ghost" size="icon-lg" aria-label="Settings" onClick={() => setSettings(true)}>
              <SlidersHorizontal />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 md:pt-10 md:pb-16">
        {page === 'chords' && <Library openId={route[1] ?? null} />}
        {page === 'listen' && <Listen />}
        {page === 'practice' && <Practice route={route} />}
        {page === 'tuner' && <Tuner />}
      </main>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
        <div className="grid grid-cols-4">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#/${n.id}`}
              aria-current={page === n.id ? 'page' : undefined}
              className={cn('relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium outline-none focus-visible:bg-muted', page === n.id ? 'text-ink' : 'text-ink-2')}
            >
              {page === n.id && <span className="absolute inset-x-6 top-0 h-[3px] rounded-b bg-ink" />}
              <n.icon className="size-5" strokeWidth={page === n.id ? 2.4 : 1.8} />
              {n.label}
            </a>
          ))}
        </div>
      </nav>

      <SettingsSheet open={settings} onOpenChange={setSettings} />
      <Toaster position="top-center" />
    </div>
  )
}
