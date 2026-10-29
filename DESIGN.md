---
name: Chordbox
description: Find a chord, hear it, play it, and get heard. Black ink on cool envelope stock, colour only on the strings.
colors:
  envelope-stock: "#f1f2ee"
  envelope-white: "#ffffff"
  ink: "#161616"
  ink-soft: "#51524d"
  rule: "#d4d5ce"
  input-edge: "#c9cac3"
  stock-shade: "#e4e5df"
  stock-muted: "#e7e8e2"
  hit-green: "#1d7340"
  miss-red: "#bf2a1f"
  string-low-e-red: "#dc3a2e"
  string-a-orange: "#e8851a"
  string-d-gold: "#d9a900"
  string-g-green: "#2b9653"
  string-b-blue: "#2569cc"
  string-high-e-violet: "#7a44c6"
typography:
  display:
    fontFamily: "Barlow Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "7rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Barlow Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1
  title:
    fontFamily: "Barlow Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.33
  body:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"tnum\" 1"
  label:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
  stamp:
    fontFamily: "Barlow Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.04em"
  fret-notation:
    fontFamily: "Barlow Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    letterSpacing: "0.18em"
rounded:
  stamp: "3px"
  sm: "4.8px"
  md: "6.4px"
  lg: "8px"
  xl: "11.2px"
  full: "9999px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.envelope-stock}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 24px"
  button-outline:
    backgroundColor: "{colors.envelope-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "48px"
  button-ghost-hover:
    backgroundColor: "{colors.stock-shade}"
    textColor: "{colors.ink}"
  chip:
    backgroundColor: "{colors.envelope-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0 14px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.envelope-stock}"
  envelope-card:
    backgroundColor: "{colors.envelope-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  envelope-panel:
    backgroundColor: "{colors.envelope-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  stamp:
    textColor: "{colors.ink}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    padding: "1px 5px 0"
  toggle-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.envelope-stock}"
    rounded: "{rounded.md}"
  input-search:
    backgroundColor: "{colors.envelope-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
---

# Design System: Chordbox

## Overview

**Creative North Star: "The String Envelope"**

Chordbox is printed like the packaging a set of guitar strings comes in: black ink on cool, slightly green-grey envelope stock, each chord sealed in its own white envelope with a perforated tear line between the label and the contents. The interface is ink and paper. The only colour in the whole system is on the strings themselves, in the six ball-end colours a colour-coded string set uses, drawn at the real weights of a 12-53 acoustic set so the low E reads heavy and the high E hairline.

Density is generous and glanceable, because the player has a guitar in their lap and at most one hand free. Chord names and gauge-style numerals are set huge in Barlow Condensed, the way a string pack prints its gauges; everything else is quiet Barlow at reading size. Motion is nearly absent: one authored movement, the strings shimmering in strum order when a chord sounds, plus an ink stamp landing when a chord is played clean.

The system is light-only by decision. It refuses the dark neon fretboard that guitar apps default to, and it refuses the stock white card grid: cards here are envelopes, with tear lines, stamps and printed fret notation, not generic tiles.

**Key Characteristics:**
- Ink on envelope stock; white envelope cards with a perforated tear line and half-circle notches.
- Colour lives only on strings, in fixed ball-end order, at real gauge weights.
- Barlow Condensed for every name and numeral; Barlow for prose and controls; tabular figures everywhere.
- Outlined ink stamps for classification labels; a rotated green stamp for success.
- Selected state is always solid ink with stock-coloured text.
- One authored motion (string shimmer), honouring reduced motion.

## Colors

A monochrome ink-and-stock palette with a fixed six-colour string set and two semantic grading colours, nothing else.

### Primary
- **Pack Ink** (ink): Text, filled buttons, selected chips and toggles, finger dots, barres, the nut bar, focus rings, active-tab underline. Ink is the system's only "accent": emphasis comes from filling a shape with it.

