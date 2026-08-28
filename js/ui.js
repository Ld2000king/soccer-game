// ===== UI / screen orchestration =====

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function showScreen(id){
  $$(".screen").forEach(s=>s.classList.remove("active"));
  $("#"+id).classList.add("active");
}

// ---------- CREATE SCREEN ----------
let createState = { position:null, clubId:null };

function initCreateScreen(){
  const grid = $("#club-picker");
  grid.innerHTML = "";
  CLUBS.slice().sort((a,b)=>a.rating-b.rating).forEach(c=>{
    const el = document.createElement("div");
    el.className = "club-card";
    el.dataset.id = c.id;
    el.innerHTML = `
      <div class="club-crest" style="background:${c.primary}; color:${c.secondary}; border-color:${c.secondary}">${c.name.split(" ").map(w=>w[0]).join("").slice(0,3)}</div>
      <div class="club-name">${c.name}</div>
      <div class="club-rating">דירוג ${c.rating}</div>
    `;
    el.addEventListener("click", ()=>{
      $$(".club-card").forEach(e=>e.classList.remove("selected"));
      el.classList.add("selected");
      createState.clubId = c.id;
      updateStartButton();
    });
    grid.appendChild(el);
  });

  $$(".chip[data-pos]").forEach(chip=>{
    chip.addEventListener("click", ()=>{
      $$(".chip[data-pos]").forEach(c=>c.classList.remove("selected"));
      chip.classList.add("selected");
      createState.position = chip.dataset.pos;
      updateStartButton();
    });
  });

  $("#input-name").addEventListener("input", updateStartButton);
}

function updateStartButton(){
  const name = $("#input-name").value.trim();
  $("#btn-start-career").disabled = !(name.length>0 && createState.position && createState.clubId);
}

// ---------- DASHBOARD ----------
function renderDashboard(){
  const s = Career.state, p = s.player;
  const club = Career.myClub();

  $("#hud-avatar").textContent = p.name.slice(0,1).toUpperCase();
  $("#hud-name").textContent = p.name;
  $("#hud-club").textContent = `${club.name} • ${POSITIONS[p.position].label}`;
  $("#hud-age").textContent = p.age;
  $("#hud-rep").textContent = p.reputation;
  $("#hud-money").textContent = p.money.toLocaleString();
  $("#hud-energy-text").textContent = p.energy;
  $("#hud-starbucks").textContent = p.starBucks;

  $("#star-rating-value").textContent = "★ " + Career.starRating().toFixed(1);
  $("#star-rating-row").innerHTML = RELATIONSHIPS.map(r=>{
    const v = Career.rel(r.id);
    return `<div class="rel-chip" title="${r.label}">${r.icon}<div class="rel-bar"><div class="rel-fill" style="width:${v}%"></div></div></div>`;
  }).join("");

  $("#workrate-picker").innerHTML = WORK_RATES.map(w=>
    `<button class="wr-btn ${w.id===p.workRate?'active':''}" data-wr="${w.id}" title="${w.desc}">${"❤".repeat(w.hearts)}</button>`
  ).join("");
  $$("#workrate-picker .wr-btn").forEach(b=>{
    b.addEventListener("click", ()=>{ Career.setWorkRate(b.dataset.wr); renderDashboard(); });
  });
  $("#hud-week").textContent = s.week;
  $("#hud-season").textContent = s.season;

  const fixture = Career.myFixtureThisWeek();
  if(fixture){
    const home = Career.getClub(fixture.home), away = Career.getClub(fixture.away);
    const vs = fixture.home===p.clubId ? `${home.name} (בית) 🆚 ${away.name}` : `${home.name} 🆚 ${away.name} (חוץ)`;
    $("#next-fixture").textContent = `המשחק הבא: ${vs}`;
  } else {
    $("#next-fixture").textContent = "אין משחק השבוע";
  }
  $("#btn-play-match").disabled = !fixture;

  // stats bars
  const bars = $("#stats-bars");
  bars.innerHTML = "";
  STAT_KEYS.forEach(k=>{
    const eff = Career.effectiveStat(k);
    const bonus = Career.bootsBonus(k);
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `<div class="stat-label">${STAT_LABELS[k]}</div>
      <div class="stat-track"><div class="stat-fill" style="width:${eff}%"></div></div>
      <div class="stat-val">${eff}${bonus?`<span class="skill-boost">+${bonus}</span>`:""}</div>`;
    bars.appendChild(row);
  });

  // league table
  const rows = Career.sortedTable();
  let html = "<table><tr><th>מועדון</th><th>מ</th><th>נ</th><th>ת</th><th>הפ</th><th>הפ׳</th><th>נק</th></tr>";
  rows.forEach(r=>{
    const mine = r.club.id===p.clubId ? " class='me'" : "";
    html += `<tr${mine}><td>${r.club.name}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.gf}-${r.ga}</td><td>${r.gf-r.ga}</td><td>${r.pts}</td></tr>`;
  });
  html += "</table>";
  $("#league-table").innerHTML = html;

  // news
  $("#news-feed").innerHTML = s.news.map(n=>`<div class="news-item">${n}</div>`).join("") || "<div class='news-item'>אין עדכונים עדיין</div>";

  $("#btn-train").disabled = p.energy < 18;
}

