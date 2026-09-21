---
name: soccer-game
description: The user's house style for their soccer/football game - how match "situations" (moments like a cross from the byline, a corner, free kick, penalty, one-on-one, counter-attack, a goal) must LOOK and be composed on screen. Bright top-down slightly-tilted pitch with mowing stripes and chalky lines, chunky big-head players with soft drop shadows, 3D goals with diamond nets, stands + ad boards, a glossy two-team scoreboard pill with the minute in the middle, and a slanted purple caption banner - the look of classic mobile soccer "moments" games in the New Star Soccer tradition. Use this skill whenever the user invokes "SOCCER GAME" / "soccer-game", or asks to build, draw, render, design, add or fix any match situation, pitch, player sprite, goal, scoreboard/HUD, camera, or gameplay screen for their soccer / football / כדורגל game, even if they don't mention the style explicitly. Also use it when they say something like "make it look like my soccer game" or "in the style of the soccer skill".
---

# SOCCER GAME — how situations look in my game

The reference is two portrait mobile screenshots in `references/` — **open both images before designing anything** (`ref-corner-attack.jpg`, `ref-goal-view.jpg`). The target is that look: a *bright, clean, toy-like broadcast view* of a real pitch, where every situation is readable in one glance on a phone.

A working renderer that already reproduces both screenshots is in `references/soccer-render-kit.js`, with `references/demo.html` showing the two reference scenes. **Start from the kit instead of drawing from scratch** — copy it into the project and feed it situation objects. If the project uses another engine (Phaser, Pixi, Unity, React Native Skia, Godot…), port the kit's numbers and rules below; they are what makes it look right.

## The game's core idea: "situations"

The game doesn't show a full 90 minutes. It jumps between **situations** — short, decisive moments where the player acts (pass, cross, shoot, dribble) — and between them the clock jumps (22' → 66'). Every screen you build is one situation. A situation must answer instantly:

1. **Where is the goal?** — always visible or clearly implied at the edge of the frame.
2. **Who am I / where is the ball?** — green control ring under the ball or a yellow arrow over my player.
3. **What can I do?** — a teammate's call bubble, an aim target, a dashed pass/run line.
4. **What's the context?** — scoreboard with both teams, score and minute.

Don't clutter beyond that. No minimap, no stamina bars on the pitch, no floating player names unless asked.

## Camera & framing

- **Portrait, full-bleed pitch.** Grass fills the whole screen; there are no letterbox bars.
- **Top-down with a slight tilt** (ground squashed to ~0.84 vertically; heights go straight up the screen). Not isometric, not side-on, not true 3D perspective.
- **Zoom so ~25–30 m of pitch spans the screen width** (kit: `zoom` 13–15 px/m on a 390 px-wide phone). Players are small but clearly characters.
- **Rotate the camera to the situation.** The goal being attacked sits at the top (rotation 0, reference 2) or on the right (rotation 90, reference 1). Pick whichever makes the action run across the long axis of the screen.
- **Frame the action with the goal near an edge** and the ball in the lower-middle part, leaving space above the scoreboard and below for the caption.
- The camera follows the ball with easing (lerp ~0.08/frame); never snap except on a situation cut.

## Pitch

- Saturated, sunny green: base `#52ab2b` / `#48a125` in alternating **mowing stripes 5.25 m wide**, grass continues past the lines (edge `#3f931f`).
- **Grass grain**: fine noise speckle over everything (light and dark green specks), so it reads as a lawn and not a flat fill.
- **Worn patches**: soft lighter radial blotches in each goal mouth, on the penalty spots and the centre spot.
- **Lines**: crisp near-white (`rgba(255,255,255,.94)`), ~0.16 m thick, real FIFA dimensions (68×105, box 40.32×16.5, six-yard 18.32×5.5, circle r 9.15, penalty spot 11 m, D-arc, corner arcs). Circles become ellipses under the tilt — that's correct.
- **Corner flags**: white pole, small waving red triangle.

## Stadium

- Beyond ~7 m past the lines: **stands packed with a pixel crowd** — tiny rectangles in both teams' colours, white, and skin tones on dark grey steps.
- Between the lines and the crowd: **ad boards** — a run of alternating red/navy panels with white bold italic condensed text. Use the user's game name / fictional sponsors, never real brands.

## Goals

- White posts and crossbar with a thin dark shadow underneath, drawn in pseudo-3D (posts rise up the screen).
- **Diamond-mesh white net** (semi-transparent) on back, roof and sides, plus a soft shadow on the grass.
- On a goal: the net ripples (`netRipple`) and the ball stays in the net.

