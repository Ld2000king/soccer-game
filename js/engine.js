// ===== Rendering + minigame engine =====

// ---- Generic timing-bar minigame (used both for training & match key moments) ----
class TimingBar{
  constructor(trackEl, zoneEl, markerEl, opts={}){
    this.track = trackEl;
    this.zone = zoneEl;
    this.marker = markerEl;
    this.speed = opts.speed || 1.6;     // cycles per second-ish
    this.pos = 0;
    this.dir = 1;
    this.running = false;
    this._raf = null;
    this._last = 0;
  }
  setZone(widthPct, centerPct){
    const w = Math.max(6, Math.min(60, widthPct));
    const c = Math.max(w/2, Math.min(100-w/2, centerPct));
    this.zoneStart = c - w/2;
    this.zoneEnd = c + w/2;
    this.zone.style.left = this.zoneStart + "%";
    this.zone.style.width = w + "%";
  }
  start(){
    this.running = true;
    this.pos = 0;
    this.dir = 1;
    this._last = performance.now();
    const loop = (t)=>{
      if(!this.running) return;
      const dt = (t - this._last)/1000;
      this._last = t;
      this.pos += this.dir * this.speed * dt * 100;
      if(this.pos >= 100){ this.pos = 100; this.dir = -1; }
      if(this.pos <= 0){ this.pos = 0; this.dir = 1; }
      this.marker.style.left = this.pos + "%";
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }
  stop(){
    this.running = false;
    if(this._raf) cancelAnimationFrame(this._raf);
  }
  // returns 0..1 score based on distance to zone center, 1 = perfect
  hit(){
    this.stop();
    const center = (this.zoneStart + this.zoneEnd)/2;
    const halfWidth = (this.zoneEnd - this.zoneStart)/2;
    const dist = Math.abs(this.pos - center);
    if(dist > halfWidth) {
      // outside zone: still give partial credit that decays fast
      const overshoot = dist - halfWidth;
      return Math.max(0, 0.35 - overshoot/60);
    }
    return 1 - (dist/halfWidth)*0.4; // between .6 and 1 inside zone
  }
}

// ---- Shared footballer figure ----
// Both minigames drew people as a stack of ellipses. A player reads as a
// player because of the parts a kit actually has: a jersey that is wide at
// the shoulders and narrow at the waist, sleeves and a collar in the trim
// colour, shorts, then socks and boots below bare knees.
const FIGURE_SKIN = "#e8b58c";
const FIGURE_HAIR = "#2b1a10";
const FIGURE_BOOT = "#15181d";
const FIGURE_EDGE = "rgba(4,12,8,.72)";

function drawFootballer(ctx, o){
  const { x, y, s = 1, shirt, trim } = o;
  const pose = o.pose || "run";
  const swing = o.swing || 0;      // running leg/arm cycle
  const lean = o.lean || 0;        // -1..1, keeper diving sideways
  const keeper = pose === "keeper";

  // ground shadow, squashed toward the direction of a dive
  ctx.beginPath();
  ctx.ellipse(x - lean*3*s, y + 16.5*s, 10*s, 3*s, 0, 0, Math.PI*2);
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.fill();

  // --- legs: bare thigh, sock in the trim colour, boot ---
  const drawLeg = (dx, dir) => {
    const knee = { x: x + dx + dir*swing*0.34 - lean*2.4*s, y: y + 9*s };
    const foot = { x: x + dx + dir*swing*0.95 - lean*4.6*s, y: y + 15*s };
    ctx.lineCap = "round";
    ctx.strokeStyle = FIGURE_SKIN; ctx.lineWidth = 3.4*s;
    ctx.beginPath(); ctx.moveTo(x + dx, y + 3*s); ctx.lineTo(knee.x, knee.y); ctx.stroke();
    ctx.strokeStyle = trim; ctx.lineWidth = 3.2*s;
    ctx.beginPath(); ctx.moveTo(knee.x, knee.y); ctx.lineTo(foot.x, foot.y); ctx.stroke();
    ctx.fillStyle = FIGURE_BOOT;
    ctx.beginPath();
    ctx.ellipse(foot.x + dir*1.3*s, foot.y + 1.4*s, 2.7*s, 1.7*s, 0, 0, Math.PI*2);
    ctx.fill();
  };
  drawLeg(-2.8*s, -1);
  drawLeg(2.8*s, 1);

  // --- shorts ---
  ctx.beginPath();
  ctx.moveTo(x - 5.4*s, y - 1.2*s);
  ctx.lineTo(x + 5.4*s, y - 1.2*s);
  ctx.lineTo(x + 4.7*s, y + 4.4*s);
  ctx.lineTo(x + 0.9*s, y + 3.5*s);
  ctx.lineTo(x - 0.9*s, y + 3.5*s);
  ctx.lineTo(x - 4.7*s, y + 4.4*s);
  ctx.closePath();
  ctx.fillStyle = trim; ctx.fill();
  ctx.strokeStyle = FIGURE_EDGE; ctx.lineWidth = 1*s; ctx.stroke();

  // --- arms: out wide for a keeper, swinging with the stride otherwise ---
  const armDrop = keeper ? -5.5*s : 0.5*s;
  const armOut  = keeper ? 9.5*s : 2.6*s;
  [-1, 1].forEach(dir => {
    const shoulder = { x: x + dir*5.6*s, y: y - 7.6*s };
    const hand = {
      x: shoulder.x + dir*armOut,
      y: shoulder.y + armDrop + (keeper ? 0 : dir*swing*0.5),
    };
    ctx.strokeStyle = FIGURE_SKIN; ctx.lineWidth = 2.7*s; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(shoulder.x, shoulder.y); ctx.lineTo(hand.x, hand.y); ctx.stroke();
    if(keeper){ // gloves
      ctx.fillStyle = "#f4f7fb";
      ctx.beginPath(); ctx.arc(hand.x, hand.y, 2.7*s, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = FIGURE_EDGE; ctx.lineWidth = 0.8*s; ctx.stroke();
    }
  });

  // --- jersey: broad shoulders tapering to the waist ---
  ctx.beginPath();
  ctx.moveTo(x - 6.5*s, y - 9.6*s);
  ctx.quadraticCurveTo(x - 7.5*s, y - 5.6*s, x - 5.5*s, y - 0.8*s);
  ctx.lineTo(x + 5.5*s, y - 0.8*s);
  ctx.quadraticCurveTo(x + 7.5*s, y - 5.6*s, x + 6.5*s, y - 9.6*s);
  ctx.quadraticCurveTo(x, y - 11.8*s, x - 6.5*s, y - 9.6*s);
  ctx.closePath();
  ctx.fillStyle = shirt; ctx.fill();
  ctx.strokeStyle = FIGURE_EDGE; ctx.lineWidth = 1.5*s; ctx.stroke();

  // sleeve caps and collar pick up the trim colour, the way a real kit does
  [-1, 1].forEach(dir => {
    ctx.beginPath();
    ctx.moveTo(x + dir*6.5*s, y - 9.6*s);
    ctx.quadraticCurveTo(x + dir*7.6*s, y - 7.4*s, x + dir*6.6*s, y - 6.1*s);
    ctx.lineTo(x + dir*4.6*s, y - 7.6*s);
    ctx.closePath();
    ctx.fillStyle = trim; ctx.fill();
    ctx.strokeStyle = FIGURE_EDGE; ctx.lineWidth = 0.8*s; ctx.stroke();
  });
  ctx.beginPath();
  ctx.ellipse(x, y - 10.5*s, 2.3*s, 1.3*s, 0, 0, Math.PI*2);
  ctx.fillStyle = trim; ctx.fill();

  // --- head, with hair sitting over the top half ---
  const hx = x + lean*1.6*s, hy = y - 14.8*s;
  ctx.beginPath(); ctx.arc(hx, hy, 3.7*s, 0, Math.PI*2);
  ctx.fillStyle = FIGURE_SKIN; ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = 0.8*s; ctx.stroke();
  ctx.beginPath();
  ctx.arc(hx, hy - 0.5*s, 3.7*s, Math.PI*0.98, Math.PI*2.02);
  ctx.closePath();
  ctx.fillStyle = FIGURE_HAIR; ctx.fill();
}