function goDashboard(){
  if(Career.state.pendingTransfer){
    renderTransferScreen();
    showScreen("screen-transfer");
    return;
  }
  if(Career.state.pendingEvent){
    renderEventScreen();
    showScreen("screen-event");
    return;
  }
  renderDashboard();
  showScreen("screen-dashboard");
}

// ---------- LIFE EVENT ----------
function renderEventScreen(){
  const event = Career.currentEvent();
  if(!event){ goDashboard(); return; }
  $("#event-icon").textContent = event.icon;
  $("#event-title").textContent = event.title;
  $("#event-desc").textContent = event.desc;
  $("#event-a-label").textContent = event.a.label;
  $("#event-a-hint").textContent = event.a.hint;
  $("#event-b-label").textContent = event.b.label;
  $("#event-b-hint").textContent = event.b.hint;
}

// ---------- LIFESTYLE SHOP ----------
function renderLifestyleScreen(){
  const p = Career.state.player;
  $("#lifestyle-money").textContent = p.money.toLocaleString();

  const upkeep = Career.lifestyleUpkeep();
  $("#lifestyle-upkeep-banner").textContent = upkeep>0
    ? `תחזוקה שבועית כוללת: ${upkeep.toLocaleString()}₪ מנוכה מהמשכורת כל שבוע`
    : "";

  const wrap = $("#lifestyle-categories");
  wrap.innerHTML = "";
  LIFESTYLE_CATEGORIES.forEach(cat=>{
    const ownedId = p.lifestyle[cat.id];
    const section = document.createElement("div");
    section.className = "lifestyle-category";
    section.innerHTML = `<div class="lifestyle-category-title">${cat.icon} ${cat.label}</div>`;
    const grid = document.createElement("div");
    grid.className = "lifestyle-items";
    cat.items.forEach(item=>{
      const owned = ownedId===item.id;
      const canAfford = p.money >= item.cost;
      const card = document.createElement("div");
      card.className = "lifestyle-item" + (owned ? " owned" : "");
      card.innerHTML = `
        ${owned ? `<div class="lifestyle-item-badge">בבעלותך</div>` : ""}
        <div class="lifestyle-item-name">${item.name}</div>
        <div class="lifestyle-item-flavor">${item.flavor || ""}</div>
        <div class="lifestyle-item-cost">${item.cost.toLocaleString()}₪</div>
        ${item.upkeep>0 ? `<div class="lifestyle-item-upkeep">תחזוקה: ${item.upkeep.toLocaleString()}₪/שבוע</div>` : ""}
        <button class="lifestyle-buy-btn" ${owned || !canAfford ? "disabled" : ""}>${owned ? "בבעלותך" : "קנה"}</button>
      `;
      if(!owned){
        card.querySelector(".lifestyle-buy-btn").addEventListener("click", ()=>{
          if(Career.buyLifestyleItem(cat.id, item.id)) renderLifestyleScreen();
        });
      }
      grid.appendChild(card);
    });
    section.appendChild(grid);
    wrap.appendChild(section);
  });
}

// ---------- HUB & SUB-SCREENS ----------
function renderHub(){
  const p = Career.state.player;
  $("#hub-money").textContent = p.money.toLocaleString();
  $("#hub-sb").textContent = p.starBucks;
}