## Players

The heart of the look — **chunky, big-head, toy-like figures**, not realistic, not stick men, not circles/tokens.

- Size is exaggerated to about **1.45× real height**, so a player is ~40 px tall on a phone.
- Proportions from feet up: dark boots → socks (kit colour) → bare knees → shorts → a wide rounded torso → **big round head (radius ~13% of height)** with a hair cap.
- **Flat, saturated kit colours** with a soft top-left light gradient on the shirt and a thin dark outline. Contrasting collar/trim.
- **Each team is instantly distinct**: red, blue/white, yellow/white, and so on. The **goalkeeper wears a different colour** (light green by default).
- Mixed skin tones and hair colours, seeded so they stay stable between frames.
- **Soft drop shadow**, an ellipse offset down-right. Every object on the pitch has one; that's what makes the scene feel lit by sun.
- Poses: `idle` (tiny breathing bob), `jog`, `run` (leg/arm swing), `keeper` (arms out, gloves), `celebrate` (arms up).
- Everything is depth-sorted by screen y.

## Ball

A small white ball with black pentagons, a round shadow that separates from it and grows fainter when it's in the air (`z`), and spin while it moves. It stays small, about the size of a player's head.

## Indicators (the only UI allowed on the grass)

| Marker | Look | Meaning |
|---|---|---|
| `control` | green translucent disc + ring under the ball, gently pulsing | the ball is yours, act now |
| `target` | faint yellow double ring | aim point for a shot or cross |
| `pass` | dashed white line with an arrowhead, marching | suggested pass |
| `run` | dashed yellow line | suggested run |
| `call: true` on a player | white rounded speech bubble with a ball icon, popping | teammate calling for the ball |
| `marker: true` on a player | bouncing yellow down-arrow above the head | "this is you" |

## HUD

- **Scoreboard pill, top centre**, about 64% of the width: `[stripe][HOME ABBR  score] [minute'] [score  AWAY ABBR][stripe]`.
  - Each team panel is a glossy gradient of its shirt colour with a secondary-colour stripe on the outer edge.
  - The minute sits in a raised silver box that overhangs the bar, e.g. `22'`.
  - Black 2 px outline and a hard drop shadow.
  - Team names are **abbreviated, uppercase, max ~6 chars** (`EAST B`, `OX CTY`, `B'TREE`).
- **Typography**: bold condensed sans (Oswald 700; fallback Arial Narrow), **slanted ~10° italic**, white with a dark outline. Use the same font everywhere: HUD, banners, boards.
- **Caption banner** for moment titles ("GOAL!", "FREE KICK", "LAST MINUTE!", tutorial hints):
  - A full-width band tilted −2.5° with lavender-to-indigo gradient fill `#7b7fd0 → #5a5eb4`.
  - Framed by black / white / black rails.
  - Big white slanted text with a thick black outline.
  - It slides in from the right with ease-out.
- Buttons and menus outside the pitch use glossy lime-green panels on dark carbon-hex backgrounds; the edges of the screenshots show this.

## Situation schema (what the kit renders)

```js
{
  type: 'cross' | 'corner' | 'freekick' | 'penalty' | 'oneOnOne' | 'counter' | 'buildup' | 'goal',
  minute: 22,
  home: { abbr: 'EAST B', score: 0, kit: SoccerKit.KITS.red,  gkKit?: {...} },
  away: { abbr: 'OX CTY', score: 1, kit: SoccerKit.KITS.blue },
  camera: { x: 36, y: 11, zoom: 14, rotation: 90, tilt?: 0.84 },  // metres; y=0 = top goal line
  ball:   { x: 57, y: 8, z: 0, spin?: 0 },
  players: [ { team: 'home'|'away', x, y, role?: 'gk', pose?: 'idle'|'jog'|'run'|'keeper'|'celebrate',
               facing?: 'left'|'right', call?: true, marker?: true, skin?, hair? } ],
  markers: [ { type: 'control'|'target', at: [x, y], r? } | { type: 'pass'|'run', from: [x,y], to: [x,y] } ],
  caption?: 'GOAL!',  captionAppear?: 0..1,
  netRipple?: { top?: 0.3, bottom?: 0.3 },
  boards?: ['MY GAME', 'SPONSOR', ...]
}
```

Kits look like this: `{ shirt, shorts, socks, trim, stripe, pattern?: 'stripes' }`. Presets are `red`, `blue`, `yellow`, `white`, `green`, `black`, `keeper`.

## Composing each situation type

Coordinates are in metres, attacking the top goal (y = 0).

