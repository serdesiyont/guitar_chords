import { useCallback, useEffect, useRef, useState } from 'react'
import { audio } from './audio'
import { chroma, detectPitch, rank, type Match } from './detect'

export type MicStatus = 'idle' | 'starting' | 'on' | 'denied' | 'unsupported' | 'error'

const FFT = 16384

/** Owns one mic stream + analyser for the component that calls it; released on unmount. */
export function useMic() {
  const [status, setStatus] = useState<MicStatus>('idle')
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const stream = useRef<MediaStream | null>(null)

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    setAnalyser(null)
    setStatus('idle')
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return setStatus('unsupported')
    setStatus('starting')
    try {
      // Raw signal: browser voice processing eats sustained guitar notes.
      const s = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      const c = audio()
      const a = c.createAnalyser()
      a.fftSize = FFT
      a.smoothingTimeConstant = 0.4
      c.createMediaStreamSource(s).connect(a)
      stream.current = s
      setAnalyser(a)
      setStatus('on')
    } catch (e) {
      setStatus((e as Error).name === 'NotAllowedError' ? 'denied' : 'error')
    }
  }, [])

  useEffect(() => stop, [stop])
  return { status, analyser, start, stop }
}

/** Sensitivity 0..1 → RMS gate. Exposed as a setting because every mic and room differs. */
export const gateFor = (sensitivity: number) => 0.03 * Math.pow(0.08, sensitivity)

function rms(buf: Float32Array) {
  let s = 0
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]
  return Math.sqrt(s / buf.length)
}

export type Listening = { chroma: number[]; matches: Match[]; level: number; active: boolean }
const SILENT: Listening = { chroma: new Array(12).fill(0), matches: [], level: 0, active: false }

/** Smoothed chroma + ranked chord matches, ~12 times a second. */
export function useChordListener(analyser: AnalyserNode | null, sensitivity: number) {
  const [state, setState] = useState<Listening>(SILENT)

  useEffect(() => {
    if (!analyser) return setState(SILENT)
    const freq = new Float32Array(analyser.frequencyBinCount)
    const lin = new Float32Array(analyser.frequencyBinCount)
    const time = new Float32Array(2048)
    let smooth = new Array(12).fill(0)
    const gate = gateFor(sensitivity)
    const id = window.setInterval(() => {
      analyser.getFloatTimeDomainData(time)
      const level = rms(time)
      if (level < gate) {
        smooth = smooth.map((v) => v * 0.6)
        return setState({ chroma: smooth, matches: [], level, active: false })
      }
      analyser.getFloatFrequencyData(freq)
      for (let i = 0; i < freq.length; i++) lin[i] = Math.pow(10, freq[i] / 20)
      const ch = chroma(lin, analyser.context.sampleRate, analyser.fftSize)
      smooth = smooth.map((v, i) => v * 0.45 + ch[i] * 0.55)
      setState({ chroma: smooth, matches: rank(smooth), level, active: true })
    }, 80)
    return () => clearInterval(id)
  }, [analyser, sensitivity])

  return state
}

/** Fundamental frequency for the tuner, ~20 times a second. */
export function usePitch(analyser: AnalyserNode | null, sensitivity: number) {
  const [pitch, setPitch] = useState<{ hz: number | null; level: number }>({ hz: null, level: 0 })
  useEffect(() => {
    if (!analyser) return
    const time = new Float32Array(4096)
    const gate = gateFor(sensitivity) * 0.6
    const id = window.setInterval(() => {
      analyser.getFloatTimeDomainData(time)
      setPitch({ hz: detectPitch(time, analyser.context.sampleRate, gate), level: rms(time) })
    }, 50)
    return () => clearInterval(id)
  }, [analyser, sensitivity])
  return pitch
}