function renderSkills(){
  const p = Career.state.player;
  $("#skills-sb").textContent = p.starBucks;
  const list = $("#skills-list");
  list.innerHTML = "";
  STAT_KEYS.forEach(k=>{
    const base = p[k], eff = Career.effectiveStat(k), bonus = Career.bootsBonus(k);
    const cost = Career.upgradeCost(k);
    const maxed = base >= p.potential;
    const row = document.createElement("div");
    row.className = "skill-row";
    row.innerHTML = `
      <div class="skill-val">${eff}</div>
      <div class="skill-info">
        <div class="skill-name">${STAT_LABELS[k]}${bonus?`<span class="skill-boost">+${bonus} נעליים</span>`:""}</div>
        <div class="skill-track"><div class="skill-fill" style="width:${(base/p.potential)*100}%"></div></div>
      </div>
      <button class="skill-buy" ${maxed || !Career.canUpgrade(k) ? "disabled" : ""}>
        ${maxed ? "מקסימום" : `${cost} 💫`}
      </button>`;
    if(!maxed){
      row.querySelector(".skill-buy").addEventListener("click", ()=>{
        if(Career.upgradeSkill(k)) renderSkills();
      });
    }
    list.appendChild(row);
  });
}

let shopTab = "boots";
function renderShop(){
  const p = Career.state.player;
  $("#shop-money").textContent = p.money.toLocaleString();
  $$(".sub-tab[data-shoptab]").forEach(t=> t.classList.toggle("active", t.dataset.shoptab===shopTab));
  const body = $("#shop-body");
  body.innerHTML = "";

  if(shopTab==="boots"){
    BOOTS.forEach(b=>{
      const equipped = p.boots===b.id;
      const canAfford = p.money >= b.cost;
      const boostText = Object.keys(b.boosts).map(k=>`${STAT_LABELS[k]} +${b.boosts[k]}`).join(" • ");
      const card = document.createElement("div");
      card.className = "shop-card" + (equipped ? " equipped" : "");
      card.innerHTML = `
        <div class="shop-name">👟 ${b.name}</div>
        <div class="shop-desc">${b.desc}</div>
        ${boostText ? `<div class="shop-boosts">${boostText}</div>` : ""}
        <div class="shop-cost">${b.cost>0 ? b.cost.toLocaleString()+"₪" : "חינם"}</div>
        <button class="shop-btn" ${equipped || !canAfford ? "disabled" : ""}>${equipped ? "נעול עכשיו" : "קנה ונעל"}</button>`;
      if(!equipped){
        card.querySelector(".shop-btn").addEventListener("click", ()=>{
          if(Career.buyBoots(b.id)) renderShop();
        });
      }
      body.appendChild(card);
    });
  } else {
    CONSUMABLES.forEach(c=>{
      const owned = p.inventory[c.id] || 0;
      const canAfford = p.money >= c.cost;
      const card = document.createElement("div");
      card.className = "shop-card";
      card.innerHTML = `
        <div class="shop-name">${c.icon} ${c.name}</div>
        <div class="shop-desc">${c.desc}</div>
        <div class="shop-boosts">אנרגיה +${c.energy}${c.morale?` • מורל +${c.morale}`:""}</div>
        <div class="shop-cost">${c.cost.toLocaleString()}₪</div>
        <div class="shop-owned">במלאי: ${owned}</div>
        <button class="shop-btn buy" ${!canAfford ? "disabled" : ""}>קנה</button>
        <button class="shop-btn use" ${owned<1 || p.energy>=100 ? "disabled" : ""}>שתה עכשיו</button>`;
      const [buyBtn, useBtn] = card.querySelectorAll(".shop-btn");
      buyBtn.addEventListener("click", ()=>{ if(Career.buyConsumable(c.id)) renderShop(); });
      useBtn.addEventListener("click", ()=>{ if(Career.useConsumable(c.id)) renderShop(); });
      body.appendChild(card);
    });
  }
}