- **Cross from the byline** (reference 1):
  - Ball in the channel at about `(57, 8)` under a `control` ring.
  - 4–5 defenders spread through the box, keeper on his line.
  - 1–2 teammates arriving at the edge of the box, one with `call: true`.
  - Use rotation 90 so the goal is on the right.
- **Counter / through ball** (reference 2):
  - Goal at the top, stands visible, keeper off his line.
  - My player on the run lower-left with `marker`, and a `pass` line to a yellow `target` in the box.
  - A defensive line of 4 higher up the pitch.
- **Corner**:
  - Camera near the corner flag.
  - Ball on the corner arc with `control`.
  - 6–8 bodies packed in the six-yard and penalty box, attackers and markers in pairs.
  - A `target` on the penalty spot area.
- **Free kick**:
  - Ball about 20–25 m out.
  - A wall of 3–5 defenders 9.15 m away, side by side.
  - Keeper shading to one post, and a `target` in the far top corner area.
- **Penalty**:
  - Tight zoom (18–20) and rotation 0.
  - Ball on the spot, keeper `keeper` pose on the line, taker 2–3 m behind.
  - Everyone else outside the box and D.
- **One-on-one**:
  - Only the keeper between you and the goal, and a defender chasing 3–5 m behind.
  - `target` at a post.
- **Goal!**:
  - Ball inside the net, `netRipple` set, scorer in `celebrate`.
  - Caption "GOAL!" slides in and the score updates.

Rules for all of them:

- Keep 8–12 players on screen. Show only the ones relevant to the moment, placed tactically believable, never overlapping.
- Scores and minutes always progress sensibly between situations.

## Motion & juice

- Idle players breathe, and running players have a leg/arm cycle.
- The ball travels on a parabolic `z` arc for crosses/lobs and rolls flat for passes.
- Camera eases.
- On a goal: net ripple, the caption slides in, a small screen shake (≤4 px, 200 ms), and the scoreboard number pops (scale 1.3 → 1).
- Between situations: a quick fade or wipe with the new minute.

## Don'ts

- No dark/neon/"premium dark" pitch: this style is **daylight, saturated, friendly**.
- No realistic 3D models, stick figures, or coloured-circle tokens for players.
- No true perspective: keep the slight top-down tilt.
- No thin/serif/rounded fonts: condensed bold slanted only.
- Don't hide the goal or the ball's owner; every frame must be readable at phone size.
- Don't copy real brands or team names from the reference (New Star Soccer, PocketGamer). Use the user's own names.

## Using the kit

```html
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&display=swap" rel="stylesheet">
<canvas id="pitch" style="width:100vw;height:100dvh"></canvas>
<script src="soccer-render-kit.js"></script>
<script>
  const r = SoccerKit.createRenderer(document.getElementById('pitch'));
  const t0 = performance.now();
  (function loop(now){ r.render(situation, (now - t0) / 1000); requestAnimationFrame(loop); })(t0);
</script>
```

- The kit is DPR-aware and caches crowd/noise layers per kit pair.
- Mutate `situation` (positions, `ball`, `camera`) each frame to animate.
- Wait for `document.fonts.ready` before the first frame so the HUD uses Oswald.
- After building a situation, **look at a screenshot next to the reference images** and fix whatever drifts from them.
- Other exports for close-ups and minigames drawn in the same style:
  - `SoccerKit.drawFigure(ctx, x, y, heightPx, kit, look, {pose, facing, lean, seed, marker}, t)` draws a player with feet at (x, y).
  - `drawBallIcon`, `makeNoisePattern`, `normKit` (turns `{shirt, shorts}` into a full kit), `FONT` and `rng`.
- `camera.screenY` (0..1, default 0.5) sets where the camera centre sits on screen. Use it to lift the action above a bottom panel.
- Hebrew text: `FONT` falls back to Rubik, and captions switch the canvas to `direction='rtl'` automatically. Latin board and HUD text is forced to LTR so a `dir="rtl"` page doesn't mirror "GOAL!" into "!GOAL".

## The player's own look (customisable)

The user's player is customisable: hair style, hair colour, skin tone and boot colour are free and can be changed at any time (on the create screen and in-game). Accessories are bought in the shop and worn on top. The look is cosmetic only.

- **Look object** (what `drawFigure`, `drawHead` and `drawBust` take as `look`): `{ skin, style, hair, boot, acc }`.
  - `style` is one of: `short`, `buzz`, `bald`, `curly`, `afro`, `mohawk`, `long`, `ponytail`, `bun`, `dreads`. Other players get a stable random style.
  - `acc` maps each worn accessory to its colour, or to `true` if it has none.
