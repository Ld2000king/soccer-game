// ===== Corner minigame: pick where to deliver the ball =====
// A top-down view of the penalty area with the goal at the top, drawn from the
// same situation as the big pitch behind it (same players, same side of the
// pitch), so a delivery to the near post is the near post on both. Three
// targets: the near post, the penalty spot and the far post. The defence has
// picked one to cover; an uncovered delivery still has to be headed home.

const CORNER_ZONES = [
  { id:"N", label:"קרוב" },
  { id:"M", label:"נקודת הפנדל" },
  { id:"F", label:"רחוק" },
];
function cornerAdjacent(a, b){
  return Math.abs("NMF".indexOf(a) - "NMF".indexOf(b)) === 1;
}

class CornerPick{
  // sit: the situation being shown on the pitch — its players, kits, corner side and targets
  constructor(canvas, hint, {atkSkill, defSkill, sit}){
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.hint = hint;
    this.atkSkill = atkSkill;
    this.defSkill = defSkill;
    this.sit = sit;
    this.W = canvas.width; this.H = canvas.height;
    this.S = 6;                                   // px per metre
    this.xmin = sit.cornerSide > 0 ? 14.5 : 0.2;  // the corner being taken stays on the edge of the frame
    this.ymin = -6;
    this.locked = false;
    this.phase = "idle";
    this.ball = { x: sit.ball.x, y: sit.ball.y, lift: 0 };
    this.result = null;
    this.covered = null;
    this.chosen = null;
    this._raf = null;
    this._down = null;
  }

  start(onResolve){
    this.onResolve = onResolve;
    this.hint.textContent = "גע במקום שאליו תרצה לשלוח את הכדור";
    this._loop();
    this._down = (ev)=> this._handle(ev);
    this.canvas.addEventListener("pointerdown", this._down);
  }

  stop(){
    if(this._raf) cancelAnimationFrame(this._raf);
    if(this._down) this.canvas.removeEventListener("pointerdown", this._down);
  }

  _px(x, y){ return { x:(x - this.xmin)*this.S, y:(y - this.ymin)*this.S }; }

  _handle(ev){
    if(this.locked) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * this.canvas.width / rect.width;
    const y = (ev.clientY - rect.top) * this.canvas.height / rect.height;
    let best = null, bestD = Infinity;
    CORNER_ZONES.forEach(z=>{
      const t = this._px(this.sit.cornerTargets[z.id].x, this.sit.cornerTargets[z.id].y);
      const d = Math.hypot(t.x - x, t.y - y);
      if(d < bestD){ bestD = d; best = z.id; }
    });
    this.locked = true;
    this._resolve(best);
  }

  // the defence covers one zone; the better they are than you, the likelier it is yours
  _defenceCover(zoneId){
    const read = Math.max(0.12, Math.min(0.65, 0.25 + (this.defSkill - this.atkSkill)/150));
    if(Math.random() < read) return zoneId;
    return randPick(CORNER_ZONES.filter(z=>z.id!==zoneId)).id;
  }

  _resolve(zoneId){
    this.chosen = zoneId;
    const covered = this._defenceCover(zoneId);
    this.covered = covered;

    // Same rule as the other minigames: what the player sees decides it. Meeting the
    // cover head-on is a clearance, a delivery to the far side of the box is clean,
    // and only the neighbouring zone is a contest.
    const brush = Math.max(0.2, Math.min(0.9, 0.55 + (this.atkSkill - this.defSkill)/140));
    const reaches = zoneId===covered ? false
      : cornerAdjacent(zoneId, covered) ? Math.random() < brush
      : true;
    let result;
    if(!reaches) result = "cleared";
    else {
      const finish = Math.max(0.25, Math.min(0.75, 0.55 + (this.atkSkill - this.defSkill)/200));
      if(Math.random() < finish) result = "goal";
      else result = Math.random() < 0.6 ? "saved" : "wide";
    }
    this.result = result;

    const target = this.sit.cornerTargets[zoneId];
    const start = { x:this.ball.x, y:this.ball.y };
    const t0 = performance.now(), dur = 700;
    this.phase = "animating";
    const step = (now)=>{
      const p = Math.min(1, (now - t0)/dur), e = 1 - Math.pow(1-p, 2);
      this.ball.x = start.x + (target.x - start.x)*e;
      this.ball.y = start.y + (target.y - start.y)*e;
      this.ball.lift = Math.sin(Math.PI*p) * 26;
      if(p < 1) requestAnimationFrame(step);
      else this._landed();
    };
    requestAnimationFrame(step);
  }

  _landed(){
    this.phase = "landed";
    this.ball.lift = 0;
    this.hint.textContent = {
      goal:"נגיחה... וזה גול!",
      saved:"נגיחה חזקה, אבל השוער עוצר.",
      wide:"הנגיחה עפה מעל הקורה.",
      cleared:"ההגנה ניקתה את הכדור.",
    }[this.result];
    // the pitch replays exactly this delivery, and what happened to it
    const detail = { zone:this.chosen, covered:this.covered, result:this.result };
    setTimeout(()=> this.onResolve(this.result==="goal" ? 1 : 0, detail), 800);
  }

