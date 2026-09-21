// ===== Close-up swipe-to-dribble minigame =====
// Swipe left/right (or a short tap for straight through the middle) to pick
// a lane past the defender. A human-silhouette close-up, not a full pitch.

const DRIBBLE_LANES = [
  { id:"L", x:0.24 },
  { id:"C", x:0.5 },
  { id:"R", x:0.76 },
];

function dribbleLaneIndex(id){ return DRIBBLE_LANES.findIndex(l=>l.id===id); }
function dribbleLanesAdjacent(a,b){
  if(a===b) return false;
  return Math.abs(dribbleLaneIndex(a)-dribbleLaneIndex(b))===1;
}

class DribbleChallenge{
  constructor(canvas, hint, {attackerSkill, defenderSkill, kits}){
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.hint = hint;
    this.attackerSkill = attackerSkill;
    this.defenderSkill = defenderSkill;
    // both figures wear their real club's colours; the caller resolves any clash
    this.kits = kits || { mine:{shirt:"#00b386", shorts:"#ffd23f"}, theirs:{shirt:"#d21f3c", shorts:"#ffffff"} };
    this.W = canvas.width; this.H = canvas.height;
    this.locked = false;
    this.phase = "idle"; // idle -> animating -> done
    this.time = 0;
    this._raf = null;
    this._down = null;

    const heroX = this.W*0.5, heroY = this.H*0.82;
    const defX = this.W*0.5, defY = this.H*0.34;
    this.hero = { x:heroX, y:heroY };
    this.ball = { x:heroX, y:heroY+12 };
    this.defender = { x:defX, y:defY };
  }

  start(onResolve){
    this.onResolve = onResolve;
    this.hint.textContent = "החלק אצבע שמאלה או ימינה כדי לעבור את המגן";
    this._loop();
    this._downHandler = (ev)=>{ if(this.locked) return; this._down = this._pt(ev); };
    this._upHandler = (ev)=>{
      if(this.locked || !this._down) return;
      const up = this._pt(ev);
      const dx = up.x - this._down.x;
      this._down = null;
      let laneId = "C";
      if(dx < -20) laneId = "L";
      else if(dx > 20) laneId = "R";
      this._resolve(laneId);
    };
    this.canvas.addEventListener("pointerdown", this._downHandler);
    this.canvas.addEventListener("pointerup", this._upHandler);
  }

  stop(){
    if(this._raf) cancelAnimationFrame(this._raf);
    if(this._downHandler) this.canvas.removeEventListener("pointerdown", this._downHandler);
    if(this._upHandler) this.canvas.removeEventListener("pointerup", this._upHandler);
  }

  _pt(ev){
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width/rect.width;
    return { x:(ev.clientX-rect.left)*scaleX };
  }

  _resolve(userLaneId){
    this.locked = true;
    const defLaneId = this._defenderPick(userLaneId);

    // Same rule as the shootout: what the player watches decides it. Running
    // straight into the defender is a loss, going round the outside is a beat,
    // and only the shoulder-to-shoulder case is left to a skill roll — a die
    // throw must never contradict the lane the hero visibly took.
    const success = userLaneId===defLaneId ? false
      : dribbleLanesAdjacent(userLaneId, defLaneId) ? Math.random() < this._brushChance()
      : true;

    this._animate(userLaneId, defLaneId, success, ()=>{
      // after the play, so the hint no longer gives the result away up front
      this.hint.textContent = success ? "עבר את המגן!" : "המגן חטף את הכדור!";
      setTimeout(()=> this.onResolve(success ? 1 : 0), 450);
    });
  }

  // defender "reads" the dribbler; better defenderSkill relative to attackerSkill = more likely correct
  _defenderPick(userLaneId){
    const readChance = Math.max(0.12, Math.min(0.7, 0.22 + (this.defenderSkill-this.attackerSkill)/150));
    if(Math.random() < readChance) return userLaneId;
    const others = DRIBBLE_LANES.filter(l=>l.id!==userLaneId);
    return randPick(others).id;
  }

  // only used for the contested case: hero and defender end up in neighbouring
  // lanes and brush shoulders, so the better player usually comes out with it
  _brushChance(){
    return Math.max(0.2, Math.min(0.92, 0.62 + (this.attackerSkill-this.defenderSkill)/140));
  }

