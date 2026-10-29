# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React SPA, Tailwind, shadcn/ui. No backend, no database. Persistence via localStorage only.

## Users

Guitar players on a 6-string acoustic in standard tuning, beginner-first: people learning their first open chords, with depth (barre, 7th, sus, add) available for intermediate players. They use it with a guitar in their lap, phone or laptop propped nearby, often with one hand free at most.

## Product Purpose

Look up a chord, hear it, play it, and get told whether you played it. Success: a learner can go from "what is G?" to playing a G→C→D progression on tempo, with the app confirming each chord by listening.

## Positioning

The app listens. Chord diagrams and audio are table stakes; mic-based chord recognition turns the library into a feedback loop (practice a chord, practice a progression on a metronome, tune first).

## Operating Context

- Guitar in hand; glance-and-play. Controls must be large, reachable, and few during practice.
- Mic permission required for listening, tuner, and practice; app must remain useful (library + audio) without it.
- Mobile and desktop are both primary.

## Capabilities and Constraints

- Chord library: classic 6-string acoustic chords, standard tuning (E A D G B E), diagrams with finger numbers, muted/open strings, barres, fret position.
- Chord audio: synthesized strum/arpeggio of the voicing.
- Listen mode: live chord detection from mic (chromagram template matching).
- Practice a chord: target chord, detect, confirm hold, score.
- Practice a progression: preset or custom chord sequence, metronome/BPM, advance on tempo with per-beat detection grading.
- Tuner: mic pitch detection for the 6 strings.
- Left-handed diagram toggle.
- Stats & streaks per chord, daily streak, saved custom progressions, favorites, settings: all localStorage.
- Detection is heuristic; it must be forgiving and honest about uncertainty.

## Evidence on Hand

None. No testimonials, users, or benchmarks exist; do not fabricate any.

## Product Principles

1. Hands are busy: practice screens need one obvious control and big feedback.
2. Listening is the differentiator: surface it everywhere, degrade gracefully without the mic.
3. Beginner-first, never beginner-only: open chords lead, depth is one filter away.
4. Honest feedback: show confidence, never claim certainty the detector does not have.

## Accessibility & Inclusion

Left-handed players supported via mirrored diagrams. Feedback must not rely on color alone; keyboard operable; respects reduced motion.
