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

  _draw(){
    const ctx = this.ctx, W=this.W, H=this.H;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#0c3f24";
    ctx.fillRect(0,0,W,H);
    const stripes = 8;
    for(let i=0;i<stripes;i++){
      ctx.fillStyle = i%2===0 ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.05)";
      ctx.fillRect(0, H/stripes*i, W, H/stripes+1);
    }
    // lane guides
    ctx.strokeStyle = "rgba(255,210,63,.25)";
    ctx.lineWidth = 1.5; ctx.setLineDash([5,4]);
    ctx.beginPath(); ctx.moveTo(W/3,0); ctx.lineTo(W/3,H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2*W/3,0); ctx.lineTo(2*W/3,H); ctx.stroke();
    ctx.setLineDash([]);

    this._drawFigure(this.defender.x, this.defender.y, this.kits.theirs.shirt, this.kits.theirs.shorts, 1);
    this._drawFigure(this.hero.x, this.hero.y, this.kits.mine.shirt, this.kits.mine.shorts, 1.1, true);

    // ball
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, 6, 0, Math.PI*2);
    ctx.fillStyle = "#fff"; ctx.fill();
    ctx.strokeStyle = "#222"; ctx.lineWidth = 1; ctx.stroke();
  }

  _drawFigure(x, y, color, secondary, s, hero){
    const ctx = this.ctx;
    const cycle = this.time*5 + (hero?0:1.6);
    const legSwing = Math.sin(cycle)*3*s;
    ctx.beginPath();
    ctx.ellipse(x, y+15*s, 9*s, 3*s, 0,0,Math.PI*2);
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fill();

    ctx.strokeStyle = "#1c1c1c"; ctx.lineWidth = 3*s; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x-2.5*s,y+3*s); ctx.lineTo(x-2.5*s+legSwing*0.4,y+13*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+2.5*s,y+3*s); ctx.lineTo(x+2.5*s-legSwing*0.4,y+13*s); ctx.stroke();

    ctx.fillStyle = secondary;
    ctx.fillRect(x-4.5*s, y+1.5*s, 9*s, 4*s);

    ctx.beginPath();
    ctx.ellipse(x, y-3*s, 7*s, 8*s, 0,0,Math.PI*2);
    ctx.fillStyle = color; ctx.fill();
    // dark rim first so a green kit still separates from the green pitch,
    // then the club's second colour on top
    ctx.lineWidth = 2.6; ctx.strokeStyle = "rgba(4,12,8,.7)"; ctx.stroke();
    ctx.lineWidth = 1.4; ctx.strokeStyle = secondary; ctx.stroke();

    if(hero){
      // the "this one is you" ring used to be gold, which vanished on a yellow
      // shirt now that kits follow the clubs
      ctx.beginPath();
      ctx.arc(x, y-2*s, 20*s, 0, Math.PI*2);
      ctx.strokeStyle = heroRingColor(color); ctx.lineWidth = 2.4; ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(x, y-14*s, 4*s, 0, Math.PI*2);
    ctx.fillStyle = "#e3ac82"; ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y-15.5*s, 4*s, Math.PI, Math.PI*2);
    ctx.fillStyle = "#2b1a10"; ctx.fill();
  }
}
