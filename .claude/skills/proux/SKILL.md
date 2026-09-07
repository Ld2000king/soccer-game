---
name: proux
description: 'Apply the "proux" visual design system — a dark broadcast-grade sports UI: near-black navy depth over photographic arena backdrops, glass panels outlined in neon blue rim-light, electric lime for active and success states, and exactly one crimson primary action per screen. Use this skill whenever the user invokes /proux, or asks for design, UI, UX, a screen, page, dashboard, app interface, landing page, mockup or component styling and says "in that style", "like the site I showed you", "our style", "proux style", or names the design system. The whole point is that the user should never have to re-describe the style — if they say proux, load this and design from it.'
---

# proux — dark broadcast sports UI

## The look in one sentence

A televised sports broadcast graphics package rendered as an interface: you are
standing in a dark stadium tunnel, and the UI is lit from within — glass panels
edged in neon blue rim-light, electric lime marking whatever is live, and one
crimson button telling you the only thing that matters right now.

Reference frames of the real system are in `assets/` (`ref-home.jpg`,
`ref-draft.jpg`, `ref-pitch.jpg`, `ref-list.jpg`). **Look at them before you
design** — the token list below tells you the values, but the images tell you
the feeling, and the gap between those two is where most "close but wrong"
attempts land.

## The six rules that make it read as this system

Everything else is detail. If a design follows these, it belongs; if it breaks
one, it reads as generic dark mode.

**1. Depth, never flat.** The page never sits on a flat color. It sits on a
dark photographic environment — a stadium at night, a tunnel, a pitch from
above — pushed back with a heavy dark overlay (75–90% black) so it reads as
atmosphere rather than as a picture. No usable backdrop available? Build one
from layered radial gradients plus a faint noise or dot texture. The point is
that the background has *somewhere to be*, and content floats in front of it.

**2. Rim light, not fills.** Interactive surfaces are defined by their glowing
edge, not by a solid background. A panel is dark and nearly transparent with a
1px blue border and an outer glow; that border is what says "this is a thing you
can touch." Filling shapes with solid mid-tone color is the fastest way to kill
this aesthetic.

**3. One red per screen.** Crimson is reserved for the single most important
action — continue, enter, start. Everything else that is clickable uses the
blue rim treatment. Two red buttons on one screen and the hierarchy collapses.

**4. Lime is state, never surface.** `#c2ff40` marks what is live, selected,
achieved or counting: the active tab's underline, the step dots, a success
headline, the check badge on a chosen row, the digits currently ticking. Never
use it as a panel background or body text. Its power comes from covering maybe
2% of the screen.

**5. Type is heavy and tight.** Headlines are 800–900 weight with leading around
1.1 — they should feel stamped, like a scoreboard. Body and labels drop to a
calm blue-grey so the headline keeps all the contrast. In Hebrew use Rubik or
Heebo at 700–900; in Latin any grotesque with a real black weight works.

**6. The screen is alive.** Something is always moving, slowly, in the
background: bokeh particles drifting upward, confetti after a win, a glow that
breathes, a light sweep crossing a border. It is ambient and never competes with
content — but a completely static screen in this system looks broken.

## Tokens

Sampled from the real interface — use these values rather than approximating.

```css
:root{
  /* depth: base → raised → selected */
  --px-bg:        #03060b;  /* page floor, under the backdrop overlay */
  --px-bg-2:      #07111d;  /* resting card / row fill */
  --px-panel:     #0a1424;  /* panel fill over a backdrop */
  --px-panel-sel: #0a1e3f;  /* selected / active row fill */
  --px-line:      #16283f;  /* quiet divider, resting border */

  /* the blue that lights everything */
  --px-rim:       #4aa8f0;  /* neon rim border */
  --px-rim-hot:   #7cc8f8;  /* brightest edge highlight / top sweep */
  --px-blue:      #0b4f90;  /* structural blue, deeper borders */
  --px-info:      #5090c8;  /* stat numbers, links, cyan-tinted headline */

  /* state */
  --px-lime:      #c2ff40;  /* live / selected / success — sparingly */

  /* the one action */
  --px-red-hi:    #7d0a2b;  /* CTA gradient top */
  --px-red-lo:    #2a000d;  /* CTA gradient bottom */
  --px-red-rim:   #a8203f;  /* CTA border */

  --px-text:      #ffffff;
  --px-text-dim:  #9fb6cc;

  --px-r-sm: 10px;  --px-r: 14px;  --px-r-lg: 20px;  --px-r-pill: 999px;

  --px-glow-blue: 0 0 18px rgba(74,168,240,.45);
  --px-glow-red:  0 0 22px rgba(168,32,63,.50);
  --px-glow-lime: 0 0 14px rgba(194,255,64,.50);
}
```

**Type scale** (mobile-first): display 34px/900, headline 26px/800, title
18px/700, body 15px/500, label 12px/700 uppercase-ish, micro 11px. Leading 1.1
on display and headline, 1.5 on body.

**Spacing**: 4px base; panels get 14–18px inner padding, 10–12px between
stacked rows, 20px page gutters, 24–32px between sections.

## Components

Full copy-paste CSS for every component is in `references/components.md` — read
it when you're writing the actual styles. The shapes to know:

- **Primary CTA** — full-width, vertical crimson gradient (bright at top, near
  black at bottom), crimson border, red outer glow, white 800 text, a chevron
  pointing the way the reader is going. One per screen.
