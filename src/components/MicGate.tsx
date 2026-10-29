import { Mic, MicOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { gateFor, type MicStatus } from '@/lib/mic'
import { cn } from '@/lib/utils'

const MESSAGES: Partial<Record<MicStatus, string>> = {
  denied: 'Microphone access is blocked. Allow it for this site in your browser settings, then try again.',
  unsupported: "This browser can't reach a microphone here. Use a current Chrome, Edge, Firefox or Safari over HTTPS.",
  error: "Couldn't open the microphone. Check that one is connected and not in use by another app.",
}

type Props = {
  status: MicStatus
  onStart: () => void
  title: string
  body: string
  children: ReactNode
}

/** Renders the ask-for-mic panel until the mic is on, then the children. */
export function MicGate({ status, onStart, title, body, children }: Props) {
  if (status === 'on') return <>{children}</>
  const msg = MESSAGES[status]
  return (
    <div className="rounded-xl border border-rule bg-card px-5 py-10 text-center shadow-envelope sm:px-10 sm:py-14">
      <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-ink text-paper">
        {msg ? <MicOff className="size-6" /> : <Mic className="size-6" />}
      </div>
      <h2 className="font-display text-3xl font-bold sm:text-4xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-ink-2">{body}</p>
      {msg && (
        <p role="alert" className="mx-auto mt-4 max-w-md text-sm font-medium text-miss">
          {msg}
        </p>
      )}
      <Button size="lg" className="mt-7 h-12 px-7 text-base" onClick={onStart} disabled={status === 'starting'}>
        <Mic /> {status === 'starting' ? 'Opening mic…' : msg ? 'Try again' : 'Start listening'}
      </Button>
      <p className="mt-4 text-xs text-ink-2">Audio is analysed on this device and never uploaded.</p>
    </div>
  )
}

/** Input level with the sensitivity gate marked, so players can see why they're not being heard. */
export function LevelMeter({ level, sensitivity, className }: { level: number; sensitivity: number; className?: string }) {
  // Log scale: -60 dB … 0 dB across the bar.
  const pos = (v: number) => Math.max(0, Math.min(1, (20 * Math.log10(Math.max(v, 1e-6)) + 60) / 60)) * 100
  const gate = pos(gateFor(sensitivity))
  const lvl = pos(level)
  return (
    <div className={cn('relative h-2 rounded-full bg-muted', className)} role="meter" aria-label="Input level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(lvl)}>
      <div className={cn('h-full rounded-full transition-[width] duration-75', lvl >= gate ? 'bg-ink' : 'bg-ink-2/40')} style={{ width: `${lvl}%` }} />
      <div className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded bg-ink ring-2 ring-card" style={{ left: `${gate}%` }} title="Listening threshold" />
    </div>
  )
}