function renderSponsors(){
  const p = Career.state.player;
  $("#sponsor-income").textContent = Career.sponsorIncome().toLocaleString();
  const list = $("#sponsors-list");
  list.innerHTML = "";
  SPONSORS.forEach(sp=>{
    const signed = p.sponsors.includes(sp.id);
    const locked = p.reputation < sp.reqReputation;
    const card = document.createElement("div");
    card.className = "sponsor-card" + (signed ? " signed" : locked ? " locked" : "");
    card.innerHTML = `
      <div class="sponsor-icon">${sp.icon}</div>
      <div class="sponsor-info">
        <div class="sponsor-name">${sp.name}</div>
        <div class="sponsor-desc">${sp.desc}</div>
        <div class="sponsor-terms">${sp.weekly.toLocaleString()}₪/שבוע • מענק ${sp.signBonus.toLocaleString()}₪</div>
        ${locked ? `<div class="sponsor-desc">🔒 דרוש מוניטין ${sp.reqReputation} (יש לך ${p.reputation})</div>` : ""}
      </div>
      <button class="shop-btn" ${signed || locked ? "disabled" : ""}>${signed ? "חתום ✓" : "חתום"}</button>`;
    if(!signed && !locked){
      card.querySelector(".shop-btn").addEventListener("click", ()=>{
        if(Career.signSponsor(sp.id)) renderSponsors();
      });
    }
    list.appendChild(card);
  });
}

function renderCareerStats(){
  const p = Career.state.player;
  const avg = Career.averageRating();
  const rows = [
    ["הופעות", p.appearances],
    ["שערים", p.goals],
    ["בישולים", p.assists],
    ["שחקן המשחק", p.starMan],
    ["ציון ממוצע", avg!=null ? avg : "—"],
    ["ציון אחרון", p.lastRating!=null ? p.lastRating : "—"],
    ["דירוג כוכב", "★ " + Career.starRating().toFixed(1)],
    ["מוניטין", p.reputation],
    ["שכר שבועי", p.wage.toLocaleString()+"₪"],
    ["הכנסה מחסויות", Career.sponsorIncome().toLocaleString()+"₪/שבוע"],
    ["תחזוקת לייף סטייל", Career.lifestyleUpkeep().toLocaleString()+"₪/שבוע"],
  ];
  $("#career-stats-body").innerHTML = rows.map(([l,v])=>
    `<div class="cs-row"><span class="cs-label">${l}</span><span class="cs-value">${v}</span></div>`
  ).join("") + RELATIONSHIPS.map(r=>
    `<div class="cs-row"><span class="cs-label">${r.icon} ${r.label}</span><span class="cs-value">${Math.round(Career.rel(r.id))}</span></div>`
  ).join("");
}

// ---------- CASINO ----------
let casinoTab = "slots";
function renderCasino(){
  const p = Career.state.player;
  $("#casino-money").textContent = p.money.toLocaleString();
  $$(".sub-tab[data-casinotab]").forEach(t=> t.classList.toggle("active", t.dataset.casinotab===casinoTab));

  $("#stake-picker").innerHTML = Casino.stakes().map(v=>
    `<button class="wr-btn ${v===Casino.stake?'active':''}" data-stake="${v}">${v.toLocaleString()}₪</button>`
  ).join("");
  $$("#stake-picker .wr-btn").forEach(b=>{
    b.addEventListener("click", ()=>{ Casino.setStake(+b.dataset.stake); renderCasino(); });
  });

  const body = $("#casino-body");
  const canBet = Casino.canBet();
  if(casinoTab==="slots"){
    body.innerHTML = `
      <div class="slot-reels">
        <div class="slot-reel" id="reel0">⚽</div>
        <div class="slot-reel" id="reel1">🏆</div>
        <div class="slot-reel" id="reel2">⭐</div>
      </div>
      <button id="btn-spin" class="btn btn-primary btn-lg" ${canBet?"":"disabled"}>סובב! (${Casino.stake.toLocaleString()}₪)</button>`;
    $("#btn-spin").addEventListener("click", playSlots);
  } else if(casinoTab==="roulette"){
    body.innerHTML = `
      <div class="roulette-wheel" id="wheel">?</div>
      <div class="roulette-grid">
        <button class="roulette-bet red" data-bet="red">אדום ×2</button>
        <button class="roulette-bet green" data-bet="green">0 ×36</button>
        <button class="roulette-bet black" data-bet="black">שחור ×2</button>
      </div>`;
    $$(".roulette-bet").forEach(b=>{
      b.disabled = !canBet;
      b.addEventListener("click", ()=> playRoulette(b.dataset.bet));
    });
  } else {
    const b = Casino.bj;
    if(!b){
      body.innerHTML = `<button id="btn-deal" class="btn btn-primary btn-lg" ${canBet?"":"disabled"}>חלק קלפים (${Casino.stake.toLocaleString()}₪)</button>`;
      $("#btn-deal").addEventListener("click", ()=>{ Casino.newBlackjackHand(); $("#casino-result").textContent=""; renderCasino(); });
    } else {
      const st = Casino.bjState();
      const cards = arr => arr.map(c=>`<div class="bj-card">${Casino.cardLabel(c)}</div>`).join("");
      body.innerHTML = `
        <div class="bj-hands">
          <div><div class="bj-hand-label">הדילר (${st.done?st.dealerValue:"?"})</div>
            <div class="bj-cards">${st.done ? cards(st.dealer) : `<div class="bj-card">${Casino.cardLabel(st.dealer[0])}</div><div class="bj-card">?</div>`}</div></div>
          <div><div class="bj-hand-label">אתה (${st.playerValue})</div>
            <div class="bj-cards">${cards(st.player)}</div></div>
        </div>
        <div class="bj-actions">
          ${st.done
            ? `<button id="btn-newhand" class="btn btn-primary">יד חדשה</button>`
            : `<button id="btn-hit" class="btn btn-secondary">עוד קלף</button>
               <button id="btn-stand" class="btn btn-primary">עוצר</button>`}
        </div>`;
      if(st.done){
        $("#btn-newhand").addEventListener("click", ()=>{
          if(!Casino.canBet()){ Casino.bj=null; renderCasino(); return; }
          Casino.newBlackjackHand(); $("#casino-result").textContent=""; renderCasino();
        });
      } else {
        $("#btn-hit").addEventListener("click", ()=>{ const r=Casino.bjHit(); renderCasino(); if(r.done) showCasinoResult(Casino.bj.result, false); });
        $("#btn-stand").addEventListener("click", ()=>{ Casino.bjStand(); renderCasino(); showCasinoResult(Casino.bj.result, false); });
      }
    }
  }
}

