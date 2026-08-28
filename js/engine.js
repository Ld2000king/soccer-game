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