### Neutral
- **Envelope Stock** (envelope-stock): Page background, sheet backgrounds, text on ink fills, and the fill of the tear-line notches so they read as holes punched through the card.
- **Envelope White** (envelope-white): Every card, panel, chip and input surface. White on stock is the envelope sitting on the counter.
- **Faded Ink** (ink-soft): Secondary text, muted-string crosses, fret labels, unselected nav, perforation dots.
- **Rule Grey** (rule): Card borders, fret lines in diagrams, dividers, the fret-notation band's top rule, notch outlines.
- **Input Edge** (input-edge): Input and outline-control borders.
- **Stock Shade / Stock Muted** (stock-shade, stock-muted): Ghost and outline hover fills, meter tracks, progress tracks. Never a surface colour for content.

### Strings (data colour, not brand accent)
- **Low E Red, A Orange, D Gold, G Green, B Blue, High E Violet** (string-low-e-red through string-high-e-violet): Applied by string index, low to high, and only to things that are a string: diagram string lines, open-string rings, tuner string cards' string line and ball end, the tuner needle while it is reading that string, and the brand mark (six strings).

### Semantic
- **Clean Green** (hit-green): Played clean. Clean stamp border and text, in-tune label and needle, hold bar when done, detected chord name when it matches, check marks on graded changes.
- **Miss Red** (miss-red): Missed change, mic error text, the remove-chord hover edge, destructive actions.

### Named Rules
**The Strings-Only Rule.** The six string colours appear only on a string or a direct readout of one string. Never on buttons, headings, chips, backgrounds, charts or decoration. The palette rarity is the identity.

**The Fixed Order Rule.** String colour is bound to string index (low E red through high E violet) and never reassigned, reordered or used out of sequence. Left-handed mode mirrors the position, not the colour.

**The Paired Signal Rule.** Hit green and miss red never carry meaning alone: every use pairs with an icon (check, cross, arrow) or a word ("Clean", "In tune", "missed").

## Typography

**Display Font:** Barlow Condensed 600/700 (with Barlow, ui-sans-serif)
**Body Font:** Barlow 400/500/600 (with ui-sans-serif, system-ui)

**Character:** A condensed gauge-print face for names and numbers against a plain humanist grotesque for everything you read, the way a string pack sets "12-53" huge and the care instructions small. Self-hosted via Fontsource; tabular figures are on globally so counts, bpm, cents and timings never jitter.