- **Accessories**: `headband` (tint), `sunglasses`, `earring`, `diamond` (sparkles), `chain`, `wristbands` (tint), `gloves` (tint), `captain` (armband, tint), `thermal` (long sleeves, tint). One item per slot at a time.
- **Boot colour** is a look colour. The game's `BOOTS` (with stat boosts) are a separate thing.
- **Arms** hang outward from the shoulders. This matters: wristbands, gloves and the armband would be hidden behind the torso otherwise.
- **Faces** are drawn only when the head radius is 9 px or more (previews and close-ups). Sprites on the pitch are faceless.
- **`drawBust`** draws head and shoulders, used for the dashboard avatar.
- **Shaved styles** (buzz, mohawk sides) blend the skin and hair colours as solid fills. Don't use alpha: bright hair colours would tint the whole head.

## In the user's game (Star Striker)

- The repo is `github.com/Ld2000king/soccer-game`, a Hebrew RTL PWA.
- The kit lives in `js/pitch.js`. `js/situation.js` builds a situation for each key moment (`shoot`, `pass`, `dribble`, `defend`, `save`; a `pass` for a keeper is a build-up from the back) and plays the outcome.
- `js/match.js` then drives the flow:
  1. The pitch intro with the caption plays for 1.4 s.
  2. The minigame panel slides up (`#minigame-overlay.on-pitch`).
  3. The result plays out on the pitch.
  4. The game returns to the text log.
- Kits come from `matchKits()` in `js/crest.js` (the real club colours). Keepers get `keeperKitFor()`.
- The look data lives in `js/data.js` (`HAIR_STYLES`, `SKIN_TONES`, `HAIR_COLORS`, `BOOT_COLORS`, `TINT_COLORS`, `ACCESSORIES`, `defaultLook`, `resolveLook`).
- Save state is `player.look` and `player.accOwned`. Old saves are migrated in `Career`.
- The `Career` methods are `playerLook()`, `setLook()`, `buyAccessory()`, `wearAccessory()` and `setAccessoryTint()`.
- The editor, preview and accessory cards are in `js/look.js`. It is used by the create screen, the "מראה" screen (opened from the dashboard avatar or the hub) and the shop's accessories tab.
- The hero in situations and minigames gets `Career.playerLook()`.
- **The pitch replays the player's choice.** Whatever the minigame decided must be what the big pitch shows.
  - `AimShootout` and `DribbleChallenge` pass a `detail` to their callback: the shot and dive zones, or the lane taken and the lane the defender read.
  - `SituationView.playOutcome(type, success, detail)` uses it. Left is left, right is right, high is high, and the keeper dives where he dived.
  - The pitch camera and the aim canvas both look at the goal from behind the ball, so a zone's column is its screen side.
  - Never pick a random side in an outcome when a choice exists.
  - Don't pre-place an aim target on the pitch; it reads as a hint for a fixed side. The target ring appears on the chosen spot.
- **Moment types and who gets them** (`MatchController.weightsForPosition`):
  - `shoot`, `pass`, `dribble`, `defend`, `save`.
  - `penalty`: you shoot it as FWD or MID, and face it as GK. It is the aim minigame with the penalty layout, and the taker runs up before the strike.
  - `freekick`: aim minigame with a wall of four, and it is the same for FWD, MID and GK. The wall's low centre is always blocked. The low corners can hit the wall or bend round it. The top row goes over it. The replay shows the ball curling round or clearing the wall, or stopping on it (`detail.blocked`).
  - `corner`: FWD and MID take it with the `CornerPick` minigame in `js/corner.js`. The player picks near post, penalty spot or far post. The defence covers one zone, and an uncovered delivery still has to be headed in. DEF and GK defend it with the timing bar.
- **Corner geometry:**
  - The pitch view and the panel draw the same box, the same players and the same side (`sit.cornerSide`, `sit.cornerTargets`). Near post is on the taker's side.
  - The camera needs both posts and the taker in frame (zoom about 9). Put the camera far enough down the pitch that the stands fill the space behind the goal.
- **Layout gotchas:**
  - Keep the taker at least 2 m from the ball and off to one side. A taker standing directly behind the ball hides it.
  - `add(..., {exact:true})` skips the random jitter. Use it for walls and for anyone placed relative to the ball.
- New moment types go in `buildSituation` and `playOutcome`. Keep the moment readable above the panel; `liftForPanel` frames the ball and goal between the scoreboard and the top of the panel.
