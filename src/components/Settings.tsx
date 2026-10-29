import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { StrumStyle } from '@/lib/audio'
import { useStore } from '@/lib/store'

export function SettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { settings: s, setSettings, resetProgress } = useStore()
  const [confirm, setConfirm] = useState(false)
  useEffect(() => {
    if (!confirm) return
    const t = setTimeout(() => setConfirm(false), 4000)
    return () => clearTimeout(t)
  }, [confirm])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-paper sm:max-w-sm">
        <SheetHeader className="px-5 pt-6">
          <SheetTitle className="font-display text-3xl font-bold">Settings</SheetTitle>
          <SheetDescription>Saved on this device only.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-7 px-5 pb-8">
          <Label className="justify-between text-base font-medium">
            Left-handed diagrams
            <Switch checked={s.leftHanded} onCheckedChange={(v) => setSettings({ leftHanded: v })} />
          </Label>

          <div>
            <p className="text-base font-medium">Chord sound</p>
            <ToggleGroup type="single" variant="outline" className="mt-2 w-full" value={s.strum} onValueChange={(v) => v && setSettings({ strum: v as StrumStyle })}>
              <ToggleGroupItem value="strum" className="h-10 flex-1">Strum</ToggleGroupItem>
              <ToggleGroupItem value="arpeggio" className="h-10 flex-1">Arpeggio</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Field label="Volume" value={s.volume} onChange={(v) => setSettings({ volume: v })} />
          <Field label="Mic sensitivity" hint="Raise if quiet strums are missed. Lower if room noise triggers chords." left="Loud playing" right="Picks up quiet" value={s.sensitivity} onChange={(v) => setSettings({ sensitivity: v })} />
          <Field label="Practice strictness" hint="How closely a chord must match before it counts." left="Forgiving" right="Strict" value={s.strictness} onChange={(v) => setSettings({ strictness: v })} />

          <div className="border-t border-rule pt-6">
            <p className="text-base font-medium">Reset progress</p>
            <p className="mt-1 text-sm text-ink-2">Erases practice stats, streak and best runs. Saved chords and progressions stay.</p>
            <Button
              variant={confirm ? 'destructive' : 'outline'}
              className="mt-3"
              onClick={() => {
                if (!confirm) return setConfirm(true)
                resetProgress()
                setConfirm(false)
                toast('Progress reset')
              }}
            >
              {confirm ? 'Tap again to erase' : 'Reset progress'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, hint, left, right, value, onChange }: { label: string; hint?: string; left?: string; right?: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="text-base font-medium">{label}</p>
      {hint && <p className="mt-0.5 text-sm text-ink-2">{hint}</p>}
      <Slider className="mt-3" min={0} max={1} step={0.05} value={[value]} onValueChange={([v]) => onChange(v)} aria-label={label} />
      {left && (
        <div className="mt-1.5 flex justify-between text-xs text-ink-2">
          <span>{left}</span>
          <span>{right}</span>
        </div>
      )}
    </div>
  )
}
