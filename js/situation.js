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
};

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
  const add = (team, x, y, o={})=>{ const pl = { team, x: _jit(X(x), 0.8), y: _jit(y, 0.8), ...o }; sit.players.push(pl); return pl; };

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
    sit.markers.push({ type:"target", at:[X(31.5), 0.8], r:0.9 });
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
    this.caption(SITUATION_TITLES[sit.type]);
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
  async playOutcome(type, success){
    const sit = this.sit;
    if(!sit) return;
    sit.markers = sit.markers.filter(mk=> mk.type==="control");
    for(const pl of sit.players) pl.call = false;
    this.follow = true;
    this.caption(null);
    const b = sit.ball, hero = sit.hero;
    const side = (sgn)=> 34 + sgn*(1.6 + Math.random()*1.6); // a spot inside the goal mouth
    const sgn = Math.random()<0.5 ? -1 : 1;
    const inNet = (x)=> ({ x, y: -1.3, z: 0.7 });

    if(type==="shoot"){
      const gx = side(sgn);
      if(success){
        this.tween(sit.keeper, { x: 34 - sgn*1.8, lean: -sgn*0.9 }, 520);
        await this.tween(b, inNet(gx), 560, { arc: 1.4 });
        this._goal(sit.me);
        hero.pose = "celebrate"; hero.marker = false;
        this.caption("גול!!!");
      } else {
        this.tween(sit.keeper, { x: gx, lean: sgn*0.9 }, 480);
        await this.tween(b, { x: gx, y: 3.3, z: 0.9 }, 520, { arc: 0.9 });
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
      const dir = hero.x < 34 ? 1 : -1;
      if(success){
        hero.marker = false;
        this.tween(d, { x: d.x - dir*2.2, lean: -dir*0.8 }, 450);
        this.tween(hero, { x: hero.x + dir*3.5, y: d.y - 6 }, 760);
        await this.tween(b, { x: hero.x + dir*3.5 + 0.5, y: d.y - 6.9 }, 760);
        this.caption("עבר אותו!");
      } else {
        this.tween(hero, { y: hero.y - 2 }, 420);
        this.tween(d, { x: b.x, y: b.y - 0.6 }, 380);
        await this.wait(380);
        d.pose = "run";
        this.tween(d, { y: d.y + 7 }, 700);
        await this.tween(b, { y: b.y + 7.4 }, 700);
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
    } else { // save
      const gx = side(sgn);
      if(success){
        this.tween(hero, { x: gx, lean: sgn*0.9 }, 430);
        await this.tween(b, { x: gx, y: 1.8, z: 0.9 }, 460, { arc: 0.8 });
        this.caption("הצלה!!");
      } else {
        this.tween(hero, { x: 34 - sgn*1.8, lean: -sgn*0.9 }, 470);
        await this.tween(b, inNet(gx), 500, { arc: 1 });
        this._goal(sit.them);
        sit.attacker.pose = "celebrate";
        this.caption("גול ליריבה");
      }
    }
    await this.wait(1500);
  },
};
