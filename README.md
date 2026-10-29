# Chordbox

Guitar chord library for 6-string acoustic (standard tuning) that plays every chord, listens through the mic to name what you strum, drills single chords and progressions on a metronome, and tunes your guitar. No backend; everything is saved in `localStorage`.

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/, host anywhere (relative paths, hash routing)
npm test         # DSP self-check (chroma, chord matching, pitch)
```

The mic needs a secure context: `localhost` or HTTPS.

- Chord shapes: `@tombatossals/chords-db` (16 qualities × 12 keys, filtered in `src/lib/chords.ts`)
- Sound: Karplus–Strong plucked strings on Web Audio (`src/lib/audio.ts`)
- Listening: FFT chroma + chord-template matching (`src/lib/detect.ts`); the tuner uses McLeod pitch detection
- Mic sensitivity and practice strictness live in Settings, because every mic and room is different

## Install & offline

Chordbox is a PWA. On the first visit the service worker (`src/sw.js`, built by the `serviceWorker` plugin in `vite.config.ts`) precaches every built file: code, fonts, chord data and icons. From then on the whole app works with no network: library, sound, listening, practice and tuner. Install comes from the header button (when the browser offers it), from Settings → App, or on iOS from Share → Add to Home Screen.

When a new build is deployed, the app picks it up the next time it's opened or brought to the front, and offers a Reload. Service workers need HTTPS (or `localhost`), and dev mode (`dev`) doesn't register one; use `build` + `preview` to try offline.