function showCasinoResult(text, won){
  const el = $("#casino-result");
  el.textContent = text;
  el.className = "casino-result " + (won ? "win" : "lose");
  renderDashboardIfVisible();
}

function renderDashboardIfVisible(){
  if($("#screen-dashboard").classList.contains("active")) renderDashboard();
}

function playSlots(){
  const reels = [$("#reel0"), $("#reel1"), $("#reel2")];
  reels.forEach(r=> r.classList.add("spinning"));
  $("#casino-result").textContent = "";
  const res = Casino.spinSlots();
  reels.forEach((r,i)=>{
    setTimeout(()=>{
      r.classList.remove("spinning");
      r.textContent = res.reels[i];
      if(i===2){
        $("#casino-money").textContent = Career.state.player.money.toLocaleString();
        showCasinoResult(res.label, res.won);
        const btn = $("#btn-spin");
        if(btn) btn.disabled = !Casino.canBet();
      }
    }, 400 + i*350);
  });
}

function playRoulette(betType){
  const wheel = $("#wheel");
  wheel.classList.add("spinning");
  $("#casino-result").textContent = "";
  const res = Casino.spinRoulette(betType);
  setTimeout(()=>{
    wheel.classList.remove("spinning");
    wheel.textContent = res.number;
    wheel.style.borderColor = res.color==="green" ? "#00e0a8" : res.color==="red" ? "#d21f3c" : "#888";
    $("#casino-money").textContent = Career.state.player.money.toLocaleString();
    showCasinoResult(res.label, res.won);
    $$(".roulette-bet").forEach(b=> b.disabled = !Casino.canBet());
  }, 1200);
}

// ---------- TRAINING ----------
let currentTraining = null;
let trainingBar = null;

function startTrainingFlow(){
  const p = Career.state.player;
  if(p.energy < 18){ return; }
  const weighted = TRAININGS.filter(t=>POSITIONS[p.position].key.includes(t.stat)).concat(TRAININGS);
  currentTraining = randPick(weighted);

  const picker = $("#training-stat-picker");
  picker.innerHTML = TRAININGS.map(t=>`<button class="chip ${t.id===currentTraining.id?'selected':''}" data-t="${t.id}">${t.label}</button>`).join("");
  $$("#training-stat-picker .chip").forEach(chip=>{
    chip.addEventListener("click", ()=>{
      currentTraining = TRAININGS.find(t=>t.id===chip.dataset.t);
      $$("#training-stat-picker .chip").forEach(c=>c.classList.remove("selected"));
      chip.classList.add("selected");
      $("#training-desc").textContent = currentTraining.desc;
    });
  });

  $("#training-title").textContent = currentTraining.label;
  $("#training-desc").textContent = currentTraining.desc;
  $("#training-result").textContent = "";

  trainingBar = new TimingBar($("#timing-track"), $("#timing-zone"), $("#timing-marker"));
  trainingBar.setZone(24, 40 + Math.random()*20);
  trainingBar.speed = 1.2 + Career.overall()/120; // higher overall = slightly faster (harder)
  trainingBar.start();

  showScreen("screen-training");
}

