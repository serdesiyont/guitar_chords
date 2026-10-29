import { splitName } from '@/lib/chords'
import { cn } from '@/lib/utils'

/** Root at full size, quality a step down: how chord charts set names. */
export function ChordName({ id, className }: { id: string; className?: string }) {
  const [k, s] = splitName(id)
  return (
    <span className={cn('font-display font-bold leading-none tracking-tight', className)}>
      {k}
      {s && <span className="text-[max(0.62em,0.8rem)] font-semibold">{s}</span>}
    </span>
  )
}
