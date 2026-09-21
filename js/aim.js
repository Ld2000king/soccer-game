// ===== Visual aim-the-shot minigame: pick a spot in the goal, watch it play out =====

const AIM_ZONES = [
  { id:"TL", row:0, col:0, saveBase:0.42 },
  { id:"TC", row:0, col:1, saveBase:0.55 },
  { id:"TR", row:0, col:2, saveBase:0.42 },
  { id:"BL", row:1, col:0, saveBase:0.68 },
  { id:"BC", row:1, col:1, saveBase:0.82 },
  { id:"BR", row:1, col:2, saveBase:0.68 },
];

function zoneById(id){ return AIM_ZONES.find(z=>z.id===id); }
function zonesAdjacent(a,b){
  if(a===b) return false;
  const za=zoneById(a), zb=zoneById(b);
  return za.row===zb.row || za.col===zb.col;
}
function clamp01(v){ return Math.max(0, Math.min(1, v)); }

function zoneCenter(zone, W, H){
  const colW = W/3, rowH = H*0.62/2; // goal mouth occupies top 62% of canvas
  return { x: colW*(zone.col+0.5), y: rowH*(zone.row+0.5) + H*0.06 };
}

class AimShootout{
  // mode: "shoot" (user aims at goal, AI keeper reacts) or "save" (user is keeper choosing dive, AI striker shoots)
  constructor(canvas, hint, mode, {attackerSkill, keeperSkill, keeperKit}){
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.hint = hint;
    this.mode = mode;
    this.attackerSkill = attackerSkill;
    this.keeperSkill = keeperSkill;
    // the keeper belongs to a real club: yours when you are diving, the
    // opponent's when you are shooting at them
    this.keeperKit = keeperKit || { shirt:"#ffd23f", shorts:"#111111" };
    this.W = canvas.width; this.H = canvas.height;
    this.locked = false;
    this.t = 0;
    this.phase = "idle"; // idle -> animating -> done
    this.ball = { x:this.W/2, y:this.H-14 };
    this.keeper = { x:this.W/2, y: this.H*0.68 - 92*0.5 };
    this._raf = null;
    this._clickHandler = null;
  }

  start(onResolve){
    this.onResolve = onResolve;
    this.hint.textContent = this.mode==="shoot"
      ? "גע ברשת כדי לבחור לאן לבעוט"
      : "גע ברשת כדי לבחור לאן לצלול";
    this._loop();
    this._clickHandler = (ev)=> this._handleClick(ev);
    this.canvas.addEventListener("pointerdown", this._clickHandler);
  }

  stop(){
    if(this._raf) cancelAnimationFrame(this._raf);
    if(this._clickHandler) this.canvas.removeEventListener("pointerdown", this._clickHandler);
  }

  _handleClick(ev){
    if(this.locked) return;
    this.locked = true;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width/rect.width, scaleY = this.canvas.height/rect.height;
    const x = (ev.clientX-rect.left)*scaleX, y = (ev.clientY-rect.top)*scaleY;
    const col = Math.max(0, Math.min(2, Math.floor(x/(this.W/3))));
    const row = y < this.H*0.5 ? 0 : 1;
    const chosen = AIM_ZONES.find(z=>z.row===row && z.col===col);
    this._resolve(chosen.id);
  }

  _resolve(userZoneId){
    let shotZoneId, diveZoneId;
    if(this.mode==="shoot"){
      shotZoneId = userZoneId;
      diveZoneId = this._keeperDive(shotZoneId);
    } else {
      diveZoneId = userZoneId;
      shotZoneId = this._attackerShot();
    }

    // The verdict has to be readable from the picture the player just watched:
    // keeper on the ball is a save, keeper at the other end is a goal. Only the
    // one-zone-away case (he got a hand to it) is left to a skill roll, so a
    // clean beat is never overturned by a dice throw behind the scenes.
    const reach = diveZoneId===shotZoneId ? "onIt"
      : zonesAdjacent(shotZoneId, diveZoneId) ? "stretch"
      : "beaten";
    const saved = reach==="onIt" ? true
      : reach==="beaten" ? false
      : Math.random() < this._stretchSaveChance(shotZoneId);

    // a fingertip save has to look like one, so on a won stretch the keeper
    // follows the ball rather than landing a zone away from it
    const diveShown = (saved && reach==="stretch") ? shotZoneId : diveZoneId;

    this._animate(shotZoneId, diveShown, ()=>{
      // told after the play, not before — the hint used to spoil the result
      this.hint.textContent = this.mode==="shoot"
        ? (saved ? "השוער קרא את הכיוון וחסם!" : "הרשת רועדת!")
        : (saved ? "הצלה מדהימה!" : "הכדור נכנס, אין מה לעשות.");
      const success = this.mode==="shoot" ? !saved : saved;
      setTimeout(()=> this.onResolve(success ? 1 : 0), 500);
    });
  }