function resolveTraining(){
  if(!trainingBar) return;
  const score = trainingBar.hit();
  const gain = Career.applyTraining(currentTraining.stat, score);
  const verdict = score>0.85 ? "מושלם! 💪" : score>0.5 ? "טוב מאוד" : score>0.2 ? "בסדר" : "פספוס כמעט מוחלט";
  $("#training-result").textContent = `${verdict} — ${currentTraining.label}: ${gain>0? "+"+gain : "0"}`;
  Career.save();
  setTimeout(()=>{ goDashboard(); }, 1100);
}

// ---------- TRANSFER ----------
function crestInitials(c){ return c.name.split(" ").map(w=>w[0]).join("").slice(0,3); }

function renderTransferScreen(){
  const pt = Career.state.pendingTransfer;
  const isMidSeason = pt.offers.length===1;
  $("#transfer-title").textContent = isMidSeason ? "הצעת העברה" : "חלון העברות";
  $("#transfer-desc").textContent = isMidSeason
    ? "מועדון מתעניין בשירותיך באמצע העונה!"
    : "מועדונים מציעים לך חוזה חדש. באיזה מועדון תרצה להמשיך?";
  const grid = $("#transfer-offers");
  grid.innerHTML = "";
  pt.offers.forEach(o=>{
    const c = Career.getClub(o.clubId);
    const el = document.createElement("div");
    el.className = "club-card";
    el.innerHTML = `
      <div class="club-crest" style="background:${c.primary}; color:${c.secondary}; border-color:${c.secondary}">${crestInitials(c)}</div>
      <div class="club-name">${c.name}</div>
      <div class="club-rating">דירוג ${c.rating} • שכר ${o.wage}₪/שבוע</div>
    `;
    el.addEventListener("click", ()=>{
      negotiateClubId = o.clubId;
      renderNegotiateScreen();
      showScreen("screen-negotiate");
    });
    grid.appendChild(el);
  });
}

// ---------- CONTRACT NEGOTIATION ----------
let negotiateClubId = null;

function currentOffer(){
  if(!Career.state.pendingTransfer) return null;
  return Career.state.pendingTransfer.offers.find(o=>o.clubId===negotiateClubId) || null;
}

function renderNegotiateScreen(){
  const offer = currentOffer();
  if(!offer){ goDashboard(); return; }
  const c = Career.getClub(negotiateClubId);
  $("#negotiate-crest").textContent = crestInitials(c);
  $("#negotiate-crest").style.background = c.primary;
  $("#negotiate-crest").style.color = c.secondary;
  $("#negotiate-crest").style.borderColor = c.secondary;
  $("#negotiate-club-name").textContent = c.name;
  $("#negotiate-club-rating").textContent = `דירוג מועדון ${c.rating}`;
  $("#negotiate-wage").textContent = `${offer.wage.toLocaleString()}₪ / שבוע`;
  $("#negotiate-status").textContent = "";
  $("#btn-negotiate-wage").disabled = offer.attempts>=3;
}

function backToOffersOrDashboard(){
  if(Career.state.pendingTransfer && Career.state.pendingTransfer.offers.length>0){
    renderTransferScreen();
    showScreen("screen-transfer");
  } else {
    goDashboard();
  }
}