### Hierarchy
- **Display** (700, `--text-display` 5.5rem below 640px, `--text-display-lg` 7rem from 640px, line-height 1): The chord being heard or practised, the tuner note, the countdown (always 7rem) and the progression score (always 5.5rem). One per view; no other display sizes.
- **Headline** (700, 2.25rem mobile / 3rem desktop, line-height 1): Page titles (Chords, Listen, Practice, Tuner), sheet chord name (3.75rem), mic-gate titles (1.875 to 2.25rem).
- **Title** (700, 1.25 to 1.5rem): Panel titles (Your progress, a progression's name, Build your own), empty-state headline.
- **Body** (400, 1rem, line-height 1.5): Descriptions and help text, in ink-soft; mic-gate copy caps at 28rem.
- **Label** (500, 0.875rem): Chips, switches, toggles, nav, field labels. Root-note chips switch to Barlow Condensed 600 at 1rem because they are note names.
- **Card Name** (700, `--text-chord` 2rem): Chord name on library envelope cards.
- **Diagram Labels** (Barlow Condensed 600-700, 11-12 SVG user units): Finger numbers, string names and the `Nfr` position inside the chord diagram. They scale with the diagram's viewBox, so they are not CSS type-ramp steps.
- **Stamp** (Barlow Condensed 700, 12px, 0.04em, uppercase): Voicing class labels only (OPEN, CLOSED, BARRE · 1FR).
- **Fret Notation** (Barlow Condensed 600, 0.875rem, 0.18em tracking): The printed `x 3 2 0 1 0` band on library cards.

### Named Rules
**The Chord Name Rule.** A chord name is set root at full size and quality one step down (0.62em, minimum 0.8rem, weight 600), tight tracking, as chord charts set it. Always use the same component; never type a chord name as plain text in a heading.

**The Condensed-for-Numerals Rule.** Note names, gauges, fret numbers, bpm, cents, scores and finger numbers are Barlow Condensed. Sentences are never Barlow Condensed.

## Layout

A single centred column, max 72rem (1152px), with 16px gutters. Pages open with a title block (headline + one line of ink-soft help) and any page-level control aligned to its baseline on the right, stacking on mobile. Content then sits in white panels with 16px gaps.

The chord library is a fixed-proportion envelope grid: 2 columns on phones, 3 at 640px, 4 at 1024px, 5 at 1280px, 12px gap. Filter chip rows scroll horizontally on mobile, bleeding to the screen edge (hidden scrollbar). Practice and Listen use two-column splits from 1024px (roughly 1.25-1.4fr to 1fr) and collapse to one column, with the instrument panel first.

Navigation switches at 768px: top tabs in the sticky header on desktop; a fixed four-item bottom tab bar (64px tall, safe-area padded) on mobile, with main content padded 112px at the bottom to clear it. The chord detail opens as a right sheet (max 28rem) on desktop and a bottom sheet (max 92dvh, 16px top radius) on mobile.

Spacing rhythm: 6px between chips, 12px for tight groups and grid gaps, 16px between panels, 20px panel padding (24-28px from 640px), 24-40px above page content.

## Elevation & Depth

Depth is paper on a counter: two soft, cool, ink-tinted shadows and nothing else. Every white card and panel rests on the envelope shadow; the lift shadow appears only as a response (hover on a library card, the active string on the tuner). Headers and the bottom bar separate by a rule line and a translucent stock fill, not by shadow.

### Shadow Vocabulary
- **Envelope** (`box-shadow: 0 1px 1px rgb(22 22 22 / 0.04), 0 6px 16px -8px rgb(22 22 22 / 0.18)`): Resting state of every card, panel and mic gate.
- **Lift** (`box-shadow: 0 2px 2px rgb(22 22 22 / 0.05), 0 14px 28px -12px rgb(22 22 22 / 0.28)`): Hovered library card (with a 2px rise) and the tuner string currently being heard (with a 4px rise).

### Named Rules
**The Resting Envelope Rule.** Surfaces carry the envelope shadow at rest and gain lift only as a response to state. There is no third elevation.

## Shapes

Gently rounded paper. Cards are 8px, panels and sheets 11px, buttons, inputs and toggles 6px. Filter chips and the streak badge are full pills; stamps are near-square at 3px so they read as rubber-stamp impressions. Borders are 1px rule-grey on every surface; ink borders mark the locked or current item.

The signature form is the **tear line**: a row of 6px-pitch ink-soft perforation dots between a card's label and its contents, with half-circle notches (14px circles in stock colour, outlined in rule) biting into both card edges, so the card reads as a tearable envelope. Inside panels without notches, the perforation alone separates header from instrument.

Diagram geometry is round: finger dots and barres are ink pills, open strings are rings in the string's colour, muted strings are ink-soft crosses with the string dropped to 30% opacity.

## Components

### Buttons
Plain, filled with ink, confident.
- **Shape:** gently curved (6px).
- **Primary:** ink fill, stock text; 48px tall with 16px text for every action taken with a guitar in hand (Strum, Start, Start listening, Stop).
- **Outline:** stock fill, rule border, ink text, same height; secondary actions beside a primary (Arpeggio, Practice, Save, Skip).
- **Ghost:** icon-only 36px utility (settings, voicing prev/next), stock-shade fill on hover.
- **Hover / Focus:** primary dims to 90% ink; focus is a ring in ink.

### Chips
- **Style:** white pill, 1px rule border, 14px horizontal padding, label type.
- **State:** selected is solid ink with stock text and ink border (`aria-pressed`); hover darkens the border to ink-soft. Root-note chips use condensed note-name type and a 44px minimum width.

### Cards / Containers
- **Library envelope card:** 8px corners, white, rule border, envelope shadow. Top: chord name at 2rem and a voicing stamp; tear line; diagram without string names; printed fret-notation band above a rule; a round 40px play button bottom-right that fills ink on hover. The whole card opens the chord; hover lifts it.
- **Panel:** 11px corners, white, rule border, envelope shadow, 20px padding (24-28px from 640px). Every instrument (detector, drill, tuner meter, progression runner, mic gate) lives in one.

### Inputs / Fields
- **Style:** white fill, input-edge border, 6px corners; search is 44px tall with a leading ink-soft search icon and 16px text.
- **Focus:** ink ring.

### Navigation
- **Desktop:** header tabs, label type with a 16px icon, ink-soft at rest, ink on hover and when current; current tab carries a 3px ink bar on the header's bottom edge.
- **Mobile:** four equal tabs in a fixed bottom bar, 20px icon over 12px label; current tab is ink with a heavier icon stroke and a 3px ink bar at the top edge.
- **Header:** sticky, translucent stock with a bottom rule; brand mark is six vertical strings in ball-end colours at gauge weights beside the wordmark in condensed 700.

### Toggles
Segmented ToggleGroup for modes (One chord / Progression, On the beat / Wait for me, beats per chord, Strum / Arpeggio): on-state is solid ink with stock text, matching chips.

### Chord Diagram (signature)
SVG at a fixed 129-unit width. Fret lines in rule, nut as an ink bar (or a condensed "Nfr" label for higher positions). Strings in their ball-end colour at gauge stroke widths 3.7 / 2.95 / 2.25 / 1.7 / 1.12 / 0.85 from low E to high E. Ink finger dots with stock condensed finger numbers; barres are ink pills. When the chord sounds, each sounded string shimmers horizontally in strum order (1.1s, expo-out, staggered by the actual note onsets).

### Stamps (signature)
- **Voicing stamp:** outlined ink label, 1.5px current-colour border, 3px corners, stamp type. Classifies the voicing; it never introduces a heading.
- **Clean stamp:** the success mark. 3px hit-green border, 4px corners, "CLEAN" in condensed 700 uppercase over the time, rotated -3deg, landing with a 350ms scale-in. Also used to land each countdown number.

### Tuner
Six string cards across the full width, each with its own string line and ball-end dot in the string's colour, the note name and octave in condensed type and the gauge beneath. The meter is a ruled cents scale with a 4px needle in the current string's colour, turning hit green with a check and "In tune" inside 5 cents.

## Do's and Don'ts

### Do:
- **Do** draw every string in its ball-end colour at its gauge weight (3.7 / 2.95 / 2.25 / 1.7 / 1.12 / 0.85, low E to high E), anywhere a string appears.
- **Do** set every chord name, note name and numeral in Barlow Condensed via the chord-name pattern (root full size, quality at 0.62em).
- **Do** put new content in a white envelope panel with a rule border and the envelope shadow, and separate a card's label from its contents with the perforated tear line.
- **Do** show selection as solid ink with stock-coloured text, for chips, toggles, list items and the current progression step alike.
- **Do** pair hit green and miss red with an icon or word every time.
- **Do** keep the string shimmer and stamp-in as the only authored animations, and disable both under `prefers-reduced-motion`.
- **Do** size primary actions at 48px tall when they are used mid-play.

### Don't:
- **Don't** use any string colour on a button, heading, chip, badge, background, chart bar or illustration; the Listen chromagram is ink and ink-soft for that reason.
- **Don't** add a dark theme or a dark neon fretboard; the system is light-only by decision.
- **Don't** fall back to a stock white card grid: a card without a tear line, stamp or printed notation is not an envelope.
- **Don't** add a third shadow or a hard offset shadow; envelope at rest, lift on response, nothing else.
- **Don't** use stamps as eyebrows or section kickers above headings; a stamp classifies a specific chord voicing or marks a result.
- **Don't** introduce a second accent colour for emphasis; emphasis is an ink fill.