  // AI keeper picks a dive zone; better keeperSkill relative to attackerSkill = more likely correct read
  _keeperDive(shotZoneId){
    const readChance = clamp01(0.22 + (this.keeperSkill-this.attackerSkill)/150);
    if(Math.random() < readChance) return shotZoneId;
    const others = AIM_ZONES.filter(z=>z.id!==shotZoneId);
    return randPick(others).id;
  }

  // AI attacker picks a shot zone, favoring corners slightly more as attackerSkill rises
  _attackerShot(){
    const weights = AIM_ZONES.map(z=>{
      const isCorner = z.id==="TL"||z.id==="TR"||z.id==="BL"||z.id==="BR";
      let w = isCorner ? 1 : 0.7;
      if(isCorner) w *= (1 + Math.max(0,(this.attackerSkill-50))/100);
      return w;
    });
    const total = weights.reduce((a,b)=>a+b,0);
    let r = Math.random()*total;
    for(let i=0;i<AIM_ZONES.length;i++){
      r -= weights[i];
      if(r<=0) return AIM_ZONES[i].id;
    }
    return AIM_ZONES[AIM_ZONES.length-1].id;
  }

  // only used for the contested case: the keeper went one zone off and has to
  // stretch. Corners stay hard to reach, a weak keeper reaches less often.
  _stretchSaveChance(shotZoneId){
    const zone = zoneById(shotZoneId);
    const skillFactor = clamp01(0.5 + (this.keeperSkill-this.attackerSkill)/150) * 1.4;
    return Math.max(0.05, Math.min(0.9, zone.saveBase * skillFactor * 0.5));
  }

  _animate(shotZoneId, diveZoneId, done){
    const shotTarget = zoneCenter(zoneById(shotZoneId), this.W, this.H);
    const diveTarget = zoneCenter(zoneById(diveZoneId), this.W, this.H);
    const ballStart = { x:this.ball.x, y:this.ball.y };
    const keeperStart = { x:this.keeper.x, y:this.keeper.y };
    const dur = 480;
    const t0 = performance.now();
    this.phase = "animating";
    const step = (now)=>{
      const p = Math.min(1, (now-t0)/dur);
      const e = 1 - Math.pow(1-p, 3);
      this.ball.x = ballStart.x + (shotTarget.x-ballStart.x)*e;
      this.ball.y = ballStart.y + (shotTarget.y-ballStart.y)*e;
      this.keeper.x = keeperStart.x + (diveTarget.x-keeperStart.x)*e;
      this.keeper.y = keeperStart.y + (diveTarget.y-keeperStart.y)*e;
      if(p<1) requestAnimationFrame(step);
      else { this.phase="done"; done(); }
    };
    requestAnimationFrame(step);
  }

  _loop(){
    const draw = (now)=>{
      this.t = (now||0)/1000;
      this._draw();
      if(this.phase!=="done") this._raf = requestAnimationFrame(draw);
    };
    draw();
  }

