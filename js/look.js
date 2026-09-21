// ===== Player look: live preview, appearance editor, accessory cards, avatar =====
// One editor is used in two places — on the create-player screen (no career yet,
// so it edits a plain look object) and on the in-game "מראה" screen (edits the
// saved player and persists every change). Hair, skin and boot colour are free
// and changeable any time; accessories are bought in the shop and worn here.

// The strip the figure wears: your club's colours once you have one
function lookKit(clubId){
  const club = clubId && CLUBS.find(c=>c.id===clubId);
  if(!club) return { shirt:"#00b386", shorts:"#ffd23f" };
  return matchKits(club, club).mine;
}

const POSES = ["idle", "run", "celebrate"];

// A canvas showing the figure large, on grass, animating. Tap to change pose.
class LookPreview{
  constructor(canvas, getLook, getKit){
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.getLook = getLook;
    this.getKit = getKit;
    this.pose = "idle";
    this.raf = null;
    this.noise = null;
    canvas.addEventListener("click", ()=>{
      this.pose = POSES[(POSES.indexOf(this.pose)+1) % POSES.length];
    });
  }

  start(){
    const t0 = performance.now();
    const loop = (now)=>{
      // stop once the canvas has left the page or its screen is hidden
      if(!this.canvas.isConnected || this.canvas.offsetParent===null){ this.raf = null; return; }
      this._draw((now-t0)/1000);
      this.raf = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(loop);
  }

  _draw(t){
    const c = this.canvas, dpr = Math.min(window.devicePixelRatio||1, 3);
    const W = c.clientWidth, H = c.clientHeight;
    if(c.width!==Math.round(W*dpr) || c.height!==Math.round(H*dpr)){
      c.width = Math.round(W*dpr); c.height = Math.round(H*dpr);
    }
    const ctx = this.ctx;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const P = SoccerKit.PAL;
    for(let i=0;i<7;i++){
      ctx.fillStyle = i%2 ? P.grassA : P.grassB;
      ctx.fillRect(0, H/7*i, W, H/7+1);
    }
    if(!this.noise) this.noise = SoccerKit.makeNoisePattern(ctx);
    ctx.fillStyle = this.noise; ctx.fillRect(0,0,W,H);
    const spot = ctx.createRadialGradient(W/2, H*0.72, 4, W/2, H*0.72, W*0.6);
    spot.addColorStop(0, "rgba(255,255,220,.28)"); spot.addColorStop(1, "rgba(255,255,220,0)");
    ctx.fillStyle = spot; ctx.fillRect(0,0,W,H);

    const figH = H*0.74;
    SoccerKit.drawFigure(ctx, W/2, H*0.93, figH, this.getKit(), this.getLook(),
      { pose:this.pose, seed:0.4 }, t);
  }
}

function _swatchRow(colors, current, onPick, extraClass){
  const row = document.createElement("div");
  row.className = "swatch-row " + (extraClass||"");
  colors.forEach(c=>{
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch" + (c.color.toLowerCase()===String(current).toLowerCase() ? " selected" : "");
    b.style.setProperty("--c", c.color);
    b.title = c.label || "";
    b.setAttribute("aria-label", c.label || c.color);
    b.addEventListener("click", ()=> onPick(c.color));
    row.appendChild(b);
  });
  return row;
}

// The free part of the editor: hair style, hair colour, skin, boot colour.
// `look` is mutated in place; `onChange` runs after every change (persist there).
function mountLookEditor(root, { look, getKit, resolve, onChange }){
  root.innerHTML = "";
  root.classList.add("look-editor");

  const canvas = document.createElement("canvas");
  canvas.className = "look-preview";
  root.appendChild(canvas);
  const hint = document.createElement("div");
  hint.className = "look-hint";
  hint.textContent = "לחץ על השחקן כדי לראות אותו בתנועה";
  root.appendChild(hint);

  const controls = document.createElement("div");
  root.appendChild(controls);

  const preview = new LookPreview(canvas, ()=> resolve(look), getKit);

  function section(title){
    const h = document.createElement("div");
    h.className = "field-label";
    h.textContent = title;
    controls.appendChild(h);
  }
  function change(patch){
    Object.assign(look, patch);
    if(onChange) onChange(look);
    render();
  }
  function render(){
    controls.innerHTML = "";

    const dice = document.createElement("button");
    dice.type = "button"; dice.className = "chip look-random";
    dice.textContent = "🎲 מראה אקראי";
    dice.addEventListener("click", ()=>{
      const r = randomLook();
      change({ skin:r.skin, style:r.style, hair:r.hair, boot:r.boot });
    });
    controls.appendChild(dice);

    section("תסרוקת");
    const styles = document.createElement("div");
    styles.className = "chip-row look-styles";
    HAIR_STYLES.forEach(s=>{
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (look.style===s.id ? " selected" : "");
      b.textContent = s.label;
      b.addEventListener("click", ()=> change({ style:s.id }));
      styles.appendChild(b);
    });
    controls.appendChild(styles);

    section("צבע שיער");
    controls.appendChild(_swatchRow(HAIR_COLORS, look.hair, c=> change({ hair:c })));
    section("צבע עור");
    controls.appendChild(_swatchRow(SKIN_TONES.map(c=>({color:c})), look.skin, c=> change({ skin:c })));
    section("צבע נעליים");
    controls.appendChild(_swatchRow(BOOT_COLORS, look.boot, c=> change({ boot:c })));
  }

  render();
  preview.start();
  return { preview, render };
}

// ---------- create-player screen ----------
const CreateLook = {
  look: null,
  reset(){
    this.look = defaultLook();
    createState.look = this.look;
    mountLookEditor($("#create-look"), {
      look: this.look,
      resolve: resolveLook,
      getKit: ()=> lookKit(createState.clubId),
    });
  },
};

// ---------- in-game look screen ----------
function _accessoryCards(container, { ownedOnly, onChange }){
  const p = Career.state.player;
  ACCESSORIES.forEach(item=>{
    const owned = p.accOwned.includes(item.id);
    if(ownedOnly && !owned) return;
    const worn = !!p.look.acc[item.id];
    const canAfford = p.money >= item.cost;
    const card = document.createElement("div");
    card.className = "shop-card acc-card" + (worn ? " equipped" : "");
    card.innerHTML = `
      <div class="shop-name">${item.icon} ${item.name}</div>
      <div class="shop-desc">${item.desc}</div>
      <div class="shop-cost">${owned ? "בבעלותך ✓" : item.cost.toLocaleString()+"₪"}</div>`;
    if(owned && item.tint){
      const cur = p.look.tints[item.id] || item.tint;
      card.appendChild(_swatchRow(TINT_COLORS, cur, c=>{
        Career.setAccessoryTint(item.id, c);
        if(!worn) Career.wearAccessory(item.id, true);
        onChange();
      }, "swatch-row-small"));
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shop-btn" + (owned ? " use" : "");
    if(!owned){
      btn.textContent = "קנה ולבש";
      btn.disabled = !canAfford;
      btn.addEventListener("click", ()=>{ if(Career.buyAccessory(item.id)) onChange(); });
    } else {
      btn.textContent = worn ? "הסר" : "לבש";
      btn.addEventListener("click", ()=>{ Career.wearAccessory(item.id, !worn); onChange(); });
    }
    card.appendChild(btn);
    container.appendChild(card);
  });
}

let _gameLookPreview = null;
function renderLookScreen(){
  const p = Career.state.player;
  $("#look-money").textContent = p.money.toLocaleString();
  const ed = mountLookEditor($("#look-editor"), {
    look: p.look,
    resolve: resolveLook,
    getKit: ()=> lookKit(p.clubId),
    onChange: ()=> Career.setLook({}),
  });
  _gameLookPreview = ed.preview;

  const list = $("#look-accessories");
  const draw = ()=>{
    list.innerHTML = "";
    $("#look-money").textContent = Career.state.player.money.toLocaleString();
    _accessoryCards(list, { ownedOnly:true, onChange:draw });
    if(!list.children.length){
      const empty = document.createElement("div");
      empty.className = "look-empty";
      empty.textContent = "עוד אין לך אביזרים. בחנות יש סרטי ראש, משקפיים, עגילים ועוד.";
      list.appendChild(empty);
    }
  };
  draw();
}

// ---------- shop: accessories tab ----------
function renderAccessoryShop(body){
  const p = Career.state.player;
  const top = document.createElement("div");
  top.className = "acc-top";
  const canvas = document.createElement("canvas");
  canvas.className = "look-preview look-preview-shop";
  top.appendChild(canvas);
  const edit = document.createElement("button");
  edit.type = "button"; edit.className = "shop-btn use";
  edit.textContent = "🎨 ערוך שיער, עור ונעליים";
  edit.addEventListener("click", ()=> openScreen("screen-look"));
  top.appendChild(edit);
  body.appendChild(top);
  new LookPreview(canvas, ()=> Career.playerLook(), ()=> lookKit(p.clubId)).start();

  _accessoryCards(body, { ownedOnly:false, onChange: renderShop });
}

// ---------- dashboard avatar ----------
function renderAvatar(el, p){
  let c = el.querySelector("canvas");
  if(!c){
    el.textContent = "";
    c = document.createElement("canvas");
    c.width = c.height = 84;
    c.className = "avatar-canvas";
    el.appendChild(c);
  }
  const ctx = c.getContext("2d");
  ctx.clearRect(0,0,c.width,c.height);
  ctx.fillStyle = "#0b3d1a";
  ctx.fillRect(0,0,c.width,c.height);
  SoccerKit.drawBust(ctx, c.width/2, c.height+2, c.width*0.98, lookKit(p.clubId), Career.playerLook(), 0);
}