  _animate(userLaneId, defLaneId, success, done){
    const lane = DRIBBLE_LANES[dribbleLaneIndex(userLaneId)];
    const defLane = DRIBBLE_LANES[dribbleLaneIndex(defLaneId)];
    const heroStart = { x:this.hero.x, y:this.hero.y };
    const defStart = { x:this.defender.x, y:this.defender.y };
    const heroTarget = success
      ? { x:lane.x*this.W, y:this.H*0.12 }
      : { x:lane.x*this.W, y:this.H*0.5 };
    const defTarget = { x:defLane.x*this.W, y:success ? this.H*0.5 : this.H*0.6 };
    const dur = 520;
    const t0 = performance.now();
    this.phase = "animating";
    const step = (now)=>{
      const p = Math.min(1,(now-t0)/dur);
      const e = 1-Math.pow(1-p,3);
      this.hero.x = heroStart.x+(heroTarget.x-heroStart.x)*e;
      this.hero.y = heroStart.y+(heroTarget.y-heroStart.y)*e;
      this.ball.x = this.hero.x;
      this.ball.y = this.hero.y+12;
      this.defender.x = defStart.x+(defTarget.x-defStart.x)*e;
      this.defender.y = defStart.y+(defTarget.y-defStart.y)*e;
      if(p<1) requestAnimationFrame(step);
      else { this.phase="done"; done(); }
    };
    requestAnimationFrame(step);
  }

  _loop(){
    const draw = (t)=>{
      this.time = (t||0)/1000;
      this._draw();
      if(this.phase!=="done") this._raf = requestAnimationFrame(draw);
    };
    draw();
  }

  // Top-down close-up in the soccer-game style: striped daylight grass with
  // the edge of the box ahead, chunky kit figures, ball under a control ring.
  _backdrop(){
    if(this._bg) return this._bg;
    const W=this.W, H=this.H, P = SoccerKit.PAL;
    const c = document.createElement("canvas"); c.width=W; c.height=H;
    const g = c.getContext("2d");
    const stripes = 6;
    for(let i=0;i<stripes;i++){
      g.fillStyle = i%2 ? P.grassA : P.grassB;
      g.fillRect(0, H/stripes*i, W, H/stripes+1);
    }
    g.fillStyle = SoccerKit.makeNoisePattern(g); g.fillRect(0,0,W,H);
    // the penalty box you are running at, and its D
    g.strokeStyle = "rgba(255,255,255,.94)"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, H*0.1); g.lineTo(W, H*0.1); g.stroke();
    g.beginPath(); g.ellipse(W/2, H*0.1 - H*0.2, W*0.3, H*0.26, 0, 0.35*Math.PI, 0.65*Math.PI); g.stroke();
    return (this._bg = c);
  }

  _draw(){
    const ctx = this.ctx, W=this.W, H=this.H;
    ctx.clearRect(0,0,W,H);
    ctx.drawImage(this._backdrop(), 0, 0);
    // lane guides
    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.lineWidth = 1.5; ctx.setLineDash([6,6]);
    ctx.beginPath(); ctx.moveTo(W/3,H*0.1); ctx.lineTo(W/3,H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2*W/3,H*0.1); ctx.lineTo(2*W/3,H); ctx.stroke();
    ctx.setLineDash([]);

    // control ring under the ball: this ball is yours
    const pulse = 1 + Math.sin(this.time*4)*0.06;
    ctx.fillStyle = "rgba(110,255,110,.28)"; ctx.strokeStyle = "rgba(110,255,110,.75)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(this.ball.x, this.ball.y+2, 15*pulse, 11*pulse, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // depth order: whoever is further up the screen is drawn first
    const figs = [
      { o:this.defender, kit:this.kits.theirs, h:52, hero:false },
      { o:this.hero, kit:this.kits.mine, h:56, hero:true },
    ].sort((a,b)=> a.o.y - b.o.y);
    for(const f of figs) this._drawFigure(f.o.x, f.o.y, f.kit, f.h, f.hero);

    ctx.fillStyle = "rgba(0,25,0,.35)";
    ctx.beginPath(); ctx.ellipse(this.ball.x+3, this.ball.y+3, 6, 3, 0, 0, Math.PI*2); ctx.fill();
    SoccerKit.drawBallIcon(ctx, this.ball.x, this.ball.y - 2, 5.5, this.phase==="animating" ? this.time*12 : 0);
  }

  _drawFigure(x, y, kit, h, hero){
    // (x, y) is the body centre the animation moves; the figure stands on its feet below it
    SoccerKit.drawFigure(this.ctx, x, y + 16, h, kit,
      hero ? { skin:"#e3a97f", hair:"#6a4424" } : { skin:"#c0864f", hair:"#1e1611" },
      { pose:"run", seed: hero ? 0 : 1.6, marker: hero ? heroRingColor(kit.shirt) : false }, this.time);
  }
}
