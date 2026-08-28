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
  constructor(canvas, hint, mode, {attackerSkill, keeperSkill}){
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.hint = hint;
    this.mode = mode;
    this.attackerSkill = attackerSkill;
    this.keeperSkill = keeperSkill;
    this.W = canvas.width; this.H = canvas.height;
    this.locked = false;
    this.t = 0;
    this.phase = "idle"; // idle -> animating -> done
    this.ball = { x:this.W/2, y:this.H-14 };
    this.keeper = { x:this.W/2, y: this.H*0.06 + (this.H*0.62/2)*1.5 };
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
    const saveChance = this._saveChance(shotZoneId, diveZoneId);
    const saved = Math.random() < saveChance;

    this.hint.textContent = this.mode==="shoot"
      ? (saved ? "השוער קרא את הכיוון וחסם!" : "הרשת רועדת!")
      : (saved ? "הצלה מדהימה!" : "הכדור נכנס, אין מה לעשות.");

    this._animate(shotZoneId, diveZoneId, ()=>{
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

  _saveChance(shotZoneId, diveZoneId){
    const zone = zoneById(shotZoneId);
    const skillFactor = clamp01(0.5 + (this.keeperSkill-this.attackerSkill)/150) * 1.4;
    let chance = zone.saveBase * skillFactor;
    if(diveZoneId===shotZoneId) { /* full chance */ }
    else if(zonesAdjacent(shotZoneId, diveZoneId)) chance *= 0.35;
    else chance *= 0.08;
    return Math.max(0.03, Math.min(0.95, chance));
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
    const draw = ()=>{
      this._draw();
      if(this.phase!=="done") this._raf = requestAnimationFrame(draw);
    };
    draw();
  }

  _draw(){
    const ctx = this.ctx, W=this.W, H=this.H;
    ctx.clearRect(0,0,W,H);
    // grass backdrop
    ctx.fillStyle = "#0c3f24";
    ctx.fillRect(0,0,W,H);

    // goal mouth
    const goalH = H*0.62;
    ctx.fillStyle = "rgba(255,255,255,.06)";
    ctx.fillRect(0,0,W,goalH+H*0.06);
    // net lines
    ctx.strokeStyle = "rgba(255,255,255,.25)";
    ctx.lineWidth = 1;
    for(let x=0;x<=W;x+=16){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,goalH+H*0.06); ctx.stroke(); }
    for(let y=0;y<=goalH+H*0.06;y+=16){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    // posts
    ctx.strokeStyle = "#fff"; ctx.lineWidth=4;
    ctx.strokeRect(3,3,W-6,goalH+H*0.06-3);
    // zone dividers (guides)
    ctx.strokeStyle = "rgba(255,210,63,.35)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5,4]);
    ctx.beginPath(); ctx.moveTo(W/3,0); ctx.lineTo(W/3,goalH+H*0.06); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2*W/3,0); ctx.lineTo(2*W/3,goalH+H*0.06); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,H*0.5); ctx.lineTo(W,H*0.5); ctx.stroke();
    ctx.setLineDash([]);

    // keeper
    ctx.beginPath();
    ctx.arc(this.keeper.x, this.keeper.y, 14, 0, Math.PI*2);
    ctx.fillStyle = "#ffd23f";
    ctx.fill();
    ctx.strokeStyle="#04231a"; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle="#04231a"; ctx.font="10px Arial"; ctx.textAlign="center";
    ctx.fillText("🧤", this.keeper.x, this.keeper.y+4);

    // ball
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, 8, 0, Math.PI*2);
    ctx.fillStyle="#fff";
    ctx.fill();
    ctx.strokeStyle="#222"; ctx.lineWidth=1; ctx.stroke();
  }
}
