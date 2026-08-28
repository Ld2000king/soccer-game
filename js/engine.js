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

// ---- Canvas pitch renderer with lightweight "real" animation ----
class PitchRenderer{
  constructor(canvas){
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width;
    this.H = canvas.height;
    this.time = 0;
    this.particles = [];
    this.ball = { x:this.W/2, y:this.H/2, tx:this.W/2, ty:this.H/2, z:0, tz:0 };
    this.players = []; // {x,y,tx,ty,color,secondary,number,label}
    this.flash = 0;
    this._raf = null;
    this.crowdSeed = Array.from({length:120}, ()=>Math.random());
  }

  setPlayers(players){ this.players = players; }

  moveBall(x,y,z=0, duration=0.6){
    this.ball.fromX = this.ball.x; this.ball.fromY = this.ball.y; this.ball.fromZ = this.ball.z;
    this.ball.tx = x; this.ball.ty = y; this.ball.tz = z;
    this.ball.t0 = this.time; this.ball.dur = duration;
  }

  celebrate(x,y){
    for(let i=0;i<40;i++){
      const ang = Math.random()*Math.PI*2;
      const spd = 60+Math.random()*160;
      this.particles.push({
        x, y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd - 80,
        life:1, color: Math.random()>0.5 ? "#ffd23f":"#00d9a3"
      });
    }
    this.flash = 1;
  }