// ---------- WIRE STATIC BUTTONS ----------
document.addEventListener("DOMContentLoaded", ()=>{
  initCreateScreen();

  if(Career.hasSave()){
    $("#btn-continue").style.display = "block";
  }

  $("#btn-new-game").addEventListener("click", ()=>{
    createState = {position:null, clubId:null};
    showScreen("screen-create");
  });

  $("#btn-continue").addEventListener("click", ()=>{
    Career.load();
    goDashboard();
  });

  $("#btn-start-career").addEventListener("click", ()=>{
    const name = $("#input-name").value.trim();
    Career.newGame(name, createState.position, createState.clubId);
    goDashboard();
  });

  $("#btn-train").addEventListener("click", startTrainingFlow);
  $("#btn-timing-hit").addEventListener("click", resolveTraining);

  // hub + sub-screen navigation
  const SCREEN_RENDERERS = {
    "screen-hub": renderHub,
    "screen-skills": renderSkills,
    "screen-shop": renderShop,
    "screen-sponsors": renderSponsors,
    "screen-casino": renderCasino,
    "screen-career-stats": renderCareerStats,
    "screen-lifestyle": renderLifestyleScreen,
  };
  function openScreen(id){
    const render = SCREEN_RENDERERS[id];
    if(render) render();
    showScreen(id);
  }

  $("#btn-hub").addEventListener("click", ()=> openScreen("screen-hub"));
  $$(".hub-tile[data-goto]").forEach(t=>{
    t.addEventListener("click", ()=> openScreen(t.dataset.goto));
  });
  // every sub-screen's back arrow returns to the hub, except the hub itself
  $$("[data-back]").forEach(b=>{
    const screen = b.closest(".screen");
    b.addEventListener("click", ()=>{
      if(screen && screen.id==="screen-hub") goDashboard();
      else openScreen("screen-hub");
    });
  });
  $("#btn-lifestyle-back").addEventListener("click", ()=> openScreen("screen-hub"));

  $$(".sub-tab[data-shoptab]").forEach(t=>{
    t.addEventListener("click", ()=>{ shopTab = t.dataset.shoptab; renderShop(); });
  });
  $$(".sub-tab[data-casinotab]").forEach(t=>{
    t.addEventListener("click", ()=>{ casinoTab = t.dataset.casinotab; Casino.bj = null; $("#casino-result").textContent=""; renderCasino(); });
  });

  $("#btn-rest").addEventListener("click", ()=>{
    Career.rest();
    Career.save();
    renderDashboard();
  });

  $("#btn-play-match").addEventListener("click", ()=>{
    MatchController.startMatch();
  });

  $("#btn-match-continue").addEventListener("click", ()=>{
    $("#match-end-overlay").classList.add("hidden");
    Career.advanceWeek();
    goDashboard();
  });

  $("#btn-skip-transfer").addEventListener("click", ()=>{
    Career.skipTransfer();
    goDashboard();
  });

  $("#btn-event-a").addEventListener("click", ()=>{
    Career.resolveEvent("a");
    goDashboard();
  });
  $("#btn-event-b").addEventListener("click", ()=>{
    Career.resolveEvent("b");
    goDashboard();
  });

  $("#btn-sign-contract").addEventListener("click", ()=>{
    Career.acceptTransfer(negotiateClubId);
    goDashboard();
  });

  $("#btn-negotiate-wage").addEventListener("click", ()=>{
    const res = Career.negotiate(negotiateClubId);
    if(res.result==="raised"){
      $("#negotiate-wage").textContent = `${res.wage.toLocaleString()}₪ / שבוע`;
      $("#negotiate-status").textContent = "המועדון הסכים להעלות את ההצעה! 💰";
      $("#btn-negotiate-wage").disabled = currentOffer().attempts>=3;
    } else if(res.result==="hold"){
      $("#negotiate-status").textContent = "המועדון עומד על ההצעה המקורית.";
      $("#btn-negotiate-wage").disabled = currentOffer() ? currentOffer().attempts>=3 : true;
    } else {
      $("#negotiate-status").textContent = "המועדון מבטל את ההצעה — לחצת יותר מדי חזק.";
      setTimeout(()=> backToOffersOrDashboard(), 1400);
    }
  });

  $("#btn-decline-offer").addEventListener("click", ()=>{
    Career.declineOffer(negotiateClubId);
    backToOffersOrDashboard();
  });

  $$(".dash-tab").forEach(tab=>{
    tab.addEventListener("click", ()=>{
      $$(".dash-tab").forEach(t=>t.classList.remove("active"));
      tab.classList.add("active");
      const which = tab.dataset.tab;
      $$(".card-table, .card-news").forEach(card=>{
        card.classList.toggle("panel-active", card.dataset.panel===which);
      });
    });
  });
});
