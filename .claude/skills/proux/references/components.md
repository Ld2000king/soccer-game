# proux — component recipes

Copy-paste CSS for every component in the system. All of it assumes the token
block from `SKILL.md` is already in scope. Values are sampled from the real
interface, so prefer adjusting these over inventing new ones.

## Contents

- [Page shell and backdrop](#page-shell-and-backdrop)
- [Ambient motion](#ambient-motion)
- [Buttons](#buttons)
- [Panels and cards](#panels-and-cards)
- [Selectable rows](#selectable-rows)
- [Segmented tabs](#segmented-tabs)
- [Stat strip](#stat-strip)
- [Digit counter](#digit-counter)
- [Chips and badges](#chips-and-badges)
- [Wordmark](#wordmark)
- [Headlines](#headlines)

## Page shell and backdrop

The backdrop is doing the heaviest lifting in this system: a dark photograph,
pushed back far enough to become atmosphere.

```css
body{
  margin:0;
  background:var(--px-bg);
  color:var(--px-text);
  font-family:'Rubik','Heebo',system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;
}

.px-shell{
  position:relative;
  min-height:100dvh;
  isolation:isolate;
  padding:20px;
}

/* the photograph */
.px-shell::before{
  content:"";
  position:fixed; inset:0; z-index:-2;
  background:url("stadium-night.jpg") center/cover no-repeat;
  filter:saturate(.75) brightness(.55);
}

/* the overlay that turns a photo into atmosphere */
.px-shell::after{
  content:"";
  position:fixed; inset:0; z-index:-1;
  background:
    radial-gradient(120% 70% at 50% 0%, rgba(74,168,240,.16), transparent 60%),
    linear-gradient(180deg, rgba(3,6,11,.80) 0%, rgba(3,6,11,.92) 55%, var(--px-bg) 100%);
}
```

No photograph available? Build the depth synthetically — still not a flat fill:

```css
.px-shell::before{
  background:
    radial-gradient(90% 55% at 50% -5%,  rgba(74,168,240,.22), transparent 62%),
    radial-gradient(70% 45% at 12% 108%, rgba(11,79,144,.30), transparent 60%),
    radial-gradient(60% 40% at 88% 12%,  rgba(124,200,248,.10), transparent 55%),
    linear-gradient(180deg,#05080f,#020409);
  filter:none;
}
```

## Ambient motion

Rising bokeh — the single most recognisable movement in the system. Vary size,
duration and delay per element or it reads as a machine.

```css
.px-bokeh{position:fixed; inset:0; z-index:-1; overflow:hidden; pointer-events:none;}
.px-bokeh i{
  position:absolute; bottom:-80px;
  width:var(--s,26px); height:var(--s,26px);
  border-radius:50%;
  background:radial-gradient(circle at 35% 35%, rgba(124,200,248,.55), rgba(74,168,240,.14) 70%, transparent);
  animation:px-rise var(--d,14s) linear infinite;
  animation-delay:var(--delay,0s);
}
@keyframes px-rise{
  0%{transform:translateY(0) scale(.9); opacity:0;}
  12%{opacity:.7;}
  88%{opacity:.5;}
  100%{transform:translateY(-115dvh) scale(1.1); opacity:0;}
}
```

```html
<div class="px-bokeh" aria-hidden="true">
  <i style="left:8%;  --s:22px; --d:16s; --delay:0s"></i>
  <i style="left:22%; --s:38px; --d:21s; --delay:3s"></i>
  <i style="left:41%; --s:16px; --d:13s; --delay:6s"></i>
  <i style="left:63%; --s:30px; --d:18s; --delay:1.5s"></i>
  <i style="left:79%; --s:20px; --d:24s; --delay:8s"></i>
  <i style="left:92%; --s:34px; --d:19s; --delay:4.5s"></i>
</div>
```

Glow breathing, for whatever should be touched next:

```css
@keyframes px-breathe{
  0%,100%{box-shadow:0 0 12px rgba(74,168,240,.30), inset 0 0 0 1px rgba(74,168,240,.55);}
  50%    {box-shadow:0 0 26px rgba(74,168,240,.60), inset 0 0 0 1px rgba(124,200,248,.85);}
}
.px-breathe{animation:px-breathe 2.6s ease-in-out infinite;}

@media (prefers-reduced-motion:reduce){
  .px-bokeh, .px-breathe{animation:none;}
}
```

## Buttons

### Primary — the one crimson action

The gradient runs bright at the top to nearly black at the bottom, which is what
makes it read as a lit physical object rather than a colored rectangle.

```css
.px-btn{
  display:flex; align-items:center; justify-content:center; gap:10px;
  width:100%; padding:16px 20px;
  border-radius:var(--px-r);
  font:800 17px/1 'Rubik',system-ui,sans-serif;
  color:var(--px-text); text-align:center; cursor:pointer;
  border:1px solid transparent;
  transition:transform .18s cubic-bezier(.2,.8,.3,1),
             box-shadow .18s cubic-bezier(.2,.8,.3,1),
             filter .18s;
}
.px-btn:active{transform:scale(.985);}

.px-btn--primary{
  background:linear-gradient(180deg, var(--px-red-hi) 0%, #4d0017 45%, var(--px-red-lo) 100%);
  border-color:var(--px-red-rim);
  box-shadow:var(--px-glow-red), inset 0 1px 0 rgba(255,120,150,.35);
}
.px-btn--primary:hover{filter:brightness(1.12); box-shadow:0 0 30px rgba(168,32,63,.65);}
```

### Secondary — blue rim with a top light sweep

```css
.px-btn--ghost{
  background:linear-gradient(180deg, rgba(11,79,144,.30), rgba(5,17,33,.55));
  border-color:var(--px-rim);
  box-shadow:var(--px-glow-blue), inset 0 0 20px rgba(11,79,144,.25);
  position:relative; overflow:hidden;
}
/* the bright highlight riding the top edge */
.px-btn--ghost::before{
  content:""; position:absolute; inset-inline:12%; top:0; height:2px;
  background:linear-gradient(90deg, transparent, var(--px-rim-hot), transparent);
  opacity:.9;
}
.px-btn--ghost:hover{box-shadow:0 0 26px rgba(74,168,240,.6), inset 0 0 24px rgba(11,79,144,.35);}
```

```html
<button class="px-btn px-btn--primary">ממשיכים את העונה <span aria-hidden="true">‹</span></button>
<button class="px-btn px-btn--ghost"><span aria-hidden="true">»</span> לדראפט <span aria-hidden="true">«</span></button>
```

## Panels and cards

```css
.px-panel{
  background:linear-gradient(180deg, rgba(10,20,36,.85), rgba(7,17,29,.9));
  border:1px solid var(--px-line);
  border-radius:var(--px-r-lg);
  padding:16px 18px;
  backdrop-filter:blur(6px);
}
/* raise it when it matters */
.px-panel--lit{
  border-color:rgba(74,168,240,.55);
  box-shadow:var(--px-glow-blue);
}
```

## Selectable rows

The lime check badge is what sells the selected state — a coloured border alone
reads as hover, not choice.

Order matters: the badge sits at the **reading-start** edge (right in RTL, left
in LTR) where the eye lands first, and the thumbnail anchors the **reading-end**
edge. Put them in the DOM in that order and flexbox handles both directions.

```css
.px-row{
  display:flex; align-items:center; gap:14px;
  padding:12px 14px; margin-bottom:12px;
  background:var(--px-bg-2);
  border:1px solid var(--px-line);
  border-radius:var(--px-r);
  cursor:pointer;
  transition:border-color .2s, background .2s, box-shadow .2s;
}
.px-row:hover{border-color:rgba(74,168,240,.45);}

.px-row[aria-selected="true"]{
  background:var(--px-panel-sel);
  border-color:var(--px-rim);
  box-shadow:var(--px-glow-blue);
}
.px-row__thumb{width:74px; height:92px; border-radius:10px; object-fit:cover; flex-shrink:0; order:3;}
.px-row__body{flex:1; min-width:0; order:2; text-align:start;}
.px-row__title{font:800 19px/1.2 'Rubik',sans-serif;}
.px-row__sub{font:500 13px/1.4 'Rubik',sans-serif; color:var(--px-text-dim); margin-top:3px;}

.px-row__check{
  order:1;
  width:36px; height:36px; border-radius:50%; flex-shrink:0;
  display:grid; place-items:center;
  background:var(--px-lime); color:#0d1400; font-size:19px; font-weight:900;
  box-shadow:var(--px-glow-lime);
  opacity:0; transform:scale(.6);
  transition:opacity .2s, transform .2s cubic-bezier(.2,1.7,.4,1);
}
.px-row[aria-selected="true"] .px-row__check{opacity:1; transform:scale(1);}
```

## Segmented tabs

```css
.px-tabs{
  display:flex;
  background:var(--px-bg-2);
  border:1px solid rgba(74,168,240,.4);
  border-radius:var(--px-r);
  overflow:hidden;
}
.px-tab{
  flex:1; padding:12px 6px 10px;
  display:flex; flex-direction:column; align-items:center; gap:6px;
  background:none; border:0; cursor:pointer;
  color:var(--px-text-dim); font:700 13px/1 'Rubik',sans-serif;
  border-inline-end:1px solid var(--px-line);
  transition:background .2s, color .2s;
}
.px-tab:last-child{border-inline-end:0;}
.px-tab img,.px-tab svg{width:30px; height:30px; opacity:.65;}

.px-tab[aria-selected="true"]{background:#1d2a21; color:var(--px-text);}
.px-tab[aria-selected="true"] img,
.px-tab[aria-selected="true"] svg{opacity:1;}

/* the lime underline is the whole signal — keep it chunky */
.px-tab__mark{width:34px; height:4px; border-radius:3px; background:#33455c;}
.px-tab[aria-selected="true"] .px-tab__mark{
  background:var(--px-lime);
  box-shadow:var(--px-glow-lime);
}
```

## Stat strip

```css
.px-stats{
  display:flex;
  border:1px solid rgba(74,168,240,.35);
  border-radius:var(--px-r);
  background:rgba(7,17,29,.7);
  overflow:hidden;
}
.px-stat{
  flex:1; padding:14px 8px; text-align:center;
  border-inline-end:1px solid var(--px-line);
}
.px-stat:last-child{border-inline-end:0;}
.px-stat__num{font:800 26px/1 'Rubik',sans-serif; color:var(--px-info);}
.px-stat__label{font:500 12px/1 'Rubik',sans-serif; color:var(--px-text-dim); margin-top:6px;}
/* an unknown value is an em-dash, never a zero — zero is a real score */
.px-stat__num--empty{color:var(--px-text-dim);}
```

## Digit counter

A number is a number in any language — force LTR on the container or an RTL
page will render your 654 as 456, which is the kind of bug that ships.

```css
.px-digits{display:flex; gap:6px; justify-content:center; direction:ltr;}
.px-digit{
  width:44px; height:58px; border-radius:8px;
  display:grid; place-items:center;
  background:rgba(5,14,26,.9);
  border:1px solid var(--px-line);
  font:900 30px/1 'Rubik',sans-serif;
  color:#33455c;
}
.px-digit--on{
  color:var(--px-lime);
  border-color:rgba(74,168,240,.6);
  box-shadow:0 0 12px rgba(74,168,240,.3), inset 0 0 10px rgba(194,255,64,.08);
}
```

## Chips and badges

```css
.px-chip{
  display:inline-flex; align-items:center; gap:8px;
  padding:7px 14px 7px 8px;
  border-radius:var(--px-r-pill);
  background:linear-gradient(180deg, rgba(11,79,144,.35), rgba(5,17,33,.6));
  border:1px solid rgba(74,168,240,.55);
  box-shadow:0 0 12px rgba(74,168,240,.3);
  font:700 13px/1 'Rubik',sans-serif; color:var(--px-text);
  text-decoration:none;
}
.px-chip__icon{
  width:24px; height:24px; border-radius:50%;
  display:grid; place-items:center;
  background:rgba(74,168,240,.2);
}

/* small counter pill, e.g. "1/11" */
.px-pill{
  padding:4px 12px; border-radius:var(--px-r-pill);
  border:1px solid rgba(74,168,240,.6);
  font:700 13px/1 'Rubik',sans-serif; color:var(--px-text-dim);
}
```

## Wordmark

Chrome with a blue halo — the single most branded element on the page.

```css
.px-wordmark{
  font:900 clamp(34px,9vw,52px)/1 'Rubik',sans-serif;
  letter-spacing:.5px;
  background:linear-gradient(180deg,#ffffff 0%,#cfe4f7 42%,#7fa9cd 58%,#ffffff 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent;
  filter:drop-shadow(0 2px 0 #0a1424) drop-shadow(0 0 22px rgba(74,168,240,.65));
}
```

## Headlines

The last line in a different colour is a recurring move — it stops a three-line
headline from reading as a wall.

```css
.px-display{
  font:900 clamp(28px,8vw,38px)/1.12 'Rubik',sans-serif;
  text-align:center; margin:0 0 18px;
  text-shadow:0 4px 22px rgba(0,0,0,.6);
}
.px-display em{font-style:normal; color:#8fc6f2;}   /* the accent line */
.px-display--win{color:var(--px-lime); text-shadow:0 0 24px rgba(194,255,64,.45);}

.px-sub{
  font:500 15px/1.5 'Rubik',sans-serif;
  color:var(--px-text-dim); text-align:center;
}
```
