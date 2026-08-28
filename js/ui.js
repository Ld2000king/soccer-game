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
  const statLabels = {pace:"מהירות",shooting:"בעיטה",passing:"מסירה",dribbling:"כדרור",defending:"הגנה",physical:"כוח"};
  const bars = $("#stats-bars");
  bars.innerHTML = "";
  Object.keys(statLabels).forEach(k=>{
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `<div class="stat-label">${statLabels[k]}</div>
      <div class="stat-track"><div class="stat-fill" style="width:${p[k]}%"></div></div>
      <div class="stat-val">${p[k]}</div>`;
    bars.appendChild(row);
  });
  const extraLabels = {chemistry:"כימיה", coachTrust:"אמון מאמן"};
  Object.keys(extraLabels).forEach(k=>{
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `<div class="stat-label">${extraLabels[k]}</div>
      <div class="stat-track"><div class="stat-fill" style="width:${p[k]}%; background:linear-gradient(90deg,#8a7cff,#ff6fd8)"></div></div>
      <div class="stat-val">${p[k]}</div>`;
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
function renderTransferScreen(){
  const pt = Career.state.pendingTransfer;
  $("#transfer-desc").textContent = "מועדונים מציעים לך חוזה חדש. באיזה מועדון תרצה להמשיך?";
  const grid = $("#transfer-offers");
  grid.innerHTML = "";
  pt.offers.forEach(o=>{
    const c = Career.getClub(o.clubId);
    const el = document.createElement("div");
    el.className = "club-card";
    el.innerHTML = `
      <div class="club-crest" style="background:${c.primary}; color:${c.secondary}; border-color:${c.secondary}">${c.name.split(" ").map(w=>w[0]).join("").slice(0,3)}</div>
      <div class="club-name">${c.name}</div>
      <div class="club-rating">דירוג ${c.rating} • שכר ${o.wage}₪/שבוע</div>
    `;
    el.addEventListener("click", ()=>{
      Career.acceptTransfer(o.clubId);
      goDashboard();
    });
    grid.appendChild(el);
  });
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