- **Secondary CTA** — same size, near-transparent dark fill, bright blue border,
  blue glow, plus a light sweep highlight across the top edge. White text,
  chevrons on both sides for the "enter" flavour.
- **Panel / card** — dark fill, 1px `--px-line` border, radius 14–20px. Raise it
  to a blue rim border when it becomes interactive or important.
- **Selectable row** — resting: `--px-bg-2` with a quiet border. Selected:
  `--px-panel-sel` fill, `--px-rim` border with glow, and a **lime circular
  check badge** popping in at the reading-start edge. Title 700 white, subtitle
  dim, thumbnail anchoring the reading-end edge.
- **Segmented tabs** — one panel split by thin dividers, icon over label.
  Active segment gets a slightly warmer fill and a **thick lime underline**;
  inactive ones get a short grey dash. Never move the panel itself.
- **Stat strip** — one bordered row split into equal columns by 1px dividers.
  Big `--px-info` number over a small dim label. Missing values are an em-dash,
  not a zero.
- **Digit / counter boxes** — individual dark boxes per digit, radius 8px.
  Leading zeros stay grey and quiet; the significant digits are lime with a
  faint blue-rimmed box. Reads as a stadium scoreboard.
- **Chip** — pill, dark fill, blue rim, tiny round icon at the leading edge.
  Used for footer links and metadata.

## Motion

Timing: 180–240ms for state changes with `cubic-bezier(.2,.8,.3,1)`; 2–6s for
ambient loops; 400–700ms for celebratory pops with a slight overshoot
(`cubic-bezier(.2,1.7,.4,1)`).

The signature moves, in rough order of how much they define the system:

1. **Rising bokeh** — 10–20 translucent cyan circles of varied size drifting
   slowly upward across the backdrop, each with its own duration and delay.
2. **Glow breathing** — a border's glow radius easing up and down on a 2–3s
   loop, used on whatever the user should touch next.
3. **Light sweep** — a bright short gradient travelling once across a border or
   through a headline, on entry or on a win.
4. **Confetti burst** — on completion or reward, falling from the top edge.
5. **Count-up** — numbers animate to their value rather than appearing; digit
   boxes flip.

Respect `prefers-reduced-motion`: keep the state transitions, drop the ambient
loops.

## Layout

Mobile-first, single column, content centered with 20px gutters, actions
full-width and stacked. The vertical rhythm on a landing screen runs: wordmark →
live counter → headline → stat strip → primary CTA → secondary CTA → icon nav
row → footer chips. Sections are separated by space, not by rules.

**RTL is the default.** The source system is Hebrew. Use logical CSS properties
(`padding-inline`, `margin-inline-start`, `inset-inline`) so a layout works in
both directions, put `dir="rtl"` on the root for Hebrew content, and mirror
chevrons to point the way reading travels.

Three things bite every time in RTL, so handle them up front — the first two
did on the very first real screen built with this skill, both invisible until
rendered: **numbers must not mirror** — put `direction:ltr` on any digit
sequence, score or counter, or 654 renders as 456; **a Latin wordmark laid out
per-letter in spans must not mirror either** — the same `direction:ltr` on the
flex row, or "STAR" spelled as individual `<span>S</span><span>T</span>...`
renders "RATS" because the flex row reverses under `dir="rtl"`; any run of
Latin characters split into flex/grid items needs this, not just digits. And
in a row, the **state badge belongs at the reading-start edge** with the
thumbnail at the reading-end edge, which means DOM order
badge → text → thumbnail rather than the LTR habit of image first.

## Iconography and art

Flat line icons look thin and wrong here. This system uses **small rendered 3D
objects** — a gold trophy on a plinth, a pair of jerseys, a fanned stack of
cards — sitting directly on the background with a label beneath. When real 3D
art isn't available, reach for a chunky filled glyph with a gradient and a drop
shadow before you reach for a 1.5px stroke icon. Wordmarks get the chrome
treatment: metallic vertical gradient, dark bevel, blue outer glow.

## Applying this outside a plain web page

The tokens carry over unchanged. In React/Tailwind, put the palette in the
theme and build the same components; in an artifact or single HTML file, drop
the `:root` block in and go. What must not change across mediums: the six rules.
A "proux" React dashboard is still one red button, still lime-for-state, still
rim-lit panels on a photographic dark ground.

## Retrofitting onto an existing design system

Restyling one screen inside an app that already has its own `.btn-primary` (or
equivalent) is the common case, and it hides a specific trap: that existing
class almost certainly sets a `color` chosen for ITS OWN background — often a
dark near-black text meant to sit on a light accent fill. Layer the crimson
gradient on top via a scoped override and that old dark text is still there,
now nearly invisible on dark red. Whenever you reuse a shared button/card
class rather than writing `.px-btn` from scratch, explicitly set `color` (and
re-check any other property the shared class already owns — border, shadow)
in the same override, and view-source or grep the base rule first rather than
assuming it was neutral.

## Before you call it done

- Is there exactly one crimson action on the screen?
- Does the background have depth — a photograph or layered gradients, not a flat fill?
- Are the interactive surfaces defined by glowing borders rather than solid fills?
- Is lime confined to state, covering a tiny fraction of the screen?
- Are the headlines heavy enough (800–900) and tight enough (~1.1)?
- Is something moving gently in the background?
- Does it survive at 390px wide, and does it mirror correctly in RTL?
- Squint at it next to `assets/ref-home.jpg` — same family, or merely dark?
