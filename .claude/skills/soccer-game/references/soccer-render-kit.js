/* soccer-render-kit.js — reference renderer for the SOCCER GAME look.
 * Canvas 2D, no dependencies. Draws a full "situation" (moment) frame:
 * striped chalky pitch, stands + ad boards, 3D-ish goals with diamond net,
 * chunky big-head players with drop shadows, ball, indicators, scoreboard HUD
 * and slanted caption banner.
 *
 * World units are METRES. Pitch is 68 (x, width) by 105 (y, length).
 * y = 0 is the TOP goal line (the goal the "you" team attacks by default),
 * y = 105 is the bottom goal line.
 *
 * Usage:
 *   const r = SoccerKit.createRenderer(canvas);          // handles DPR
 *   r.render(situation, timeSeconds);                    // call every frame
 * See SKILL.md for the situation schema.
 * Used by Star Striker (github.com/Ld2000king/soccer-game) as js/pitch.js, driven by js/situation.js.
 */
(function (global) {
  'use strict';

  const PITCH = { W: 68, L: 105 };

  const PAL = {
    grassA: '#52ab2b',
    grassB: '#48a125',
    grassEdge: '#3f931f',
    line: 'rgba(255,255,255,0.94)',
    shadow: 'rgba(0,25,0,0.34)',
    standStep: ['#3a3f47', '#30343b'],
    skin: ['#f2caa4', '#e3a97f', '#c0864f', '#8a5530', '#4f2f1c'],
    hair: ['#f4d56e', '#d08a2e', '#6a4424', '#1e1611', '#b8452c', '#2a2a2a'],
    outline: 'rgba(0,0,0,0.45)',
  };

  // Default kits — saturated, flat, instantly readable from above.
  const KITS = {
    red:    { shirt: '#e0241c', shorts: '#e0241c', socks: '#e0241c', trim: '#ffffff', stripe: '#f5d000' },
    blue:   { shirt: '#1f3fd1', shorts: '#ffffff', socks: '#1f3fd1', trim: '#ffffff', stripe: '#ffffff' },
    yellow: { shirt: '#f2d21b', shorts: '#ffffff', socks: '#f2d21b', trim: '#1a1a1a', stripe: '#1a1a1a' },
    white:  { shirt: '#f4f4f4', shorts: '#1a1a1a', socks: '#f4f4f4', trim: '#1a1a1a', stripe: '#1a1a1a' },
    green:  { shirt: '#1e9e3a', shorts: '#ffffff', socks: '#1e9e3a', trim: '#ffffff', stripe: '#ffffff' },
    black:  { shirt: '#1d1d22', shorts: '#1d1d22', socks: '#1d1d22', trim: '#e8c23a', stripe: '#e8c23a' },
    keeper: { shirt: '#9fe07a', shorts: '#2f6b2a', socks: '#9fe07a', trim: '#2f6b2a', stripe: '#2f6b2a' },
  };

  function rng(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shade(hex, amt) {
    // amt -1..1 : darken / lighten
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((f - r) * p + r); g = Math.round((f - g) * p + g); b = Math.round((f - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function mix(a, b, k) { // blend hex colour a toward b by k (0..1)
    const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), c = (sh) => Math.round(((A >> sh) & 255) * (1 - k) + ((B >> sh) & 255) * k);
    return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1);
  }

  // ---------- camera ----------
  // Top-down with a slight tilt: ground y is squashed by `tilt`, heights go straight up the screen.
  function makeCamera(W, H, cam) {
    const rot = ((cam.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const s = cam.zoom || 16;           // px per metre
    const tilt = cam.tilt || 0.84;      // 1 = pure top-down, lower = more angled
    const hf = 0.95;                    // height factor
    const cx = cam.x, cy = cam.y;
    const oy = H * (cam.screenY != null ? cam.screenY : 0.5); // where the camera centre sits on screen
    function proj(x, y, z) {
      const dx = x - cx, dy = y - cy;
      const rx = dx * cos - dy * sin, ry = dx * sin + dy * cos;
      return { x: W / 2 + rx * s, y: oy + ry * s * tilt - (z || 0) * s * hf };
    }
    function groundTransform(ctx, dpr) {
      const a = s * cos, b = s * tilt * sin, c = -s * sin, d = s * tilt * cos;
      const e = W / 2 - (a * cx + c * cy), f = oy - (b * cx + d * cy);
      ctx.setTransform(a * dpr, b * dpr, c * dpr, d * dpr, e * dpr, f * dpr);
    }
    return { s, tilt, hf, rot, proj, groundTransform, W, H };
  }

  // ---------- static textures ----------
  function makeNoisePattern(ctx) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d'), r = rng(7);
    for (let i = 0; i < 2600; i++) {
      const light = r() < 0.5;
      g.fillStyle = light ? `rgba(190,255,140,${0.05 + r() * 0.09})` : `rgba(10,60,0,${0.06 + r() * 0.12})`;
      g.fillRect(r() * 128, r() * 128, 1 + r() * 1.5, 1 + r() * 2.5);
    }
    return ctx.createPattern(c, 'repeat');
  }

  // Crowd + stand steps rendered once in world space (8 px per metre), drawn under the ground transform.
  const CROWD_PPM = 8, CROWD_PAD = 30;
  function makeCrowdLayer(home, away) {
    const c = document.createElement('canvas');
    const Wm = PITCH.W + CROWD_PAD * 2, Lm = PITCH.L + CROWD_PAD * 2;
    c.width = Wm * CROWD_PPM; c.height = Lm * CROWD_PPM;
    const g = c.getContext('2d'), r = rng(42);
    g.scale(CROWD_PPM, CROWD_PPM);
    g.translate(CROWD_PAD, CROWD_PAD);
    const inner = 7; // stands start this far from the lines
    const colours = [home.shirt, home.shirt, away.shirt, away.shirt, '#ffffff', '#ffffff', ...PAL.skin, '#222'];
    for (let y = -CROWD_PAD; y < PITCH.L + CROWD_PAD; y += 0.62) {
      for (let x = -CROWD_PAD; x < PITCH.W + CROWD_PAD; x += 0.62) {
        const out = x < -inner || x > PITCH.W + inner || y < -inner || y > PITCH.L + inner;
        if (!out) continue;
        // stand steps (rows)
        const row = Math.floor((y < -inner ? -y : y > PITCH.L + inner ? y : x < 0 ? -x : x) / 1.24);
        g.fillStyle = PAL.standStep[row % 2];
        g.fillRect(x, y, 0.63, 0.63);
        if (r() < 0.86) {
          g.fillStyle = colours[(r() * colours.length) | 0];
          g.fillRect(x + 0.08, y + 0.1, 0.44, 0.34);          // body
          g.fillStyle = PAL.skin[(r() * PAL.skin.length) | 0];
          g.fillRect(x + 0.17, y - 0.05, 0.26, 0.2);          // head
        }
      }
    }
    return c;
  }

  // ---------- pitch ----------
  function drawGround(ctx, cam, dpr, st, sit) {
    const { W, H } = cam;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PAL.grassEdge;
    ctx.fillRect(0, 0, W, H);

    cam.groundTransform(ctx, dpr);
    // mowing stripes (across the pitch, every 5.25 m), extending past the lines like a real stadium
    for (let i = -2; i < 22; i++) {
      ctx.fillStyle = i % 2 ? PAL.grassA : PAL.grassB;
      ctx.fillRect(-7, i * 5.25, PITCH.W + 14, 5.25);
    }
    // worn patches: goal mouths, penalty spots, centre
    const worn = [[34, 3, 7, 0.28], [34, 11, 3, 0.22], [34, 102, 7, 0.28], [34, 94, 3, 0.22], [34, 52.5, 5, 0.14]];
    for (const [x, y, rad, a] of worn) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, `rgba(220,235,170,${a})`);
      g.addColorStop(1, 'rgba(220,235,170,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    }
    // stands
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(st.crowd, -CROWD_PAD, -CROWD_PAD, PITCH.W + CROWD_PAD * 2, PITCH.L + CROWD_PAD * 2);

    // grass grain in screen space
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = st.noise;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    cam.groundTransform(ctx, dpr);
    drawLines(ctx);
    drawBoards(ctx, sit);
  }

  function drawLines(ctx) {
    ctx.strokeStyle = PAL.line;
    ctx.fillStyle = PAL.line;
    ctx.lineWidth = 0.16;
    ctx.lineJoin = 'miter';
    const W = PITCH.W, L = PITCH.L;
    ctx.strokeRect(0, 0, W, L);
    ctx.beginPath(); ctx.moveTo(0, L / 2); ctx.lineTo(W, L / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, L / 2, 9.15, 0, Math.PI * 2); ctx.stroke();
    dot(ctx, W / 2, L / 2, 0.3);
    const a = Math.asin((16.5 - 11) / 9.15);
    for (const top of [true, false]) {
      const y0 = top ? 0 : L, dir = top ? 1 : -1;
      const pbW = 40.32, gbW = 18.32;
      ctx.strokeRect((W - pbW) / 2, top ? 0 : L - 16.5, pbW, 16.5);
      ctx.strokeRect((W - gbW) / 2, top ? 0 : L - 5.5, gbW, 5.5);
      const spotY = y0 + dir * 11;
      dot(ctx, W / 2, spotY, 0.25);
      ctx.beginPath();
      if (top) ctx.arc(W / 2, spotY, 9.15, a, Math.PI - a);
      else ctx.arc(W / 2, spotY, 9.15, Math.PI + a, Math.PI * 2 - a);
      ctx.stroke();
    }
    // corner arcs
    const c = [[0, 0, 0], [W, 0, Math.PI / 2], [W, L, Math.PI], [0, L, Math.PI * 1.5]];
    for (const [x, y, s] of c) { ctx.beginPath(); ctx.arc(x, y, 1, s, s + Math.PI / 2); ctx.stroke(); }
  }
  function dot(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }

  // Advertising boards: flat bands just outside the lines, text follows pitch orientation.
  function drawBoards(ctx, sit) {
    const texts = sit.boards || ['SOCCER', 'NEW SEASON', 'SOCCER', 'MATCHDAY'];
    const cols = ['#c8161d', '#1d3fb8', '#c8161d', '#10306e'];
    const seg = 9, h = 1.1, gap = 4.2;
    ctx.save();
    ctx.font = 'italic 700 0.85px Oswald, "Arial Narrow", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
    const run = (len, place) => {
      for (let i = 0, k = 0; i < len; i += seg, k++) {
        place(i, k);
      }
    };
    const board = (k) => {
      ctx.fillStyle = cols[k % cols.length];
      ctx.fillRect(0, 0, seg - 0.1, h);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(0, 0, seg - 0.1, h * 0.35);
      ctx.fillStyle = '#fff';
      ctx.fillText(texts[k % texts.length], seg / 2, h / 2 + 0.05);
    };
    run(PITCH.W + 10, (i, k) => { ctx.save(); ctx.translate(-5 + i, -gap - h); board(k); ctx.restore(); });
    run(PITCH.W + 10, (i, k) => { ctx.save(); ctx.translate(-5 + i, PITCH.L + gap); board(k + 1); ctx.restore(); });
    run(PITCH.L + 10, (i, k) => { ctx.save(); ctx.translate(PITCH.W + gap, -5 + i); ctx.rotate(Math.PI / 2); ctx.translate(0, -h); board(k + 2); ctx.restore(); });
    run(PITCH.L + 10, (i, k) => { ctx.save(); ctx.translate(-gap, -5 + i + seg); ctx.rotate(-Math.PI / 2); ctx.translate(0, -h); board(k + 3); ctx.restore(); });
    ctx.restore();
  }

  // ---------- goals ----------
  function drawGoal(ctx, cam, top, t, ripple) {
    const W = 7.32, Hh = 2.44, D = 2.1;
    const x0 = PITCH.W / 2 - W / 2, x1 = PITCH.W / 2 + W / 2;
    const yl = top ? 0 : PITCH.L, yb = top ? -D : PITCH.L + D;
    const P = (x, y, z) => cam.proj(x, y, z);
    // net shadow on grass
    const sh = [P(x0 + 0.6, yl), P(x1 + 0.6, yl), P(x1 + 1.6, yb + (top ? 0.8 : -0.8)), P(x0 + 1.6, yb + (top ? 0.8 : -0.8))];
    ctx.fillStyle = 'rgba(0,30,0,0.22)';
    poly(ctx, sh); ctx.fill();

    const rip = ripple ? Math.sin(t * 18) * ripple : 0;
    const back = (x, z) => [x, yb + (top ? -rip : rip) * (1 - Math.abs(x - PITCH.W / 2) / 4), z];
    ctx.strokeStyle = 'rgba(255,255,255,0.62)';
    ctx.lineWidth = 1;
    // faces: back, roof, left, right  (each: 4 corners in 3D)
    const faces = [
      [back(x0, 0), back(x1, 0), back(x1, Hh * 0.9), back(x0, Hh * 0.9)],
      [[x0, yl, Hh], [x1, yl, Hh], back(x1, Hh * 0.9), back(x0, Hh * 0.9)],
      [[x0, yl, 0], back(x0, 0), back(x0, Hh * 0.9), [x0, yl, Hh]],
      [[x1, yl, 0], back(x1, 0), back(x1, Hh * 0.9), [x1, yl, Hh]],
    ];
    for (const f of faces) {
      const q = f.map((p) => P(p[0], p[1], p[2]));
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      poly(ctx, q); ctx.fill();
      diamondMesh(ctx, q, 14);
    }
    // frame: posts + crossbar with a dark underside
    const pts = [P(x0, yl, 0), P(x0, yl, Hh), P(x1, yl, Hh), P(x1, yl, 0)];
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = cam.s * 0.2;
    ctx.beginPath(); ctx.moveTo(pts[0].x + 1.5, pts[0].y + 1); for (const p of pts.slice(1)) ctx.lineTo(p.x + 1.5, p.y + 1); ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = cam.s * 0.15;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y); ctx.stroke();
  }
  function poly(ctx, q) { ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y); for (const p of q.slice(1)) ctx.lineTo(p.x, p.y); ctx.closePath(); }
  function bil(q, u, v) {
    return {
      x: (1 - u) * (1 - v) * q[0].x + u * (1 - v) * q[1].x + u * v * q[2].x + (1 - u) * v * q[3].x,
      y: (1 - u) * (1 - v) * q[0].y + u * (1 - v) * q[1].y + u * v * q[2].y + (1 - u) * v * q[3].y,
    };
  }
  function diamondMesh(ctx, q, n) {
    ctx.beginPath();
    for (let i = 1; i < 2 * n; i++) {
      const k = i / n;
      // u + v = k
      let a = bil(q, Math.max(0, k - 1), Math.min(1, k)), b = bil(q, Math.min(1, k), Math.max(0, k - 1));
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      // u - v = k - 1
      const d = k - 1;
      a = bil(q, Math.max(0, d), Math.max(0, -d)); b = bil(q, Math.min(1, 1 + d), Math.min(1, 1 - d));
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
  }

  function drawCornerFlag(ctx, cam, x, y, t) {
    const b = cam.proj(x, y, 0), tp = cam.proj(x, y, 1.6);
    ctx.strokeStyle = 'rgba(0,30,0,0.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + cam.s * 0.9, b.y + cam.s * 0.25); ctx.stroke();
    ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(tp.x, tp.y); ctx.stroke();
    const w = Math.sin(t * 5 + x) * cam.s * 0.12;
    ctx.fillStyle = '#e8261e';
    ctx.beginPath(); ctx.moveTo(tp.x, tp.y); ctx.lineTo(tp.x + cam.s * 0.75, tp.y + cam.s * 0.2 + w); ctx.lineTo(tp.x, tp.y + cam.s * 0.45); ctx.closePath(); ctx.fill();
  }

  // ---------- players ----------
  // Chunky, big-head, flat-shaded figure seen from above/front. Feet at (sx, sy).
  function drawPlayer(ctx, cam, p, kit, t, look) {
    const pt = cam.proj(p.x, p.y, 0);
    const H = 1.8 * cam.s * cam.hf * 1.45; // exaggerated size — players read as characters, not dots
    drawFigure(ctx, pt.x, pt.y, H, kit, look, p, t);
  }

  // Screen-space figure, feet at (sx, sy), H px tall. Also used by the close-up minigames.
  // o: { pose, facing, lean (-1..1 sideways dive), seed, marker, call }
  function drawFigure(ctx, sx, sy, H, kit, look, o, t) {
    kit = normKit(kit);
    look = look || { skin: PAL.skin[1], hair: PAL.hair[3] };
    const acc = look.acc || {};
    const bootCol = look.boot || '#16161a';
    const p = o || {};
    const face = p.facing === 'left' ? -1 : 1;
    const pose = p.pose || 'idle';
    const seed = p.seed != null ? p.seed : (p.x || 0) * 3.1 + (p.y || 0) * 1.7;
    const ph = t * 9 + seed;
    const run = pose === 'run' ? 1 : pose === 'jog' ? 0.5 : 0;
    const bob = run ? Math.abs(Math.sin(ph)) * H * 0.025 : Math.sin(t * 2 + seed) * H * 0.006;
    const lean = p.lean || 0;

    // drop shadow (down-right, soft)
    ctx.fillStyle = PAL.shadow;
    ctx.beginPath();
    ctx.ellipse(sx + H * 0.14 + lean * H * 0.35, sy + H * 0.03, H * (0.3 + Math.abs(lean) * 0.25), H * 0.12, 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(sx, sy - bob);
    if (lean) { ctx.translate(0, -H * 0.5); ctx.rotate(lean * 1.15); ctx.translate(0, H * 0.5); }
    ctx.lineWidth = Math.max(1, H * 0.018);
    ctx.strokeStyle = PAL.outline;
    const skin = look.skin, hair = look.hair;
    const swing = Math.sin(ph) * run;

    // legs
    for (const side of [-1, 1]) {
      const lx = side * H * 0.085 + side * swing * H * 0.04 * face;
      const lift = run ? Math.max(0, Math.sin(ph + (side > 0 ? 0 : Math.PI))) * H * 0.07 : 0;
      rr(ctx, lx - H * 0.055, -H * 0.46 - lift, H * 0.11, H * 0.2, H * 0.04, skin);
      rr(ctx, lx - H * 0.058, -H * 0.27 - lift, H * 0.116, H * 0.21, H * 0.04, kit.socks);
      // boot: a darker sole under the coloured upper, and a glint on the toe
      ctx.fillStyle = shade(bootCol, -0.5);
      ctx.beginPath(); ctx.ellipse(lx + face * H * 0.015, -H * 0.033 - lift, H * 0.07, H * 0.045, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = bootCol;
      ctx.beginPath(); ctx.ellipse(lx + face * H * 0.015, -H * 0.045 - lift, H * 0.07, H * 0.042, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.ellipse(lx + face * H * 0.04, -H * 0.055 - lift, H * 0.03, H * 0.013, 0, 0, Math.PI * 2); ctx.fill();
    }
    // shorts
    rr(ctx, -H * 0.18, -H * 0.56, H * 0.36, H * 0.16, H * 0.05, kit.shorts);
    // arms (behind torso edges)
    const armUp = pose === 'keeper' ? 1 : pose === 'celebrate' ? 1.6 : 0;
    for (const side of [-1, 1]) {
      const sw = -side * swing * H * 0.05;
      ctx.save();
      ctx.translate(side * H * 0.235, -H * 0.82);
      // positive angle swings the hand outward, away from the body
      ctx.rotate(-side * (0.24 + armUp * 1.0) + (run ? Math.sin(ph + (side > 0 ? Math.PI : 0)) * 0.5 : 0) * 0.6);
      rr(ctx, -H * 0.055, 0 + sw * 0.2, H * 0.11, H * 0.14, H * 0.045, kit.shirt);
      rr(ctx, -H * 0.045, H * 0.12, H * 0.09, H * 0.15, H * 0.04, acc.thermal || skin);
      if (acc.captain && side === 1) rr(ctx, -H * 0.06, H * 0.03, H * 0.12, H * 0.05, H * 0.015, acc.captain);
      if (acc.wristbands) rr(ctx, -H * 0.05, H * 0.2, H * 0.1, H * 0.04, H * 0.015, acc.wristbands);
      if (acc.gloves && pose !== 'keeper') rr(ctx, -H * 0.052, H * 0.2, H * 0.104, H * 0.085, H * 0.035, acc.gloves);
      if (pose === 'keeper') { ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.arc(0, H * 0.28, H * 0.055, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
    // torso with soft top-left light
    const g = ctx.createLinearGradient(-H * 0.2, -H * 0.9, H * 0.2, -H * 0.5);
    g.addColorStop(0, shade(kit.shirt, 0.22));
    g.addColorStop(1, shade(kit.shirt, -0.18));
    rr(ctx, -H * 0.2, -H * 0.9, H * 0.4, H * 0.37, H * 0.09, g);
    if (kit.pattern === 'stripes') {
      ctx.save(); ctx.beginPath(); ctx.rect(-H * 0.2, -H * 0.9, H * 0.4, H * 0.37); ctx.clip();
      ctx.fillStyle = kit.trim;
      for (let i = -2; i <= 2; i += 2) ctx.fillRect(i * H * 0.05 - H * 0.025, -H * 0.9, H * 0.05, H * 0.37);
      ctx.restore();
    }
    // collar / trim
    ctx.strokeStyle = kit.trim; ctx.lineWidth = Math.max(1, H * 0.025);
    ctx.beginPath(); ctx.arc(0, -H * 0.9, H * 0.07, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.strokeStyle = PAL.outline; ctx.lineWidth = Math.max(1, H * 0.018);
    if (acc.chain) {
      ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = Math.max(1, H * 0.022);
      ctx.beginPath(); ctx.moveTo(-H * 0.085, -H * 0.9); ctx.quadraticCurveTo(0, -H * 0.72, H * 0.085, -H * 0.9); ctx.stroke();
      ctx.fillStyle = '#f2c94c'; ctx.strokeStyle = PAL.outline; ctx.lineWidth = Math.max(1, H * 0.012);
      ctx.beginPath(); ctx.arc(0, -H * 0.79, H * 0.03, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    // head (big) + hair + face accessories
    drawHead(ctx, face * H * 0.02, -H * 1.01, H * 0.13, look, face, t);
    ctx.restore();

    // "you" / focus marker: small down-arrow above head
    if (p.marker) {
      const my = sy - H * 1.35 + Math.sin(t * 5) * 3;
      ctx.fillStyle = p.marker === true ? '#ffe13a' : p.marker;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sx - 7, my - 8); ctx.lineTo(sx + 7, my - 8); ctx.lineTo(sx, my); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (p.call) drawCallBubble(ctx, sx + H * 0.22, sy - H * 1.25, H * 0.42, t);
  }

  // ---------- head, hair and face accessories ----------
  // Hair styles: short, buzz, bald, curly, afro, mohawk, long, ponytail, bun, dreads.
  // look.acc holds the worn accessories: headband/sunglasses/earring/diamond are
  // drawn here, the rest by drawFigure.
  const NPC_STYLES = ['short', 'short', 'short', 'buzz', 'buzz', 'bald', 'curly', 'afro', 'long', 'mohawk', 'bun', 'ponytail'];

  function hairCap(ctx, hx, hy, r, lo) { // lo: how far the sides come down (0 = at the temples)
    ctx.beginPath();
    ctx.arc(hx, hy - r * 0.06, r * 1.03, Math.PI * (1.02 - lo), Math.PI * (1.98 + lo));
    ctx.closePath();
  }

  function drawHair(ctx, hx, hy, r, style, col, face, t, back, skin) {
    const sway = Math.sin(t * 2.4) * 0.12;
    ctx.fillStyle = col;
    if (back) {
      if (style === 'afro') {
        ctx.beginPath(); ctx.arc(hx, hy - r * 0.28, r * 1.62, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (style === 'long') {
        ctx.beginPath(); ctx.roundRect(hx - r * 1.14, hy - r * 0.7, r * 2.28, r * 2.7, r * 0.7); ctx.fill(); ctx.stroke();
      } else if (style === 'ponytail') {
        ctx.save();
        ctx.translate(hx - face * r * 1.0, hy - r * 0.05);
        ctx.rotate(-face * (0.5 + sway));
        ctx.beginPath(); ctx.ellipse(0, r * 0.62, r * 0.34, r * 0.85, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
      } else if (style === 'dreads') {
        const keep = ctx.strokeStyle;
        ctx.strokeStyle = col; ctx.lineWidth = r * 0.3;
        [-1.02, -0.78, 0.78, 1.02].forEach((k, i) => {
          const wob = Math.sin(t * 3 + i * 1.7) * r * 0.1;
          ctx.beginPath(); ctx.moveTo(hx + k * r, hy - r * 0.3); ctx.lineTo(hx + k * r * 1.12 + wob, hy + r * 1.55); ctx.stroke();
        });
        ctx.strokeStyle = keep;
      }
      return;
    }
    switch (style) {
      case 'bald': {
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath(); ctx.ellipse(hx - r * 0.3, hy - r * 0.62, r * 0.28, r * 0.13, -0.5, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'buzz': {
        ctx.fillStyle = mix(skin, col, 0.62); hairCap(ctx, hx, hy, r, 0.02); ctx.fill();
        break;
      }
      case 'curly': {
        for (let i = 0; i < 7; i++) {
          const a = Math.PI * (1.04 + i * 0.153);
          ctx.beginPath(); ctx.arc(hx + Math.cos(a) * r * 0.98, hy - r * 0.06 + Math.sin(a) * r * 0.98, r * 0.3, 0, Math.PI * 2); ctx.fill();
        }
        hairCap(ctx, hx, hy, r * 0.98, 0.02); ctx.fill();
        break;
      }
      case 'afro': {
        hairCap(ctx, hx, hy, r, 0.06); ctx.fill();
        break;
      }
      case 'mohawk': {
        ctx.fillStyle = mix(skin, col, 0.28); hairCap(ctx, hx, hy, r, 0.02); ctx.fill();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.roundRect(hx - r * 0.2, hy - r * 1.62, r * 0.4, r * 1.2, r * 0.2); ctx.fill(); ctx.stroke();
        break;
      }
      case 'long': {
        hairCap(ctx, hx, hy, r, 0.07); ctx.fill();
        break;
      }
      case 'bun': {
        ctx.beginPath(); ctx.arc(hx, hy - r * 1.12, r * 0.42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        hairCap(ctx, hx, hy, r, 0.02); ctx.fill();
        break;
      }
      default: { // short, ponytail, dreads
        hairCap(ctx, hx, hy, r, 0.02); ctx.fill();
      }
    }
  }

  // Screen-space head centred on (hx, hy) with radius r. Outline width comes from r,
  // so a big preview and a tiny sprite match.
  function drawHead(ctx, hx, hy, r, look, face, t) {
    const skin = look.skin || PAL.skin[1], hair = look.hair || PAL.hair[3], style = look.style || 'short';
    const acc = look.acc || {};
    ctx.save();
    ctx.lineWidth = Math.max(1, r * 0.14); ctx.strokeStyle = PAL.outline; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    drawHair(ctx, hx, hy, r, style, hair, face, t, true, skin);
    // ears
    ctx.fillStyle = shade(skin, -0.06);
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + side * r * 0.97, hy + r * 0.12, r * 0.19, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    // head
    const hg = ctx.createRadialGradient(hx - r * 0.3, hy - r * 0.3, r * 0.15, hx, hy, r * 1.08);
    hg.addColorStop(0, shade(skin, 0.18)); hg.addColorStop(1, shade(skin, -0.12));
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // a face only when the head is big enough to carry one
    if (r >= 9) {
      ctx.fillStyle = 'rgba(30,20,15,0.85)';
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + side * r * 0.36 + face * r * 0.06, hy + r * 0.1, r * 0.075, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = 'rgba(30,20,15,0.55)'; ctx.lineWidth = Math.max(1, r * 0.07);
      ctx.beginPath(); ctx.arc(hx + face * r * 0.05, hy + r * 0.32, r * 0.3, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
      ctx.strokeStyle = PAL.outline; ctx.lineWidth = Math.max(1, r * 0.14);
    }
    drawHair(ctx, hx, hy, r, style, hair, face, t, false, skin);
    if (acc.headband) {
      ctx.save();
      ctx.beginPath(); ctx.arc(hx, hy, r * 1.02, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = acc.headband; ctx.fillRect(hx - r * 1.1, hy - r * 0.56, r * 2.2, r * 0.3);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(1, r * 0.06);
      ctx.strokeRect(hx - r * 1.1, hy - r * 0.56, r * 2.2, r * 0.3);
      ctx.restore();
    }
    if (acc.sunglasses) {
      const gx = face * r * 0.06;
      ctx.fillStyle = '#14161b'; ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(1, r * 0.06);
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.roundRect(hx + gx + side * r * 0.44 - r * 0.38, hy - r * 0.1, r * 0.76, r * 0.42, r * 0.14); ctx.fill(); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(hx + gx - r * 0.06, hy + r * 0.04); ctx.lineTo(hx + gx + r * 0.06, hy + r * 0.04); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.roundRect(hx + gx + side * r * 0.44 - r * 0.28, hy - r * 0.05, r * 0.22, r * 0.07, r * 0.03); ctx.fill(); }
    }
    if (acc.earring || acc.diamond) {
      const ex = hx + r * 0.97, ey = hy + r * 0.36;
      if (acc.diamond) {
        ctx.fillStyle = '#cdeeff'; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = Math.max(1, r * 0.05);
        ctx.beginPath(); ctx.arc(ex, ey, r * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        const k = 0.6 + 0.4 * Math.sin(t * 4);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = Math.max(1, r * 0.05);
        ctx.beginPath(); ctx.moveTo(ex - r * 0.3 * k, ey); ctx.lineTo(ex + r * 0.3 * k, ey); ctx.moveTo(ex, ey - r * 0.3 * k); ctx.lineTo(ex, ey + r * 0.3 * k); ctx.stroke();
      } else {
        ctx.fillStyle = '#dfe6ee'; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = Math.max(1, r * 0.05);
        ctx.beginPath(); ctx.arc(ex, ey, r * 0.13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Head and shoulders in a box `size` px wide, resting on y = bottom. Used for the dashboard avatar.
  function drawBust(ctx, cx, bottom, size, kit, look, t) {
    kit = normKit(kit);
    const acc = look.acc || {};
    const r = size * 0.27;
    ctx.save();
    ctx.lineWidth = Math.max(1, size * 0.03); ctx.strokeStyle = PAL.outline; ctx.lineJoin = 'round';
    const g = ctx.createLinearGradient(cx - size * 0.4, bottom - size * 0.4, cx + size * 0.4, bottom);
    g.addColorStop(0, shade(kit.shirt, 0.22)); g.addColorStop(1, shade(kit.shirt, -0.18));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(cx - size * 0.44, bottom - size * 0.34, size * 0.88, size * 0.6, size * 0.26); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = kit.trim; ctx.lineWidth = Math.max(1, size * 0.05);
    ctx.beginPath(); ctx.arc(cx, bottom - size * 0.34, size * 0.15, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    if (acc.chain) {
      ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = Math.max(1, size * 0.04);
      ctx.beginPath(); ctx.moveTo(cx - size * 0.2, bottom - size * 0.3); ctx.quadraticCurveTo(cx, bottom - size * 0.04, cx + size * 0.2, bottom - size * 0.3); ctx.stroke();
    }
    drawHead(ctx, cx, bottom - size * 0.6, r, look, 1, t);
    ctx.restore();
  }

  // the game's clubs only carry {shirt, shorts}; fill in the rest the way a real strip does
  function normKit(k) {
    if (k.socks && k.trim && k.stripe) return k;
    return {
      shirt: k.shirt, shorts: k.shorts || '#ffffff',
      socks: k.socks || k.shirt, trim: k.trim || k.shorts || '#ffffff',
      stripe: k.stripe || k.shorts || '#ffffff', pattern: k.pattern,
    };
  }

  function rr(ctx, x, y, w, h, r, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
    ctx.fill(); ctx.stroke();
  }

  // teammate calling for the ball: white rounded bubble with a tail + ball icon
  function drawCallBubble(ctx, x, y, size, t) {
    const pop = 1 + Math.max(0, Math.sin(t * 6)) * 0.06;
    const s = size * pop;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.roundRect(-s / 2 + 2, -s / 2 + 2, s, s, s * 0.22); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.22); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.25, s / 2 - 1); ctx.lineTo(-s * 0.42, s * 0.82); ctx.lineTo(-s * 0.02, s / 2 - 1); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s * 0.25, s / 2); ctx.lineTo(-s * 0.42, s * 0.82); ctx.lineTo(-s * 0.02, s / 2); ctx.stroke();
    drawBallIcon(ctx, 0, 0, s * 0.32, 0);
    ctx.restore();
  }

  // ---------- ball ----------
  function drawBallIcon(ctx, x, y, r, spin) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfd3d6');
    ctx.fillStyle = g; ctx.strokeStyle = '#222'; ctx.lineWidth = Math.max(1, r * 0.12);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1b1b1b';
    const pent = (px, py, pr, rot) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) { const a = rot + (i * Math.PI * 2) / 5 - Math.PI / 2; ctx.lineTo(px + Math.cos(a) * pr, py + Math.sin(a) * pr); }
      ctx.closePath(); ctx.fill();
    };
    pent(x, y, r * 0.36, spin);
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    for (let i = 0; i < 5; i++) { const a = spin + (i * Math.PI * 2) / 5 - Math.PI / 2; pent(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95, r * 0.3, a); }
    ctx.restore();
  }
  function drawBall(ctx, cam, b, t) {
    const z = b.z || 0;
    const g = cam.proj(b.x, b.y, 0), p = cam.proj(b.x, b.y, z);
    const r = Math.max(3.5, cam.s * 0.3);
    const sh = Math.max(0.35, 1 - z * 0.08);
    ctx.fillStyle = `rgba(0,25,0,${0.4 * sh})`;
    ctx.beginPath(); ctx.ellipse(g.x + r * 0.5 + z * cam.s * 0.25, g.y + r * 0.3, r * 1.05 * (2 - sh), r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    drawBallIcon(ctx, p.x, p.y - r * 0.7, r * (1 + z * 0.03), (b.spin || 0) * t);
  }

  // ---------- ground markers ----------
  function drawMarker(ctx, cam, dpr, m, t) {
    if (m.type === 'pass' || m.type === 'run') {
      const a = cam.proj(m.from[0], m.from[1]), b = cam.proj(m.to[0], m.to[1]);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = m.type === 'pass' ? 'rgba(255,255,255,0.85)' : 'rgba(255,225,60,0.85)';
      ctx.lineWidth = 3; ctx.setLineDash([8, 7]); ctx.lineDashOffset = -t * 30;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - Math.cos(ang - 0.45) * 13, b.y - Math.sin(ang - 0.45) * 13); ctx.lineTo(b.x - Math.cos(ang + 0.45) * 13, b.y - Math.sin(ang + 0.45) * 13); ctx.closePath(); ctx.fill();
      return;
    }
    cam.groundTransform(ctx, dpr);
    const [x, y] = m.at;
    const pulse = 1 + Math.sin(t * 4) * 0.06;
    const r = (m.r || (m.type === 'control' ? 1.3 : 1.1)) * pulse;
    const col = m.type === 'control' ? [110, 255, 110] : m.type === 'target' ? [255, 228, 70] : [255, 80, 70];
    ctx.fillStyle = `rgba(${col},${m.type === 'control' ? 0.28 : 0.16})`;
    ctx.strokeStyle = `rgba(${col},0.75)`;
    ctx.lineWidth = 0.12;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2); ctx.stroke();
  }

  // ---------- HUD ----------
  // Oswald has no Hebrew glyphs, so Hebrew captions fall through to Rubik (the app's own font)
  const FONT = 'Oswald, Rubik, "Arial Narrow", "Roboto Condensed", sans-serif';
  const isRTL = (txt) => /[֐-׿]/.test(txt);
  function slantText(ctx, txt, x, y, size, fill, align) {
    ctx.save();
    ctx.translate(x, y); ctx.transform(1, 0, -0.18, 1, 0, 0);
    ctx.font = `700 ${size}px ${FONT}`; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.direction = isRTL(txt) ? 'rtl' : 'ltr';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = size * 0.16; ctx.strokeText(txt, 0, 0);
    ctx.fillStyle = fill; ctx.fillText(txt, 0, 0);
    ctx.restore();
  }

  function drawScoreboard(ctx, W, sit) {
    const h = Math.round(Math.max(26, W * 0.058)), w = Math.min(W - 32, W * 0.64);
    const x = (W - w) / 2, y = sit.hudTop != null ? sit.hudTop : Math.max(16, W * 0.1);
    const mid = h * 1.05, side = (w - mid) / 2;
    const panel = (px, col, stripe, flip) => {
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, shade(col, 0.25)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.25));
      ctx.fillStyle = g; ctx.fillRect(px, y, side, h);
      ctx.fillStyle = stripe;
      ctx.fillRect(flip ? px + side - h * 0.35 : px, y, h * 0.35, h);
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(px, y, side, h * 0.3);
    };
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 3, y + 4, w, h);
    const hk = normKit(sit.home.kit), ak = normKit(sit.away.kit);
    panel(x, hk.shirt, hk.stripe, false);
    panel(x + side + mid, ak.shirt, ak.stripe, true);
    const mg = ctx.createLinearGradient(0, y - 3, 0, y + h + 3);
    mg.addColorStop(0, '#f4f4f4'); mg.addColorStop(1, '#9ea3a8');
    ctx.fillStyle = mg; ctx.fillRect(x + side, y - 3, mid, h + 6);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h); ctx.strokeRect(x + side, y - 3, mid, h + 6);
    const fs = h * 0.72;
    slantText(ctx, sit.home.abbr, x + h * 0.45 + (side - h * 1.3) / 2, y + h / 2 + 1, fs, '#fff');
    slantText(ctx, String(sit.home.score), x + side - h * 0.45, y + h / 2 + 1, fs, '#fff');
    slantText(ctx, String(sit.away.score), x + side + mid + h * 0.45, y + h / 2 + 1, fs, '#fff');
    slantText(ctx, sit.away.abbr, x + side + mid + h * 0.85 + (side - h * 1.3) / 2, y + h / 2 + 1, fs, '#fff');
    ctx.save(); ctx.translate(x + side + mid / 2, y + h / 2 + 1); ctx.transform(1, 0, -0.18, 1, 0, 0);
    ctx.font = `700 ${h * 0.6}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
    ctx.fillStyle = '#2a2d31'; ctx.fillText(`${sit.minute}'`, 0, 0); ctx.restore();
    ctx.restore();
  }

  // Slanted caption banner (tilted ~-2.5deg): white rails, lavender-blue body, white italic condensed text with black outline.
  function drawBanner(ctx, W, H, text, t, appear) {
    if (!text) return;
    const k = appear == null ? 1 : Math.min(1, appear);
    const e = 1 - Math.pow(1 - k, 3);
    const bh = Math.max(56, W * 0.2);
    ctx.save();
    ctx.translate(W / 2 + (1 - e) * W * 1.2, H - bh * 1.05);
    ctx.rotate(-0.045);
    const bw = W * 1.3;
    ctx.fillStyle = '#111'; ctx.fillRect(-bw / 2, -bh / 2 - 9, bw, bh + 18);
    ctx.fillStyle = '#fff'; ctx.fillRect(-bw / 2, -bh / 2 - 7, bw, bh + 14);
    ctx.fillStyle = '#111'; ctx.fillRect(-bw / 2, -bh / 2 - 2, bw, bh + 4);
    const g = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2);
    g.addColorStop(0, '#7b7fd0'); g.addColorStop(1, '#5a5eb4');
    ctx.fillStyle = g; ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    const lines = String(text).split('\n');
    const fs = Math.min(bh * (lines.length > 1 ? 0.4 : 0.58), (W * 1.7) / Math.max(...lines.map((l) => l.length)));
    lines.forEach((l, i) => {
      const ly = (i - (lines.length - 1) / 2) * fs * 1.05;
      ctx.save(); ctx.transform(1, 0, -0.14, 1, 0, 0);
      ctx.font = `${isRTL(l) ? 900 : 700} ${fs}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.direction = isRTL(l) ? 'rtl' : 'ltr';
      ctx.strokeStyle = '#111'; ctx.lineWidth = fs * 0.2; ctx.strokeText(l, 0, ly + 2);
      ctx.fillStyle = '#fff'; ctx.fillText(l, 0, ly + 2);
      ctx.restore();
    });
    ctx.restore();
  }

  // ---------- renderer ----------
  function createRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    let st = null, stKey = '';
    function render(sit, t) {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const W = canvas.clientWidth, H = canvas.clientHeight;
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      }
      const key = sit.home.kit.shirt + sit.away.kit.shirt;
      if (key !== stKey) { st = { noise: makeNoisePattern(ctx), crowd: makeCrowdLayer(sit.home.kit, sit.away.kit) }; stKey = key; }
      const cam = makeCamera(W, H, sit.camera);

      drawGround(ctx, cam, dpr, st, sit);
      for (const m of sit.markers || []) drawMarker(ctx, cam, dpr, m, t);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // depth-sorted sprites: goals (by their line), flags, players, ball
      const items = [];
      items.push({ y: cam.proj(34, -1).y, draw: () => drawGoal(ctx, cam, true, t, sit.netRipple && sit.netRipple.top) });
      items.push({ y: cam.proj(34, PITCH.L + 1).y, draw: () => drawGoal(ctx, cam, false, t, sit.netRipple && sit.netRipple.bottom) });
      for (const [fx, fy] of [[0, 0], [PITCH.W, 0], [0, PITCH.L], [PITCH.W, PITCH.L]]) items.push({ y: cam.proj(fx, fy).y, draw: () => drawCornerFlag(ctx, cam, fx, fy, t) });
      const r = rng(99);
      for (const p of sit.players) {
        const team = sit[p.team];
        const kit = p.role === 'gk' ? (team.gkKit || KITS.keeper) : team.kit;
        // every other player gets a stable random look; yours arrives as p.look
        const rs = PAL.skin[(r() * PAL.skin.length) | 0], rh = PAL.hair[(r() * PAL.hair.length) | 0], rt = NPC_STYLES[(r() * NPC_STYLES.length) | 0];
        const look = p.look || { skin: p.skin || rs, hair: p.hair || rh, style: p.style || rt };
        items.push({ y: cam.proj(p.x, p.y).y, draw: () => drawPlayer(ctx, cam, p, kit, t, look) });
      }
      if (sit.ball) items.push({ y: cam.proj(sit.ball.x, sit.ball.y).y + 0.1, draw: () => drawBall(ctx, cam, sit.ball, t) });
      items.sort((a, b) => a.y - b.y).forEach((i) => i.draw());

      drawScoreboard(ctx, W, sit);
      drawBanner(ctx, W, H, sit.caption, t, sit.captionAppear);
    }
    return { render, ctx };
  }

  global.SoccerKit = {
    createRenderer, makeCamera, KITS, PAL, PITCH, drawBanner, drawScoreboard, shade,
    drawFigure, drawBust, drawHead, drawBallIcon, drawCallBubble, makeNoisePattern, normKit, slantText, FONT, rng,
  };
})(typeof window !== 'undefined' ? window : globalThis);