  start(){
    let last = performance.now();
    const loop = (t)=>{
      const dt = Math.min(0.05,(t-last)/1000);
      last = t;
      this.time += dt;
      this._update(dt);
      this._draw();
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }
  stop(){ if(this._raf) cancelAnimationFrame(this._raf); }

  _update(dt){
    // ease ball toward target
    if(this.ball.dur){
      const p = Math.min(1, (this.time - this.ball.t0)/this.ball.dur);
      const e = 1 - Math.pow(1-p, 3); // ease-out cubic
      this.ball.x = this.ball.fromX + (this.ball.tx - this.ball.fromX)*e;
      this.ball.y = this.ball.fromY + (this.ball.ty - this.ball.fromY)*e;
      this.ball.z = this.ball.fromZ + (this.ball.tz - this.ball.fromZ)*e;
      if(p>=1) this.ball.dur = 0;
    }
    // players ease toward target
    this.players.forEach(pl=>{
      if(pl.tx!=null){
        pl.x += (pl.tx - pl.x)*Math.min(1,dt*3);
        pl.y += (pl.ty - pl.y)*Math.min(1,dt*3);
      }
    });
    // particles
    this.particles.forEach(pt=>{
      pt.x += pt.vx*dt; pt.y += pt.vy*dt; pt.vy += 220*dt; pt.life -= dt*0.8;
    });
    this.particles = this.particles.filter(p=>p.life>0);
    if(this.flash>0) this.flash = Math.max(0, this.flash - dt*1.2);
  }

  _draw(){
    const ctx = this.ctx, W=this.W, H=this.H;
    ctx.clearRect(0,0,W,H);

    // mowed-grass stripes
    const stripes = 12;
    for(let i=0;i<stripes;i++){
      ctx.fillStyle = i%2===0 ? "#0f4a2b" : "#0c3f24";
      ctx.fillRect(0, H/stripes*i, W, H/stripes+1);
    }

    // crowd strip (top) with flicker for atmosphere
    ctx.save();
    ctx.fillStyle = "#111a2b";
    ctx.fillRect(0,0,W,26);
    for(let i=0;i<this.crowdSeed.length;i++){
      const flick = 0.5 + 0.5*Math.sin(this.time*3 + i);
      const s = this.crowdSeed[i];
      ctx.fillStyle = `rgba(${180+60*s},${180+40*s},${200},${0.15+0.25*flick})`;
      ctx.fillRect((i*(W/this.crowdSeed.length)), 4 + (s*14), 5, 10);
    }
    ctx.restore();

    // pitch lines
    ctx.strokeStyle = "rgba(255,255,255,.75)";
    ctx.lineWidth = 2;
    const m = 20;
    ctx.strokeRect(m, m+20, W-2*m, H-2*m-20);
    ctx.beginPath(); ctx.moveTo(m, H/2+10); ctx.lineTo(W-m, H/2+10); ctx.stroke();
    ctx.beginPath(); ctx.arc(W/2, H/2+10, 55, 0, Math.PI*2); ctx.stroke();
    // penalty boxes
    ctx.strokeRect(m, m+20, 140, 220);
    ctx.strokeRect(W-m-140, m+20, 140, 220);
    ctx.strokeRect(m, H-m-220, 140, 220);
    ctx.strokeRect(W-m-140, H-m-220, 140, 220);
    // goals
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.fillRect(W/2-40, m+16, 80, 6);
    ctx.fillRect(W/2-40, H-m-22, 80, 6);

    // players — small human silhouettes with a light jogging animation
    this.players.forEach((pl,idx)=> this._drawPlayer(pl, idx));

    // ball with rotation lines + arc-shadow for "height"
    const bz = this.ball.z||0;
    ctx.beginPath();
    ctx.ellipse(this.ball.x, this.ball.y+6, 6-bz*0.02, 3-bz*0.01, 0,0,Math.PI*2);
    ctx.fillStyle = "rgba(0,0,0,.3)";
    ctx.fill();
    const by = this.ball.y - bz*0.5;
    ctx.beginPath();
    ctx.arc(this.ball.x, by, 6, 0, Math.PI*2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#222"; ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(this.ball.x-5, by); ctx.lineTo(this.ball.x+5, by);
    ctx.moveTo(this.ball.x, by-5); ctx.lineTo(this.ball.x, by+5);
    ctx.stroke();

    // particles (goal celebration)
    this.particles.forEach(p=>{
      ctx.globalAlpha = Math.max(0,p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x-2,p.y-2,4,4);
      ctx.globalAlpha = 1;
    });

    // goal flash
    if(this.flash>0){
      ctx.fillStyle = `rgba(255,210,63,${this.flash*0.25})`;
      ctx.fillRect(0,0,W,H);
    }
  }

  _drawPlayer(pl, idx){
    const ctx = this.ctx;
    const x = pl.x, y = pl.y;
    const s = pl.hero ? 1.15 : 1; // slight scale-up for the hero
    const cycle = this.time*6 + idx*1.7;
    const legSwing = Math.sin(cycle) * 3.5;
    const armSwing = Math.sin(cycle + Math.PI) * 2.6;

    // shadow
    ctx.beginPath();
    ctx.ellipse(x, y+13*s, 8*s, 3*s, 0, 0, Math.PI*2);
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.fill();

    // legs (dark shorts-to-boot, alternating stride)
    ctx.strokeStyle = "#1c1c1c";
    ctx.lineWidth = 2.6*s;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x-2.2*s, y+3*s); ctx.lineTo(x-2.2*s+legSwing*0.4*s, y+12*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+2.2*s, y+3*s); ctx.lineTo(x+2.2*s-legSwing*0.4*s, y+12*s); ctx.stroke();

    // shorts
    ctx.fillStyle = pl.secondary || "#ffffff";
    ctx.fillRect(x-4*s, y+1.5*s, 8*s, 4*s);

    // torso / jersey
    ctx.beginPath();
    ctx.ellipse(x, y-2.5*s, 5.6*s, 6.6*s, 0, 0, Math.PI*2);
    ctx.fillStyle = pl.color;
    ctx.fill();
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = pl.secondary || "#ffffff";
    ctx.stroke();

    // arms
    ctx.strokeStyle = pl.color;
    ctx.lineWidth = 2.2*s;
    ctx.beginPath(); ctx.moveTo(x-5.6*s, y-5.5*s); ctx.lineTo(x-5.6*s+armSwing*0.5*s, y+0.5*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+5.6*s, y-5.5*s); ctx.lineTo(x+5.6*s-armSwing*0.5*s, y+0.5*s); ctx.stroke();

    // jersey number
    if(pl.number){
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${6.5*s}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(pl.number, x, y-1.5*s);
    }

    // head + hair
    ctx.beginPath();
    ctx.arc(x, y-10.5*s, 3.2*s, 0, Math.PI*2);
    ctx.fillStyle = "#e3ac82";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.25)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y-11.6*s, 3.2*s, Math.PI, Math.PI*2);
    ctx.fillStyle = "#2b1a10";
    ctx.fill();

    // hero highlight ring
    if(pl.hero){
      ctx.beginPath();
      ctx.arc(x, y-2*s, 17*s, 0, Math.PI*2);
      ctx.strokeStyle = "rgba(255,210,63,.85)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
