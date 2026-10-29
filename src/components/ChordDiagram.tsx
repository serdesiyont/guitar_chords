import { STRINGS, type Voicing } from '@/lib/chords'
import { cn } from '@/lib/utils'

// Stroke widths track a real 12–53 acoustic set, low E heaviest.
const GAUGE_W = [3.7, 2.95, 2.25, 1.7, 1.12, 0.85]
const FRETS = 4
const X0 = 22, DX = 17, Y0 = 34, DY = 24

type Props = {
  voicing: Voicing
  name: string
  leftHanded?: boolean
  /** Per-string start offsets (s) from the last playback; strings shimmer in that order. */
  ring?: { key: number; offsets: number[] } | null
  showNames?: boolean
  className?: string
}

export function ChordDiagram({ voicing, name, leftHanded, ring, showNames = true, className }: Props) {
  const { frets, fingers, baseFret, barres } = voicing
  const x = (s: number) => X0 + (leftHanded ? 5 - s : s) * DX
  const yMid = (f: number) => Y0 + (f - 0.5) * DY
  const yEnd = Y0 + FRETS * DY
  const sounded = frets.map((f, s) => (f >= 0 ? s : -1)).filter((s) => s >= 0)
  const label = `${name} chord, strings low to high: ${frets.map((f) => (f < 0 ? 'muted' : f === 0 ? 'open' : `fret ${f + baseFret - 1}`)).join(', ')}`

  return (
    <svg viewBox={`0 0 129 ${showNames ? 172 : 140}`} role="img" aria-label={label} className={cn('block w-full select-none', className)}>
      {/* frets */}
      {Array.from({ length: FRETS + 1 }, (_, i) => (
        <line key={i} x1={X0} x2={X0 + 5 * DX} y1={Y0 + i * DY} y2={Y0 + i * DY} className="stroke-rule" strokeWidth={1.25} />
      ))}
      {baseFret === 1 ? (
        <rect x={X0 - 1.5} y={Y0 - 5} width={5 * DX + 3} height={5.5} rx={1} className="fill-ink" />
      ) : (
        <text x={leftHanded ? X0 + 5 * DX + 7 : X0 - 7} y={yMid(1) + 4} textAnchor={leftHanded ? 'start' : 'end'} className="fill-ink-2 font-display text-[12px] font-semibold">
          {baseFret}fr
        </text>
      )}

      {/* strings */}
      <g key={ring?.key}>
        {STRINGS.map((_, s) => (
          <line
            key={s}
            x1={x(s)}
            x2={x(s)}
            y1={Y0}
            y2={yEnd}
            stroke={`var(--string-${s})`}
            strokeWidth={GAUGE_W[s]}
            strokeLinecap="round"
            opacity={frets[s] < 0 ? 0.3 : 1}
            className={ring && frets[s] >= 0 ? 'string-ring' : undefined}
            style={ring && frets[s] >= 0 ? { animationDelay: `${ring.offsets[sounded.indexOf(s)] ?? 0}s` } : undefined}
          />
        ))}
      </g>

      {/* open / muted markers */}
      {frets.map((f, s) =>
        f === 0 ? (
          <circle key={s} cx={x(s)} cy={Y0 - 15} r={4.6} fill="none" stroke={`var(--string-${s})`} strokeWidth={2} />
        ) : f < 0 ? (
          <path key={s} d={`M${x(s) - 4} ${Y0 - 19}l8 8m0 -8l-8 8`} className="stroke-ink-2" strokeWidth={1.8} strokeLinecap="round" />
        ) : null,
      )}

      {/* barres */}
      {barres.map((b) => {
        const on = frets.map((f, s) => (f === b ? s : -1)).filter((s) => s >= 0)
        if (on.length < 2) return null
        const a = x(Math.min(...on)), z = x(Math.max(...on))
        return <rect key={b} x={Math.min(a, z) - 7.5} y={yMid(b) - 7.5} width={Math.abs(z - a) + 15} height={15} rx={7.5} className="fill-ink" />
      })}

      {/* fingers */}
      {frets.map((f, s) => {
        if (f <= 0) return null
        const onBarre = barres.includes(f) && frets.filter((g) => g === f).length > 1 && fingers[s] === fingers[frets.indexOf(f)]
        return (
          <g key={s}>
            {!onBarre && <circle cx={x(s)} cy={yMid(f)} r={7.5} className="fill-ink" />}
            {fingers[s] > 0 && (!onBarre || s === frets.indexOf(f)) && (
              <text x={x(s)} y={yMid(f) + 3.6} textAnchor="middle" className="fill-paper font-display text-[11px] font-bold">
                {fingers[s]}
              </text>
            )}
          </g>
        )
      })}

      {showNames &&
        STRINGS.map((st, s) => (
          <text key={s} x={x(s)} y={yEnd + 18} textAnchor="middle" className="fill-ink-2 font-display text-[11px] font-semibold">
            {st.name}
          </text>
        ))}
    </svg>
  )
}