  _loop(){
    const draw = (now)=>{
      this._draw((now||0)/1000);
      this._raf = requestAnimationFrame(draw);
    };
    draw(0);
  }

  _backdrop(){
    if(this._bg) return this._bg;
    const W=this.W, H=this.H, S=this.S, P=SoccerKit.PAL;
    const c = document.createElement("canvas"); c.width=W; c.height=H;
    const g = c.getContext("2d");
    for(let i=0;i<9;i++){
      g.fillStyle = i%2 ? P.grassA : P.grassB;
      g.fillRect(0, H/9*i, W, H/9+1);
    }
    g.fillStyle = SoccerKit.makeNoisePattern(g); g.fillRect(0,0,W,H);
    // world → canvas for the markings
    g.setTransform(S,0,0,S, -this.xmin*S, -this.ymin*S);
    g.strokeStyle = "rgba(255,255,255,.94)"; g.lineWidth = 0.2;
    g.strokeRect(13.84, 0, 40.32, 16.5);
    g.strokeRect(24.84, 0, 18.32, 5.5);
    g.beginPath(); g.moveTo(-10, 0); g.lineTo(80, 0); g.stroke();
    g.beginPath(); g.arc(34, 11, 9.15, Math.asin(5.5/9.15), Math.PI - Math.asin(5.5/9.15)); g.stroke();
    g.fillStyle = "rgba(255,255,255,.94)";
    g.beginPath(); g.arc(34, 11, 0.3, 0, Math.PI*2); g.fill();
    // corner arc on whichever side the kick comes from
    const cx = this.sit.cornerSide > 0 ? 68 : 0;
    g.beginPath(); g.arc(cx, 0, 1, 0, Math.PI*2); g.stroke();
    // the goal: posts and a diamond net behind the line
    g.fillStyle = "rgba(255,255,255,.14)"; g.fillRect(30.34, -2.2, 7.32, 2.2);
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 0.08;
    for(let k=-2.2; k<=7.32; k+=0.9){ g.beginPath(); g.moveTo(30.34+k, -2.2); g.lineTo(30.34+k+2.2, 0); g.moveTo(30.34+k+2.2, -2.2); g.lineTo(30.34+k, 0); g.stroke(); }
    g.strokeStyle = "#fff"; g.lineWidth = 0.32;
    g.beginPath(); g.moveTo(30.34, 0); g.lineTo(30.34, -2.2); g.lineTo(37.66, -2.2); g.lineTo(37.66, 0); g.stroke();
    return (this._bg = c);
  }

  _draw(t){
    const ctx = this.ctx, W=this.W, H=this.H, sit=this.sit;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,W,H);
    ctx.drawImage(this._backdrop(), 0, 0);

    // players, back to front, as they stand on the pitch
    const figs = sit.players.slice().sort((a,b)=> a.y - b.y);
    figs.forEach((pl, i)=>{
      const p = this._px(pl.x, pl.y);
      const team = sit[pl.team];
      const kit = pl.role==="gk" ? (team.gkKit || SoccerKit.KITS.keeper) : team.kit;
      const look = pl.look || { skin:["#f2caa4", "#e3a97f", "#c0864f", "#8a5530"][i%4], hair:["#1e1611", "#4a3021", "#d9b45a"][i%3], style:"short" };
      SoccerKit.drawFigure(ctx, p.x, p.y + 4, 24, kit, look, { pose: pl.pose==="keeper" ? "keeper" : "idle", seed:i*1.3, facing:"right", marker: pl.marker }, t);
    });

    // the three delivery targets
    CORNER_ZONES.forEach(z=>{
      const w = sit.cornerTargets[z.id], p = this._px(w.x, w.y);
      const chosen = this.chosen===z.id, cover = this.covered===z.id && this.phase==="landed";
      const pulse = 1 + Math.sin(t*4 + z.id.charCodeAt(0))*0.07;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = chosen ? "rgba(255,225,60,.4)" : cover ? "rgba(255,80,70,.28)" : "rgba(255,236,90,.16)";
      ctx.strokeStyle = cover ? "rgba(255,90,80,.9)" : "rgba(255,236,90,.85)";
      ctx.beginPath(); ctx.arc(p.x, p.y, 13*pulse, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y, 6*pulse, 0, Math.PI*2); ctx.stroke();
      if(!this.chosen){
        ctx.save();
        ctx.font = `700 11px ${SoccerKit.FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "rtl";
                const tw = ctx.measureText(z.label).width + 12;
        ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.beginPath(); ctx.roundRect(p.x - tw/2, p.y + 18, tw, 16, 8); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.fillText(z.label, p.x, p.y + 26.5);
        ctx.restore();
      }
    });

    // the ball, lifted by its arc, with its shadow left on the grass
    const b = this._px(this.ball.x, this.ball.y);
    ctx.fillStyle = "rgba(0,25,0,.35)";
    ctx.beginPath(); ctx.ellipse(b.x + 3, b.y + 3, 6, 3, 0, 0, Math.PI*2); ctx.fill();
    SoccerKit.drawBallIcon(ctx, b.x, b.y - 4 - this.ball.lift, 5.5, this.phase==="animating" ? t*14 : 0);
  }
}
