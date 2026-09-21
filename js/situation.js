// ===== Match situations =====
// Every key moment opens on a full-screen pitch drawn in the game's
// "soccer-game" house style (js/pitch.js): the moment is laid out the way it
// would really look — goal in frame, your player marked, the ball under a
// control ring — the minigame slides up over the lower half, and when it
// resolves the result is played out on the pitch before the log continues.
//
// World units are metres, y = 0 is the goal at the top of the screen. The
// side attacking that goal depends on the moment: you when you shoot, pass or
// dribble; the opponent when you defend or save.

function clubAbbr(name){
  const words = String(name).toUpperCase().replace(/[^A-Z0-9'. ]/g, "").split(/\s+/).filter(Boolean);
  if(!words.length) return String(name).slice(0, 6);
  if(words.length===1) return words[0].slice(0, 6);
  return words[0].slice(0, 3) + " " + words[1].slice(0, 3);
}

const SITUATION_TITLES = {
  shoot:"הזדמנות סיום!",
  pass:"מסירת מפתח!",
  dribble:"אחד על אחד!",
  defend:"התקפה מסוכנת!",
  save:"בעיטה לשער!",
  penalty:"פנדל!",
  freekick:"בעיטה חופשית!",
};

// the caption over the opening frame; a corner reads differently for each side
function situationTitle(sit){
  if(sit.type==="corner") return sit.cornerAttack ? "קרן!" : "קרן נגדך!";
  if(sit.type==="penalty" && sit.hero.role==="gk") return "פנדל נגדך!";
  return SITUATION_TITLES[sit.type];
}

function _jit(v, r){ return v + (Math.random()*2-1)*r; }

// A keeper wears his own colour, never either side's shirt: the house style's
// light green unless that clashes with one of the two teams on the pitch.
function keeperKitFor(teamKit, otherKit){
  const shirt = ["#9fe07a", "#ff8c1a", "#b36bff", "#2fd0e0"]
    .find(c=> !_kitClash(c, teamKit.shirt) && !_kitClash(c, otherKit.shirt)) || "#9fe07a";
  return { shirt, shorts: _kitClash(shirt, teamKit.shorts) ? "#1b2740" : teamKit.shorts };
}

// Builds the situation object js/pitch.js renders. `hero` is the player's own
// entry in `players`, so the outcome animation can move him.
function buildSituation(type, m, kits){
  const me = m.myIsHome ? "home" : "away";
  const them = m.myIsHome ? "away" : "home";
  const flip = Math.random() < 0.5;
  const X = (x)=> flip ? SoccerKit.PITCH.W - x : x;
  const isGK = m.p.position==="GK";

  const sit = {
    type, minute: m.minute,
    home: { abbr: clubAbbr(m.homeClub.name), score: m.score.home, kit: m.myIsHome ? kits.mine : kits.theirs },
    away: { abbr: clubAbbr(m.awayClub.name), score: m.score.away, kit: m.myIsHome ? kits.theirs : kits.mine },
    boards: ["STAR STRIKER", "MATCHDAY", "STAR STRIKER", "GOAL!"],
    players: [], markers: [], netRipple: { top: 0 },
  };
  sit.home.gkKit = keeperKitFor(sit.home.kit, sit.away.kit);
  sit.away.gkKit = keeperKitFor(sit.away.kit, sit.home.kit);
  // exact:true keeps a player where he was put — the wall, the taker over the ball
  const add = (team, x, y, o={})=>{
    const exact = o.exact; delete o.exact;
    const pl = { team, x: exact ? X(x) : _jit(X(x), 0.8), y: exact ? y : _jit(y, 0.8), ...o };
    sit.players.push(pl); return pl;
  };

  if(type==="shoot"){
    // one-on-one: only the keeper between you and the goal, a defender chasing
    sit.camera = { x: 34, y: 16, zoom: 14 };
    sit.hero = add(me, 38, 22, { pose:"run", marker:true });
    sit.keeper = add(them, 34, 3.5, { role:"gk", pose:"keeper", x: 34 });
    sit.chaser = add(them, 36, 27, { pose:"run" });
    add(them, 22, 20, { pose:"jog" });
    add(them, 50, 25, { pose:"jog" });
    add(me, 17, 30, { pose:"jog" });
    add(me, 54, 33, { pose:"jog" });
    sit.ball = { x: sit.hero.x + 0.6, y: sit.hero.y - 0.8, z: 0 };
    sit.markers.push({ type:"control", at:[sit.ball.x, sit.ball.y] });
  } else if(type==="pass" && isGK){
    // build-up from the back: you have it in your hands, a full-back is calling
    sit.camera = { x: 34, y: 17, zoom: 14 };
    sit.hero = add(me, 34, 4.5, { role:"gk", pose:"idle", marker:true, x: 34 });
    sit.mate = add(me, 23, 15, { pose:"jog", call:true });
    add(me, 46, 13, { pose:"idle" });
    add(me, 36, 25, { pose:"idle" });
    add(them, 29, 22, { pose:"jog" });
    add(them, 43, 21, { pose:"jog" });
    add(them, 33, 33, { pose:"idle" });
    sit.ball = { x: sit.hero.x + 0.5, y: sit.hero.y + 0.2, z: 0.9 };
    sit.markers.push({ type:"pass", from:[sit.ball.x, sit.ball.y], to:[sit.mate.x, sit.mate.y] });
  } else if(type==="pass"){
    // cross from the byline, goal on the side of the screen, a teammate calling
    sit.camera = { x: X(36), y: 13, zoom: 14, rotation: 90 };
    sit.hero = add(me, 57, 8.5, { pose:"run", marker:true });
    sit.keeper = add(them, 34, 1.5, { role:"gk", pose:"keeper", x: 34 });
    add(them, 22, 8);
    add(them, 27, 12);
    sit.blocker = add(them, 38, 15);
    add(them, 47, 10);
    add(them, 50, 22, { pose:"jog" });
    sit.mate = add(me, 40, 19, { pose:"jog", call:true });
    add(me, 19, 18, { pose:"jog" });
    sit.ball = { x: sit.hero.x - 0.6, y: sit.hero.y - 0.6, z: 0 };
    sit.markers.push({ type:"control", at:[sit.ball.x, sit.ball.y] });
    sit.markers.push({ type:"pass", from:[sit.ball.x, sit.ball.y], to:[sit.mate.x, sit.mate.y - 1] });
  } else if(type==="dribble"){
    // a defender squared up to you on the edge of the box
    sit.camera = { x: 34, y: 25, zoom: 14 };
    sit.hero = add(me, 36, 31, { pose:"run", marker:true });
    sit.defender = add(them, 35.5, 25.5, { pose:"idle" });
    sit.keeper = add(them, 34, 2.5, { role:"gk", pose:"keeper", x: 34 });
    add(them, 23, 20, { pose:"jog" });
    add(them, 47, 19, { pose:"jog" });
    add(me, 53, 30, { pose:"jog", call:true });
    add(me, 18, 34, { pose:"jog" });
    sit.ball = { x: sit.hero.x + 0.5, y: sit.hero.y - 0.9, z: 0 };
    sit.markers.push({ type:"control", at:[sit.ball.x, sit.ball.y] });
  } else if(type==="defend"){
    // they are running at your goal (top); you have to get across
    sit.camera = { x: 34, y: 17, zoom: 14 };
    sit.attacker = add(them, 37, 21, { pose:"run" });
    sit.hero = add(me, 29, 16.5, { pose:"run", marker:true });
    sit.keeper = add(me, 34, 3, { role:"gk", pose:"keeper", x: 34 });
    add(me, 47, 14, { pose:"jog" });
    add(me, 40, 29, { pose:"run" });
    add(them, 23, 13, { pose:"jog", call:true });
    add(them, 52, 26, { pose:"jog" });
    sit.ball = { x: sit.attacker.x - 0.4, y: sit.attacker.y - 0.9, z: 0 };
    sit.markers.push({ type:"danger", at:[sit.ball.x, sit.ball.y] });
    sit.markers.push({ type:"run", from:[sit.hero.x, sit.hero.y], to:[sit.ball.x - 0.8, sit.ball.y + 0.6] });
  } else if(type==="penalty"){
    // the ball on the spot, the keeper on his line, everyone else outside the box and the D
    sit.camera = { x: 34, y: 12, zoom: 17 };
    if(!isGK){
      sit.hero = add(me, 34, 17.2, { pose:"idle", marker:true, exact:true });
      sit.keeper = add(them, 34, 1.6, { role:"gk", pose:"keeper", exact:true });
    } else {
      sit.hero = add(me, 34, 1.4, { role:"gk", pose:"keeper", marker:true, exact:true });
      sit.attacker = add(them, 34, 16.6, { pose:"idle", exact:true });
    }
    add(me, 22, 21.5, { pose:"idle" });
    add(them, 27.5, 22.4, { pose:"idle" });
    add(them, 41, 21.8, { pose:"idle" });
    add(me, 46.5, 22.6, { pose:"idle" });
    sit.ball = { x: X(34), y: 11, z: 0 };
    sit.markers.push({ type: isGK ? "danger" : "control", at:[sit.ball.x, sit.ball.y] });
  } else if(type==="freekick"){
    // the ball about 23 m out, a wall of four 9.15 m from it on the line to the goal
    const e = (Math.random()<0.5 ? -1 : 1) * (3.5 + Math.random()*3);
    const bx = 34 + e, by = 23;
    const len = Math.hypot(34 - bx, by), ux = (34 - bx)/len, uy = -by/len;   // unit vector ball → goal
    const wx = bx + ux*9.15, wy = by + uy*9.15, qx = -uy, qy = ux;           // wall centre, and along the wall
    const wallTeam = isGK ? me : them;
    sit.wall = [-1.5, -0.5, 0.5, 1.5].map(k=> add(wallTeam, wx + qx*k*1.35, wy + qy*k*1.35, { pose:"idle", exact:true }));
    sit.wallCx = X(wx); sit.wallY = wy;
    const nearPost = e < 0 ? -1 : 1;
    if(!isGK){
      sit.hero = add(me, bx - ux*2.3 + qx*1.0, by - uy*2.3 + qy*1.0, { pose:"idle", marker:true, exact:true });
      sit.keeper = add(them, 34 + nearPost*1.3, 1.6, { role:"gk", pose:"keeper", exact:true });
      add(me, 40, 12, { pose:"jog" });
      add(me, 28, 10, { pose:"jog" });
      add(them, 33, 9.5, { pose:"idle" });
      add(them, 38.5, 13.5, { pose:"idle" });
    } else {
      sit.hero = add(me, 34 + nearPost*1.3, 1.5, { role:"gk", pose:"keeper", marker:true, exact:true });
      sit.attacker = add(them, bx - ux*2.3 + qx*1.0, by - uy*2.3 + qy*1.0, { pose:"idle", exact:true });
      add(me, 31, 8, { pose:"idle" });
      add(them, 40, 12, { pose:"jog" });
      add(them, 27, 11, { pose:"jog" });
    }
    sit.camera = { x: 34, y: 15, zoom: 13 };
    sit.ball = { x: X(bx), y: by, z: 0 };
    sit.ux = flip ? -ux : ux;    // the run to the goal, as it looks on the (possibly mirrored) pitch
    sit.markers.push({ type: isGK ? "danger" : "control", at:[sit.ball.x, sit.ball.y] });
  } else if(type==="corner"){
    // whoever is on the ball, the box is packed. Yours to take, or theirs to defend.
    const attack = !isGK && m.p.position!=="DEF";
    const s = flip ? -1 : 1;                                   // which corner: +1 is the taker's right
    sit.cornerSide = s; sit.cornerAttack = attack;
    sit.camera = { x: X(46.2), y: 20, zoom: 9.2 };
    const cx = 65.5, cy = 1.4;
    const mine  = [[29.5, 8.5], [37.5, 6.8], [33, 13], [43, 10.6]];
    const theirs = [[32.3, 7.2], [36.3, 9.8], [40.3, 7.2], [29, 11.6], [33.6, 14.2]];
    if(attack){
      sit.hero = add(me, cx, cy, { pose:"idle", marker:true, exact:true });
      sit.keeper = add(them, 34, 1.7, { role:"gk", pose:"keeper", exact:true });
      mine.forEach(q=> add(me, q[0], q[1], { pose:"idle" }));
      theirs.forEach(q=> add(them, q[0], q[1], { pose:"idle" }));
    } else {
      sit.taker = add(them, cx, cy, { pose:"idle", exact:true });
      if(isGK){
        sit.hero = add(me, 34, 2.5, { role:"gk", pose:"keeper", marker:true, exact:true });
      } else {
        sit.hero = add(me, 35.3, 8.3, { pose:"jog", marker:true });
        sit.keeper = add(me, 34, 1.7, { role:"gk", pose:"keeper", exact:true });
      }
      [[30, 7.5], [38.8, 6.1], [32, 12.6], [41.6, 10]].forEach(q=> add(me, q[0], q[1], { pose:"idle" }));
      [[31.7, 6.3], [36.2, 9.5], [40.2, 7.4], [29, 11], [34, 13.2]].forEach(q=> add(them, q[0], q[1], { pose:"idle" }));
    }
    sit.ball = { x: X(cx - 0.6), y: cy - 0.7, z: 0 };
    sit.markers.push({ type: attack ? "control" : "danger", at:[sit.ball.x, sit.ball.y] });
    // where a delivery can go, as the corner taker sees the box: near post, penalty spot, far post
    sit.cornerTargets = { N:{ x:34 + s*4.6, y:4.4 }, M:{ x:34, y:10.2 }, F:{ x:34 - s*4.6, y:4.8 } };
  } else { // save
    // a striker shaping to shoot from the edge of the box; you are the keeper
    sit.camera = { x: 34, y: 13, zoom: 16 };
    sit.hero = add(me, 34, 1.3, { role:"gk", pose:"keeper", marker:true, x: 34 });
    sit.attacker = add(them, 38, 17, { pose:"run" });
    add(me, 29, 12, { pose:"jog" });
    add(me, 45, 11, { pose:"jog" });
    add(them, 25, 16, { pose:"jog" });
    add(them, 48, 18, { pose:"jog" });
    sit.ball = { x: sit.attacker.x - 0.7, y: sit.attacker.y - 1, z: 0 };
    sit.markers.push({ type:"danger", at:[sit.ball.x, sit.ball.y] });
  }
  sit.hero.look = Career.playerLook();
  sit.me = me; sit.them = them; sit.flip = flip;
  return sit;
}

const SituationView = {
  sit:null, renderer:null, raf:null, tweens:[],

  _els(){
    if(!this.el){
      this.el = $("#situation");
      this.canvas = $("#situation-canvas");
      this.renderer = SoccerKit.createRenderer(this.canvas);
      const probe = document.createElement("div");
      probe.style.cssText = "position:fixed;top:0;padding-top:env(safe-area-inset-top,0px);visibility:hidden";
      document.body.appendChild(probe);
      this.safeTop = parseFloat(getComputedStyle(probe).paddingTop) || 0;
      probe.remove();
    }
  },

  show(sit){
    this._els();
    this.sit = sit;
    this.tweens = [];
    sit.hudTop = Math.max(14, this.safeTop + 10);
    sit.camera.screenY = 0.5;
    this.baseCam = { ...sit.camera };
    this.baseBall = { ...sit.ball };
    this.follow = false;
    this._lift = null;
    this.el.classList.remove("hidden");
    this.caption(situationTitle(sit));
    this.t0 = performance.now();
    cancelAnimationFrame(this.raf);
    const loop = (now)=>{
      this._step(now);
      this.renderer.render(this.sit, (now - this.t0)/1000);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  },

  hide(){
    cancelAnimationFrame(this.raf);
    this.raf = null;
    if(this.el) this.el.classList.add("hidden");
    this.sit = null;
  },

  caption(text){
    if(!this.sit) return;
    this.sit.caption = text;
    this.sit.captionAppear = 0;
    this._capT = performance.now();
  },

  // The minigame panel covers the lower part of the screen, so slide the
  // camera until the ball — and the goal too, when both fit — sits in the
  // strip between the scoreboard and the top of the panel.
  liftForPanel(panelTop){
    const sit = this.sit;
    if(!sit) return;
    if(panelTop == null){ this._lift = 0.5; return; }
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    const cam = SoccerKit.makeCamera(W, H, { ...sit.camera, screenY: 0.5 });
    const lo = sit.hudTop + H*0.09, hi = panelTop - H*0.05;
    const by = cam.proj(sit.ball.x, sit.ball.y).y, gy = cam.proj(34, 0).y;
    let shift = (lo + hi)/2 - (Math.min(by, gy) + Math.max(by, gy))/2;
    shift = Math.max(lo - by, Math.min(hi - by, shift));   // the ball always stays visible
    this._lift = 0.5 + shift/H;
  },

  _step(now){
    const sit = this.sit;
    if(sit.caption) sit.captionAppear = Math.min(1, (now - this._capT)/380);
    const cam = sit.camera;
    if(this._lift != null) cam.screenY += (this._lift - cam.screenY)*0.1;
    if(this.follow){
      // ease after the ball, but only part of the way and never more than a
      // few metres, so the goal stays in frame and the stands don't take over
      const lim = (d)=> Math.max(-5, Math.min(5, d*0.35));
      cam.x += (this.baseCam.x + lim(sit.ball.x - this.baseBall.x) - cam.x)*0.08;
      cam.y += (this.baseCam.y + lim(sit.ball.y - this.baseBall.y) - cam.y)*0.08;
    }
    if(sit.netRipple.top > 0.01) sit.netRipple.top *= 0.965; else sit.netRipple.top = 0;
    this.tweens = this.tweens.filter(tw=>{
      const k = Math.min(1, (now - tw.t0)/tw.dur);
      const e = tw.ease(k);
      for(const key in tw.to){
        tw.obj[key] = tw.from[key] + (tw.to[key] - tw.from[key])*e;
      }
      if(tw.arc) tw.obj.z = tw.from.z + (tw.to.z - tw.from.z)*e + Math.sin(Math.PI*k)*tw.arc;
      if(k>=1){ tw.done(); return false; }
      return true;
    });
    // markers stuck to the ball follow it
    for(const mk of sit.markers) if(mk.type==="control" || mk.type==="danger") mk.at = [sit.ball.x, sit.ball.y];
  },

  tween(obj, to, dur, {arc=0, ease=(k)=>1-Math.pow(1-k,3)}={}){
    return new Promise(done=>{
      const from = {};
      for(const k in to) from[k] = obj[k] || 0;
      if(arc) from.z = obj.z || 0, to = { ...to, z: to.z != null ? to.z : 0 };
      this.tweens.push({ obj, from, to, dur, arc, ease, done, t0: performance.now() });
    });
  },
  wait(ms){ return new Promise(r=> setTimeout(r, ms)); },

  shake(){
    this.canvas.classList.remove("shake");
    void this.canvas.offsetWidth;
    this.canvas.classList.add("shake");
  },

  _goal(side){
    const sit = this.sit;
    sit.netRipple.top = 0.55;
    sit[side].score++;
    this.shake();
  },

  // Plays the result of the minigame out on the pitch. Resolves when the
  // caller can move on to the log.
  // detail carries what the minigame decided (aim/dive zones, dribble lanes), so
  // the replay on the pitch goes the way the player chose — left is left.
  async playOutcome(type, success, detail){
    const sit = this.sit;
    if(!sit) return;
    sit.markers = sit.markers.filter(mk=> mk.type==="control");
    for(const pl of sit.players) pl.call = false;
    this.follow = true;
    this.caption(null);
    const b = sit.ball, hero = sit.hero;
    const side = (sgn)=> 34 + sgn*(1.6 + Math.random()*1.6); // a spot inside the goal mouth
    const sgn = Math.random()<0.5 ? -1 : 1;
    const inNet = (x, z=0.7)=> ({ x, y: -1.3, z });
    // the aim grid is thirds of the goal mouth (7.32 m), seen from behind the ball,
    // and the pitch camera looks the same way, so a zone's column is its screen side
    const ZX = 2.44;
    const zoneAt = (id)=>{ const z = zoneById(id); return { x: 34 + (z.col-1)*ZX, z: z.row===0 ? 1.8 : 0.45 }; };
    const leanFor = (x)=> Math.max(-0.9, Math.min(0.9, (x-34)/ZX*0.9));

    // penalties and free kicks play out like a shot at goal, or a save when you are in it
    const kind = type;
    const gkRole = hero.role === "gk";
    if(type==="penalty" || type==="freekick") type = gkRole ? "save" : "shoot";
    const wall = kind==="freekick" ? sit.wall : null;
    const wallHit = (x)=> {                               // where a low ball on the way to x meets the wall
      const t = (b.y - sit.wallY)/b.y;
      return { x: b.x + (x - b.x)*t, y: sit.wallY };
    };
    // the ball to a target, bending round the wall on the low side or over it on the high side
    const flight = async (tgt, dur, arc)=>{
      if(!wall || tgt.z >= 1.5) return this.tween(b, tgt, dur, { arc: wall ? Math.max(arc, 3.4) : arc });
      const around = { x: sit.wallCx + (tgt.x < sit.wallCx ? -1 : 1)*3.4, y: sit.wallY - 0.4, z: 0.8 };
      await this.tween(b, around, dur*0.55, { arc: 0.5 });
      return this.tween(b, tgt, dur*0.6, { arc: 0.4 });
    };
    // a shot that meets the wall: it stops dead, drops back, the goal never sees it
    const hitWall = async (x)=>{
      const h = wallHit(x);
      await this.tween(b, { x:h.x, y:h.y + 0.5, z:0.9 }, 460, { arc: 0.6 });
      await this.tween(b, { x:h.x + (h.x < sit.wallCx ? -1.2 : 1.2), y:h.y + 3.4, z:0 }, 380, { arc: 1.2 });
    };
    const runUp = async ()=>{
      const shooter = gkRole ? sit.attacker : hero;
      if(kind==="penalty"){ shooter.pose = "run"; await this.tween(shooter, { y: b.y + 1.4 }, 520); }
      else if(kind==="freekick"){ shooter.pose = "run"; await this.tween(shooter, { x: b.x - sit.ux*0.7, y: b.y + 0.9 }, 380); }
    };

    if(type==="shoot"){
      const gx = side(sgn);
      const shot = detail ? zoneAt(detail.shotZone) : { x: gx, z: 0.7 };
      const dive = detail ? zoneAt(detail.diveZone) : { x: success ? 34 - sgn*1.8 : gx };
      sit.markers.push({ type:"target", at:[shot.x, 0.8], r:0.9 });   // the spot you picked
      await runUp();
      hero.pose = "idle";
      const kY = sit.keeper.y;
      if(detail && detail.blocked){
        this.tween(sit.keeper, { x: dive.x, lean: leanFor(dive.x) }, 520);
        await hitWall(shot.x);
        this.caption("החומה חסמה!");
      } else if(success){
        this.tween(sit.keeper, { x: dive.x, lean: leanFor(dive.x) }, 520);
        await flight(inNet(shot.x, shot.z), 560, 1.4);
        this._goal(sit.me);
        hero.pose = "celebrate"; hero.marker = false;
        this.caption("גול!!!");
      } else {
        this.tween(sit.keeper, { x: dive.x, lean: leanFor(dive.x) }, 480);
        await flight({ x: shot.x, y: kY - 0.3, z: shot.z }, 520, 0.9);
        this.caption("השוער עוצר!");
      }
    } else if(type==="pass"){
      const m = sit.mate;
      if(success){
        await this.tween(b, { x: m.x, y: m.y - 0.8, z: sit.keeper ? 1.6 : 0 }, 720, { arc: sit.keeper ? 3.2 : 2.2 });
        if(sit.keeper){
          const gx = side(sgn);
          this.tween(sit.keeper, { x: 34 - sgn*1.6, lean: -sgn*0.85 }, 380);
          await this.tween(b, inNet(gx), 380, { arc: 0.3 });
          this._goal(sit.me);
          m.pose = "celebrate";
          this.caption("בישול! גול!");
        } else {
          m.pose = "idle";
          this.caption("מסירה מושלמת!");
        }
      } else {
        const cut = sit.blocker || sit.players.find(p=> p.team===sit.them && p.role!=="gk");
        this.tween(cut, { x: (cut.x + m.x)/2, y: (cut.y + m.y)/2 }, 500);
        await this.tween(b, { x: (cut.x + m.x)/2, y: (cut.y + m.y)/2 - 0.8, z: 0 }, 560, { arc: 1.6 });
        this.caption("המסירה נחטפה!");
      }
    } else if(type==="dribble"){
      const d = sit.defender;
      // the swipe picks a lane, left/centre/right of where you stand, and the defender
      // has read one too; without detail, fall back to a random side
      const off = { L:-3.2, C:0, R:3.2 };
      const lane = detail ? detail.lane : (Math.random()<0.5 ? "L" : "R");
      const defLane = detail ? detail.defLane : (success ? (lane==="L" ? "R" : "L") : lane);
      const hx = hero.x + off[lane];          // where you run
      const dx = hero.x + off[defLane];       // where he lunges
      if(success){
        hero.marker = false;
        this.tween(d, { x: dx, y: d.y + 1.2, lean: defLane==="L" ? -0.8 : defLane==="R" ? 0.8 : 0 }, 450);
        this.tween(hero, { x: hx, y: d.y - 6 }, 760);
        await this.tween(b, { x: hx + 0.5, y: d.y - 6.9 }, 760);
        this.caption("עבר אותו!");
      } else {
        // he reaches you: dead on if you picked the same lane, a shoulder challenge if next to it
        const meet = hx + (dx - hx)*0.3;
        this.tween(hero, { x: hx, y: hero.y - 2 }, 420);
        this.tween(b, { x: hx + 0.5, y: hero.y - 2.9 }, 420);   // the ball goes with you
        this.tween(d, { x: meet, y: b.y - 2.2 }, 380);
        await this.wait(380);
        d.pose = "run";
        this.tween(d, { y: d.y + 7 }, 700);
        await this.tween(b, { x: meet + 0.4, y: b.y + 5 }, 700);
        hero.pose = "idle";
        this.caption("איבדת את הכדור!");
      }
    } else if(type==="defend"){
      const a = sit.attacker;
      if(success){
        await this.tween(hero, { x: b.x - 0.6, y: b.y + 0.3 }, 460);
        a.pose = "idle";
        await this.tween(b, { x: b.x + (b.x < 34 ? -18 : 18), y: b.y + 12, z: 0 }, 820, { arc: 4 });
        this.caption("התערבות מושלמת!");
      } else {
        this.tween(hero, { x: b.x - 2, y: b.y + 1 }, 520);
        const gx = side(sgn);
        this.tween(sit.keeper, { x: 34 - sgn*1.8, lean: -sgn*0.9 }, 560);
        await this.tween(b, inNet(gx), 620, { arc: 1.2 });
        this._goal(sit.them);
        a.pose = "celebrate";
        this.caption("גול ליריבה");
      }
    } else if(type==="corner"){
      const s = sit.cornerSide;
      const near = (arr, x, y)=> arr.reduce((a, c)=> Math.hypot(c.x - x, c.y - y) < Math.hypot(a.x - x, a.y - y) ? c : a);
      const mates = sit.players.filter(q=> q.team===sit.me && q.role!=="gk" && q!==hero);
      const foes = sit.players.filter(q=> q.team===sit.them && q.role!=="gk" && q!==sit.taker);
      const clearTo = { x: 34 - s*13, y: 22 };            // out to the far wing, away from the taker
      if(sit.cornerAttack){
        // your delivery goes where you sent it; what happens to it is what the minigame showed
        const z = sit.cornerTargets[(detail && detail.zone) || "M"];
        const result = detail ? detail.result : (success ? "goal" : "cleared");
        hero.pose = "run";
        await this.tween(b, { x:z.x, y:z.y, z:1.9 }, 900, { arc: 4.5 });
        hero.pose = "idle"; hero.marker = false;
        if(result==="goal"){
          const h = near(mates, z.x, z.y);
          this.tween(h, { x:z.x, y:z.y + 0.6 }, 250);
          const gx = 34 + (Math.random()<0.5 ? -1 : 1)*(1.2 + Math.random()*1.5);
          this.tween(sit.keeper, { x: 34 - (gx - 34), lean: leanFor(34 - (gx - 34)) }, 420);
          await this.tween(b, inNet(gx, 0.9), 380, { arc: 0.4 });
          this._goal(sit.me);
          h.pose = "celebrate";
          this.caption("גול מקרן!");
        } else if(result==="saved"){
          this.tween(sit.keeper, { x: b.x, lean: leanFor(b.x) }, 380);
          await this.tween(b, { x: b.x, y: sit.keeper.y + 0.8, z: 0.9 }, 380);
          this.caption("השוער עוצר!");
        } else if(result==="wide"){
          await this.tween(b, { x: 34 + (z.x >= 34 ? 1 : -1)*6.6, y: -1.4, z: 3.4 }, 460, { arc: 0.6 });
          this.caption("הנגיחה יצאה החוצה");
        } else {
          const d = near(foes, z.x, z.y);
          this.tween(d, { x:z.x, y:z.y + 0.5 }, 250);
          await this.tween(b, { x:clearTo.x, y:clearTo.y, z:0 }, 800, { arc: 5 });
          this.caption("ההגנה מנקה!");
        }
      } else {
        // theirs: it lands on you (or in front of your keeper) and the timing decides
        const land = gkRole ? { x: 34 + (Math.random()<0.5 ? -1 : 1)*0.8, y: 5.4 } : { x: hero.x, y: hero.y - 0.4 };
        sit.taker.pose = "run";
        await this.tween(b, { x:land.x, y:land.y, z:1.9 }, 900, { arc: 4.5 });
        sit.taker.pose = "idle";
        if(success){
          hero.marker = false;
          if(gkRole){
            this.tween(hero, { y: hero.y + 1.2 }, 260);
            await this.tween(b, { x:hero.x, y:hero.y + 1.0, z:1.2 }, 300);
            this.caption("תפסת את הכדור!");
          } else {
            this.tween(hero, { x:land.x, y:land.y + 0.5 }, 200);
            await this.tween(b, { x:clearTo.x, y:clearTo.y, z:0 }, 800, { arc: 5 });
            this.caption("ניקית את הקרן!");
          }
        } else {
          const a = near(foes, land.x, land.y);
          this.tween(a, { x:land.x, y:land.y + 0.5 }, 250);
          const gx = 34 + (Math.random()<0.5 ? -1 : 1)*(1.2 + Math.random()*1.5);
          const keeper = gkRole ? hero : sit.keeper;
          this.tween(keeper, { x: 34 - (gx - 34), lean: leanFor(34 - (gx - 34)) }, 420);
          await this.tween(b, inNet(gx, 0.9), 380, { arc: 0.4 });
          this._goal(sit.them);
          a.pose = "celebrate";
          this.caption("גול מקרן ליריבה");
        }
      }
    } else { // save
      const gx = side(sgn);
      const shot = detail ? zoneAt(detail.shotZone) : { x: gx, z: 0.7 };
      const dive = detail ? zoneAt(detail.diveZone) : { x: success ? gx : 34 - sgn*1.8 };
      await runUp();
      if(sit.attacker) sit.attacker.pose = "idle";
      if(detail && detail.blocked){
        this.tween(hero, { x: dive.x, lean: leanFor(dive.x) }, 470);
        await hitWall(shot.x);
        this.caption("החומה חסמה!");
      } else if(success){
        this.tween(hero, { x: dive.x, lean: leanFor(dive.x) }, 430);
        await flight({ x: shot.x, y: hero.y + 0.5, z: shot.z }, 460, 0.8);
        this.caption("הצלה!!");
      } else {
        this.tween(hero, { x: dive.x, lean: leanFor(dive.x) }, 470);
        await flight(inNet(shot.x, shot.z), 500, 1);
        this._goal(sit.them);
        sit.attacker.pose = "celebrate";
        this.caption("גול ליריבה");
      }
    }
    await this.wait(1500);
  },
};