  // Behind-the-ball view of the goal in the soccer-game style: crowd and ad
  // boards seen through a white diamond net, bright striped grass in front.
  _backdrop(){
    if(this._bg) return this._bg;
    const W=this.W, H=this.H, goalBottom = this._goalBottom();
    const c = document.createElement("canvas"); c.width=W; c.height=H;
    const g = c.getContext("2d"), r = SoccerKit.rng(11), P = SoccerKit.PAL;
    const crowdH = goalBottom*0.62, boardY = crowdH, boardH = goalBottom*0.13;
    g.fillStyle = "#30343b"; g.fillRect(0,0,W,crowdH);
    const cols = [this.keeperKit.shirt, "#ffffff", "#ffffff", ...P.skin, "#222", "#e0241c", "#1f3fd1"];
    for(let y=2; y<crowdH-4; y+=7){
      g.fillStyle = (y/7|0)%2 ? "#3a3f47" : "#30343b"; g.fillRect(0,y+4,W,3);
      for(let x=(y/7|0)%2*3; x<W; x+=6){
        if(r()<0.12) continue;
        g.fillStyle = cols[(r()*cols.length)|0]; g.fillRect(x, y+2, 5, 4);
        g.fillStyle = P.skin[(r()*P.skin.length)|0]; g.fillRect(x+1, y-1, 3, 3);
      }
    }
    const boards = ["#c8161d","#1d3fb8"];
    g.font = `italic 700 ${boardH*0.62}px ${SoccerKit.FONT}`; g.textAlign="center"; g.textBaseline="middle"; g.direction="ltr";
    for(let i=0, x=0; x<W; i++, x+=W/3){
      g.fillStyle = boards[i%2]; g.fillRect(x, boardY, W/3, boardH);
      g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(x, boardY, W/3, boardH*.35);
      g.fillStyle = "#fff"; g.fillText(i%2 ? "MATCHDAY" : "STAR STRIKER", x+W/6, boardY+boardH/2+1);
    }
    const grassTop = boardY+boardH;
    for(let i=0, y=grassTop; y<H; i++, y+=16+i*3){
      g.fillStyle = i%2 ? P.grassA : P.grassB; g.fillRect(0, y, W, 16+i*3+1);
    }
    g.fillStyle = SoccerKit.makeNoisePattern(g); g.fillRect(0, grassTop, W, H-grassTop);
    // goal line and a worn goal mouth
    g.fillStyle = "rgba(255,255,255,.94)"; g.fillRect(0, goalBottom-1, W, 3);
    const wg = g.createRadialGradient(W/2, goalBottom+10, 4, W/2, goalBottom+10, W*0.4);
    wg.addColorStop(0,"rgba(220,235,170,.35)"); wg.addColorStop(1,"rgba(220,235,170,0)");
    g.fillStyle = wg; g.fillRect(0, goalBottom, W, H-goalBottom);
    return (this._bg = c);
  }
  _goalBottom(){ return this.H*0.62 + this.H*0.06; }

  _draw(){
    const ctx = this.ctx, W=this.W, H=this.H, t=this.t||0;
    const goalBottom = this._goalBottom();
    ctx.clearRect(0,0,W,H);
    ctx.drawImage(this._backdrop(), 0, 0);

    // net: faint white back panel and a diamond mesh
    ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(5,5,W-10,goalBottom-5);
    ctx.save();
    ctx.beginPath(); ctx.rect(5,5,W-10,goalBottom-5); ctx.clip();
    ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1;
    ctx.beginPath();
    for(let k=-goalBottom; k<W+goalBottom; k+=13){
      ctx.moveTo(k,0); ctx.lineTo(k+goalBottom,goalBottom);
      ctx.moveTo(k,0); ctx.lineTo(k-goalBottom,goalBottom);
    }
    ctx.stroke();
    ctx.restore();

    // zone guides (where you can aim)
    ctx.strokeStyle = "rgba(255,236,90,.55)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5,4]);
    ctx.beginPath(); ctx.moveTo(W/3,6); ctx.lineTo(W/3,goalBottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2*W/3,6); ctx.lineTo(2*W/3,goalBottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6,H*0.5); ctx.lineTo(W-6,H*0.5); ctx.stroke();
    ctx.setLineDash([]);

    // posts and crossbar: dark shadow, then white
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(6,goalBottom+2); ctx.lineTo(6,6); ctx.lineTo(W-4,6); ctx.lineTo(W-4,goalBottom+2); ctx.stroke();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(4,goalBottom); ctx.lineTo(4,4); ctx.lineTo(W-4,4); ctx.lineTo(W-4,goalBottom); ctx.stroke();

    this._drawKeeper(t);

    // ball: shrinks a little as it travels away toward the goal
    const k = clamp01((this.H-14 - this.ball.y) / (this.H-14 - this.H*0.1));
    const r = 10 - k*3.5;
    ctx.fillStyle = "rgba(0,25,0,.35)";
    ctx.beginPath(); ctx.ellipse(this.ball.x + 4, Math.min(H-4, this.ball.y + r + 2 + k*18), r*1.1, r*0.45, 0, 0, Math.PI*2); ctx.fill();
    SoccerKit.drawBallIcon(ctx, this.ball.x, this.ball.y, r, this.phase==="animating" ? t*14 : 0);
  }

  _drawKeeper(t){
    const lean = this.phase!=="idle" ? (this.keeper.x - this.W/2) / (this.W/2) : 0; // -1..1
    const figH = 92;
    // this.keeper tracks the keeper's body centre; the figure is drawn from the feet
    SoccerKit.drawFigure(this.ctx, this.keeper.x, Math.min(this._goalBottom() + 4, this.keeper.y + figH*0.5), figH,
      this.keeperKit, { skin:"#e3a97f", hair:"#1e1611" }, { pose:"keeper", lean: lean*0.95, seed:1 }, t);
  }
}
